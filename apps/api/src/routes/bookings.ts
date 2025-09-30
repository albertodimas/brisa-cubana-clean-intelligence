import { Hono } from "hono";
import { db } from "../lib/db";
import { getStripe, stripeEnabled } from "../lib/stripe";
import { getAuthUser, requireAuth } from "../middleware/auth";
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

const bookings = new Hono();

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
    return c.json({ error: "Unauthorized" }, 401);
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
    return c.json({ error: "Booking not found" }, 404);
  }

  if (
    authUser?.role !== "ADMIN" &&
    authUser?.role !== "STAFF" &&
    booking.userId !== authUser?.sub
  ) {
    return c.json({ error: "Forbidden" }, 403);
  }

  return c.json(booking);
});

// Create booking
bookings.post("/", requireAuth(), async (c) => {
  const json = (await c.req.json()) as unknown;
  const parseResult = createBookingSchema.safeParse(json);

  if (!parseResult.success) {
    return c.json(
      {
        error: "Invalid booking payload",
        details: parseResult.error.flatten().fieldErrors,
      },
      400,
    );
  }

  const payload: CreateBookingInput = parseResult.data;
  const authUser = getAuthUser(c);

  if (authUser?.role === "CLIENT" && payload.userId !== authUser.sub) {
    return c.json(
      { error: "You can only create bookings for your own user" },
      403,
    );
  }

  const [service, userRecord, property] = await Promise.all([
    db.service.findUnique({
      where: { id: payload.serviceId },
    }),
    db.user.findUnique({ where: { id: payload.userId } }),
    db.property.findUnique({ where: { id: payload.propertyId } }),
  ]);

  if (!service) {
    return c.json({ error: "Service not found" }, 404);
  }

  if (!userRecord) {
    return c.json({ error: "User not found" }, 404);
  }

  if (!property) {
    return c.json({ error: "Property not found" }, 404);
  }

  if (authUser?.role === "CLIENT" && property.userId !== authUser.sub) {
    return c.json(
      { error: "You can only create bookings for your own properties" },
      403,
    );
  }

  const scheduledAt = payload.scheduledAt;
  const basePrice = Number(service.basePrice);
  const totalPrice = payload.totalPrice ?? basePrice;

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
    return c.json({ error: "Unauthorized" }, 401);
  }

  if (authUser.role === "CLIENT") {
    return c.json({ error: "Forbidden" }, 403);
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
    return c.json({ error: "No updates supplied" }, 400);
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

  return c.json(booking);
});

// Cancel booking
bookings.delete("/:id", requireAuth(), async (c) => {
  const id = c.req.param("id");
  const authUser = getAuthUser(c);

  if (!authUser) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  if (authUser.role === "CLIENT") {
    return c.json({ error: "Forbidden" }, 403);
  }

  const booking = await db.booking.update({
    where: { id },
    data: { status: "CANCELLED" },
  });

  return c.json(booking);
});

export default bookings;
