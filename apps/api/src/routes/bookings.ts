import { Hono } from "hono";
import { db } from "../lib/db";
import { getStripe, stripeEnabled } from "../lib/stripe";
import { getAuthUser, requireAuth } from "../middleware/auth";
import { rateLimiter, RateLimits } from "../middleware/rate-limit";
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "../lib/errors";
import {
  createBookingSchema,
  paginationSchema,
  updateBookingSchema,
} from "../schemas";
import type {
  CreateBookingInput,
  PaginationInput,
  UpdateBookingInput,
} from "../schemas";
import {
  sendBookingConfirmation,
  sendStatusUpdate,
  sendCompletionNotification,
} from "../services/notifications";

const bookings = new Hono();

// Apply rate limiting: read operations are more permissive, write operations are stricter
bookings.get("/", rateLimiter(RateLimits.read));
bookings.get("/mine", rateLimiter(RateLimits.read));
bookings.get("/:id", rateLimiter(RateLimits.read));

// Stricter limits for write operations
bookings.post("/", rateLimiter(RateLimits.write));
bookings.patch("/:id", rateLimiter(RateLimits.write));
bookings.delete("/:id", rateLimiter(RateLimits.write));

// Get all bookings (with pagination)
bookings.get("/", requireAuth(["ADMIN", "STAFF"]), async (c) => {
  const paginationResult = paginationSchema.safeParse({
    page: c.req.query("page"),
    limit: c.req.query("limit"),
  });

  if (!paginationResult.success) {
    return c.json(
      {
        error: "Invalid pagination parameters",
        details: paginationResult.error.flatten().fieldErrors,
      },
      400,
    );
  }

  const { page, limit }: PaginationInput = paginationResult.data;
  const skip = (page - 1) * limit;

  const [allBookings, total] = await Promise.all([
    db.booking.findMany({
      skip,
      take: limit,
      include: {
        user: { select: { id: true, name: true, email: true } },
        property: { select: { id: true, name: true, address: true } },
        service: { select: { id: true, name: true, basePrice: true } },
      },
      orderBy: { scheduledAt: "desc" },
    }),
    db.booking.count(),
  ]);

  return c.json({
    data: allBookings,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

// Get bookings for the authenticated user
bookings.get("/mine", requireAuth(), async (c) => {
  const authUser = getAuthUser(c);

  if (!authUser) {
    throw new UnauthorizedError();
  }

  const bookingsForUser = await db.booking.findMany({
    where: { userId: authUser.sub },
    include: {
      service: { select: { id: true, name: true, basePrice: true } },
      property: { select: { id: true, name: true, address: true } },
    },
    orderBy: { scheduledAt: "asc" },
    take: 10,
  });

  return c.json(bookingsForUser);
});

// Get booking by ID
bookings.get("/:id", requireAuth(), async (c) => {
  const id = c.req.param("id");
  const authUser = getAuthUser(c);
  const booking = await db.booking.findUnique({
    where: { id },
    include: {
      user: true,
      property: true,
      service: true,
    },
  });

  if (!booking) {
    throw new NotFoundError("Booking");
  }

  if (
    authUser?.role !== "ADMIN" &&
    authUser?.role !== "STAFF" &&
    booking.userId !== authUser?.sub
  ) {
    throw new ForbiddenError("You can only view your own bookings");
  }

  return c.json(booking);
});

// Create booking
bookings.post("/", requireAuth(), async (c) => {
  const json = (await c.req.json()) as unknown;
  const parseResult = createBookingSchema.safeParse(json);

  if (!parseResult.success) {
    throw new ValidationError(
      "Invalid booking payload",
      parseResult.error.flatten().fieldErrors,
    );
  }

  const payload: CreateBookingInput = parseResult.data;
  const authUser = getAuthUser(c);

  if (authUser?.role === "CLIENT" && payload.userId !== authUser.sub) {
    throw new ForbiddenError("You can only create bookings for your own user");
  }

  const [service, userRecord, property] = await Promise.all([
    db.service.findUnique({
      where: { id: payload.serviceId },
    }),
    db.user.findUnique({ where: { id: payload.userId } }),
    db.property.findUnique({ where: { id: payload.propertyId } }),
  ]);

  if (!service) {
    throw new NotFoundError("Service");
  }

  if (!userRecord) {
    throw new NotFoundError("User");
  }

  if (!property) {
    throw new NotFoundError("Property");
  }

  if (authUser?.role === "CLIENT" && property.userId !== authUser.sub) {
    throw new ForbiddenError(
      "You can only create bookings for your own properties",
    );
  }

  // Validate service is active
  if (!service.active) {
    throw new BadRequestError("This service is currently unavailable");
  }

  const scheduledAt = payload.scheduledAt;
  const basePrice = Number(service.basePrice);
  const totalPrice = payload.totalPrice ?? basePrice;

  // Check for scheduling conflicts (same property within service duration window)
  const serviceDurationMs = service.duration * 60 * 1000; // duration is in minutes
  const bookingEndTime = new Date(scheduledAt.getTime() + serviceDurationMs);
  const conflictingBookings = await db.booking.findMany({
    where: {
      propertyId: payload.propertyId,
      status: {
        in: ["PENDING", "CONFIRMED", "IN_PROGRESS"],
      },
      OR: [
        // New booking starts during existing booking
        {
          AND: [
            { scheduledAt: { lte: scheduledAt } },
            {
              scheduledAt: {
                gte: new Date(scheduledAt.getTime() - serviceDurationMs),
              },
            },
          ],
        },
        // New booking ends during existing booking
        {
          AND: [
            { scheduledAt: { lte: bookingEndTime } },
            { scheduledAt: { gte: scheduledAt } },
          ],
        },
      ],
    },
  });

  if (conflictingBookings.length > 0) {
    throw new ConflictError(
      "This time slot conflicts with an existing booking for this property",
      {
        conflictingBookingIds: conflictingBookings.map((b) => b.id),
      },
    );
  }

  let booking = await db.booking.create({
    data: {
      userId: payload.userId,
      propertyId: payload.propertyId,
      serviceId: payload.serviceId,
      scheduledAt,
      totalPrice,
      notes: payload.notes,
      status: "PENDING",
    },
    include: {
      user: true,
      property: true,
      service: true,
    },
  });

  let checkoutUrl: string | null = null;

  if (stripeEnabled()) {
    try {
      const stripe = getStripe();
      const webUrl = process.env.WEB_APP_URL ?? "http://localhost:3000";
      const successUrl =
        process.env.STRIPE_SUCCESS_URL ?? `${webUrl}/dashboard?payment=success`;
      const cancelUrl =
        process.env.STRIPE_CANCEL_URL ??
        `${webUrl}/dashboard?payment=cancelled`;

      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        success_url: successUrl,
        cancel_url: cancelUrl,
        customer_email: userRecord.email,
        metadata: {
          bookingId: booking.id,
        },
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: service.name,
                description: service.description ?? undefined,
              },
              unit_amount: Math.round(Number(totalPrice) * 100),
            },
            quantity: 1,
          },
        ],
      });

      booking = await db.booking.update({
        where: { id: booking.id },
        data: {
          checkoutSessionId: session.id,
          paymentStatus: "PENDING_PAYMENT",
          paymentIntentId:
            typeof session.payment_intent === "string"
              ? session.payment_intent
              : (session.payment_intent?.id ?? undefined),
        },
        include: {
          user: true,
          property: true,
          service: true,
        },
      });

      checkoutUrl = session.url ?? null;
    } catch (error) {
      console.error("Stripe checkout session error", error);
    }
  }

  // Send booking notification (async, non-blocking)
  if (userRecord.phone) {
    const scheduledDate = new Date(scheduledAt).toLocaleDateString("es-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const scheduledTime = new Date(scheduledAt).toLocaleTimeString("es-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

    void sendBookingConfirmation(
      {
        clientName: userRecord.name ?? "Cliente",
        clientPhone: userRecord.phone,
        serviceName: service.name,
        propertyName: property.name,
        propertyAddress: property.address,
        scheduledDate,
        scheduledTime,
        totalPrice: totalPrice.toFixed(2),
        bookingId: booking.id,
      },
      booking.status === "CONFIRMED" ? "CONFIRMED" : "PENDING",
    );
  }

  return c.json({ booking, checkoutUrl }, 201);
});

// Update booking status
bookings.patch("/:id", requireAuth(), async (c) => {
  const id = c.req.param("id");
  const json = (await c.req.json()) as unknown;
  const parseResult = updateBookingSchema.safeParse(json);

  if (!parseResult.success) {
    return c.json(
      {
        error: "Invalid booking update payload",
        details: parseResult.error.flatten().fieldErrors,
      },
      400,
    );
  }

  const payload: UpdateBookingInput = parseResult.data;
  const authUser = getAuthUser(c);

  if (!authUser) {
    throw new UnauthorizedError();
  }

  if (authUser.role === "CLIENT") {
    throw new ForbiddenError("Clients cannot update bookings");
  }

  const updateData: Partial<UpdateBookingInput> & {
    completedAt?: Date | null;
  } = {};

  if (payload.status !== undefined) {
    updateData.status = payload.status;
    updateData.completedAt =
      payload.status === "COMPLETED" ? new Date() : undefined;
  }

  if (payload.notes !== undefined) {
    updateData.notes = payload.notes === "" ? undefined : payload.notes;
  }

  if (Object.keys(updateData).length === 0) {
    throw new BadRequestError("No updates supplied");
  }

  const booking = await db.booking.update({
    where: { id },
    data: updateData,
    include: {
      user: true,
      property: true,
      service: true,
    },
  });

  // Send status update notifications (async, non-blocking)
  if (payload.status && booking.user.phone) {
    if (payload.status === "IN_PROGRESS") {
      void sendStatusUpdate({
        clientName: booking.user.name ?? "Cliente",
        clientPhone: booking.user.phone,
        serviceName: booking.service.name,
        propertyName: booking.property.name,
        status: payload.status,
        bookingId: booking.id,
      });
    } else if (payload.status === "COMPLETED") {
      void sendCompletionNotification({
        clientName: booking.user.name ?? "Cliente",
        clientPhone: booking.user.phone,
        serviceName: booking.service.name,
        propertyName: booking.property.name,
        bookingId: booking.id,
      });
    } else if (payload.status === "CANCELLED") {
      void sendStatusUpdate({
        clientName: booking.user.name ?? "Cliente",
        clientPhone: booking.user.phone,
        serviceName: booking.service.name,
        propertyName: booking.property.name,
        status: payload.status,
        bookingId: booking.id,
      });
    } else if (payload.status === "CONFIRMED") {
      // Send confirmation notification when status changes to CONFIRMED
      const scheduledDate = new Date(booking.scheduledAt).toLocaleDateString(
        "es-US",
        {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        },
      );
      const scheduledTime = new Date(booking.scheduledAt).toLocaleTimeString(
        "es-US",
        {
          hour: "2-digit",
          minute: "2-digit",
        },
      );

      void sendBookingConfirmation(
        {
          clientName: booking.user.name ?? "Cliente",
          clientPhone: booking.user.phone,
          serviceName: booking.service.name,
          propertyName: booking.property.name,
          propertyAddress: booking.property.address,
          scheduledDate,
          scheduledTime,
          totalPrice: Number(booking.totalPrice).toFixed(2),
          bookingId: booking.id,
        },
        "CONFIRMED",
      );
    }
  }

  return c.json(booking);
});

// Cancel booking
bookings.delete("/:id", requireAuth(), async (c) => {
  const id = c.req.param("id");
  const authUser = getAuthUser(c);

  if (!authUser) {
    throw new UnauthorizedError();
  }

  if (authUser.role === "CLIENT") {
    throw new ForbiddenError("Clients cannot cancel bookings");
  }

  const booking = await db.booking.update({
    where: { id },
    data: { status: "CANCELLED" },
  });

  return c.json(booking);
});

export default bookings;
