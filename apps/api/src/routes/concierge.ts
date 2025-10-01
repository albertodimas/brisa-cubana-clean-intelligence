import { Hono } from "hono";
import { db } from "../lib/db";
import { getAuthUser, requireAuth } from "../middleware/auth";
import { rateLimiter, RateLimits } from "../middleware/rate-limit";
import { generateAIResponse } from "../services/ai";
import { logger } from "../lib/logger";
import { z } from "zod";
import { ValidationError, NotFoundError, ForbiddenError } from "../lib/errors";

const concierge = new Hono();

// Apply rate limiting - more restrictive for AI endpoints
concierge.use("/*", rateLimiter(RateLimits.write));

// Schema for creating a new conversation
const createConversationSchema = z.object({
  channel: z.enum(["WEB", "WHATSAPP", "SMS", "EMAIL"]).optional(),
  bookingId: z.string().optional(),
  propertyId: z.string().optional(),
  initialMessage: z.string().min(1).max(2000).optional(),
});

// Schema for sending a message
const sendMessageSchema = z.object({
  content: z.string().min(1).max(2000),
});

// Create a new conversation
concierge.post("/conversations", requireAuth(), async (c) => {
  const authUser = getAuthUser(c);

  if (!authUser) {
    throw new ForbiddenError();
  }

  const json = (await c.req.json()) as unknown;
  const parseResult = createConversationSchema.safeParse(json);

  if (!parseResult.success) {
    throw new ValidationError(
      "Invalid conversation payload",
      parseResult.error.flatten().fieldErrors,
    );
  }

  const payload = parseResult.data;

  // Create conversation
  const conversation = await db.conversation.create({
    data: {
      userId: authUser.sub,
      channel: payload.channel ?? "WEB",
      bookingId: payload.bookingId,
      propertyId: payload.propertyId,
      title: payload.initialMessage
        ? payload.initialMessage.substring(0, 50) + "..."
        : "Nueva conversación",
    },
  });

  logger.info(
    { conversationId: conversation.id, userId: authUser.sub },
    "New conversation created",
  );

  // If there's an initial message, send it
  if (payload.initialMessage) {
    // Create user message
    const userMessage = await db.message.create({
      data: {
        conversationId: conversation.id,
        role: "USER",
        content: payload.initialMessage,
      },
    });

    // Get user context for AI
    const context = await getUserContext(authUser.sub, {
      bookingId: payload.bookingId,
      propertyId: payload.propertyId,
    });

    // Generate AI response
    const aiResponse = await generateAIResponse(
      [{ role: "USER", content: payload.initialMessage }],
      context,
    );

    // Save AI message
    const assistantMessage = await db.message.create({
      data: {
        conversationId: conversation.id,
        role: "ASSISTANT",
        content: aiResponse.content,
        model: aiResponse.model,
        tokens: aiResponse.tokens,
        context: context as never,
      },
    });

    return c.json({
      conversation,
      messages: [userMessage, assistantMessage],
    });
  }

  return c.json({ conversation, messages: [] });
});

// List user's conversations
concierge.get("/conversations", requireAuth(), async (c) => {
  const authUser = getAuthUser(c);

  if (!authUser) {
    throw new ForbiddenError();
  }

  const limit = parseInt(c.req.query("limit") ?? "20", 10);
  const offset = parseInt(c.req.query("offset") ?? "0", 10);
  const status = c.req.query("status"); // ACTIVE, RESOLVED, ARCHIVED

  const where: Record<string, unknown> = {
    userId: authUser.sub,
  };

  if (status && ["ACTIVE", "RESOLVED", "ARCHIVED"].includes(status)) {
    where.status = status;
  }

  const conversations = await db.conversation.findMany({
    where,
    take: limit,
    skip: offset,
    orderBy: {
      updatedAt: "desc",
    },
    include: {
      messages: {
        take: 1,
        orderBy: {
          createdAt: "desc",
        },
      },
      _count: {
        select: {
          messages: true,
        },
      },
    },
  });

  const total = await db.conversation.count({ where });

  return c.json({
    conversations,
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    },
  });
});

// Get a specific conversation with all messages
concierge.get("/conversations/:id", requireAuth(), async (c) => {
  const authUser = getAuthUser(c);
  const { id } = c.req.param();

  if (!authUser) {
    throw new ForbiddenError();
  }

  const conversation = await db.conversation.findUnique({
    where: { id },
    include: {
      messages: {
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  if (!conversation) {
    throw new NotFoundError("Conversation");
  }

  // Check ownership
  if (
    conversation.userId !== authUser.sub &&
    authUser.role !== "ADMIN" &&
    authUser.role !== "STAFF"
  ) {
    throw new ForbiddenError();
  }

  return c.json(conversation);
});

// Send a message in a conversation
concierge.post("/conversations/:id/messages", requireAuth(), async (c) => {
  const authUser = getAuthUser(c);
  const { id } = c.req.param();

  if (!authUser) {
    throw new ForbiddenError();
  }

  // Validate conversation exists and user owns it
  const conversation = await db.conversation.findUnique({
    where: { id },
    include: {
      messages: {
        orderBy: {
          createdAt: "asc",
        },
        take: 20, // Last 20 messages for context
      },
    },
  });

  if (!conversation) {
    throw new NotFoundError("Conversation");
  }

  if (
    conversation.userId !== authUser.sub &&
    authUser.role !== "ADMIN" &&
    authUser.role !== "STAFF"
  ) {
    throw new ForbiddenError();
  }

  // Parse and validate message
  const json = (await c.req.json()) as unknown;
  const parseResult = sendMessageSchema.safeParse(json);

  if (!parseResult.success) {
    throw new ValidationError(
      "Invalid message payload",
      parseResult.error.flatten().fieldErrors,
    );
  }

  const payload = parseResult.data;

  // Create user message
  const userMessage = await db.message.create({
    data: {
      conversationId: id,
      role: "USER",
      content: payload.content,
    },
  });

  logger.info(
    { conversationId: id, messageId: userMessage.id },
    "User message created",
  );

  // Get user context
  const context = await getUserContext(authUser.sub, {
    bookingId: conversation.bookingId ?? undefined,
    propertyId: conversation.propertyId ?? undefined,
  });

  // Prepare message history for AI
  const messageHistory = [
    ...conversation.messages.map((m) => ({
      role: m.role as "USER" | "ASSISTANT" | "SYSTEM",
      content: m.content,
    })),
    {
      role: "USER" as const,
      content: payload.content,
    },
  ];

  // Generate AI response
  const aiResponse = await generateAIResponse(messageHistory, context);

  // Save AI message
  const assistantMessage = await db.message.create({
    data: {
      conversationId: id,
      role: "ASSISTANT",
      content: aiResponse.content,
      model: aiResponse.model,
      tokens: aiResponse.tokens,
      context: context as never,
    },
  });

  // Update conversation timestamp
  await db.conversation.update({
    where: { id },
    data: { updatedAt: new Date() },
  });

  logger.info(
    {
      conversationId: id,
      assistantMessageId: assistantMessage.id,
      tokens: aiResponse.tokens,
    },
    "AI response generated",
  );

  return c.json({
    userMessage,
    assistantMessage,
  });
});

// Update conversation status
concierge.patch("/conversations/:id", requireAuth(), async (c) => {
  const authUser = getAuthUser(c);
  const { id } = c.req.param();

  if (!authUser) {
    throw new ForbiddenError();
  }

  const conversation = await db.conversation.findUnique({
    where: { id },
  });

  if (!conversation) {
    throw new NotFoundError("Conversation");
  }

  if (
    conversation.userId !== authUser.sub &&
    authUser.role !== "ADMIN" &&
    authUser.role !== "STAFF"
  ) {
    throw new ForbiddenError();
  }

  const json = (await c.req.json()) as unknown;
  const updateSchema = z.object({
    status: z.enum(["ACTIVE", "RESOLVED", "ARCHIVED"]).optional(),
    title: z.string().max(100).optional(),
  });

  const parseResult = updateSchema.safeParse(json);

  if (!parseResult.success) {
    throw new ValidationError(
      "Invalid update payload",
      parseResult.error.flatten().fieldErrors,
    );
  }

  const payload = parseResult.data;

  const updatedConversation = await db.conversation.update({
    where: { id },
    data: payload,
  });

  return c.json(updatedConversation);
});

/**
 * Helper function to gather user context for AI
 */
async function getUserContext(
  userId: string,
  options?: { bookingId?: string; propertyId?: string },
): Promise<Record<string, unknown>> {
  const context: Record<string, unknown> = {};

  // Get user info
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      email: true,
      phone: true,
    },
  });

  context.user = user;

  // Get user's recent bookings
  const recentBookings = await db.booking.findMany({
    where: { userId },
    take: 5,
    orderBy: { createdAt: "desc" },
    include: {
      property: true,
      service: true,
    },
  });

  context.recentBookings = recentBookings;

  // If specific booking is mentioned, get it
  if (options?.bookingId) {
    const booking = await db.booking.findUnique({
      where: { id: options.bookingId },
      include: {
        property: true,
        service: true,
        cleanScoreReport: true,
      },
    });
    context.currentBooking = booking;
  }

  // If specific property is mentioned, get it
  if (options?.propertyId) {
    const property = await db.property.findUnique({
      where: { id: options.propertyId },
    });
    context.currentProperty = property;
  }

  // Get available services
  const services = await db.service.findMany({
    where: { active: true },
  });

  context.availableServices = services;

  return context;
}

export default concierge;
