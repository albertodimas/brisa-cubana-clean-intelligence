import { Hono } from "hono";
import { db } from "../lib/db";
import { getAuthUser, requireAuth } from "../middleware/auth";
import { rateLimiter, RateLimits } from "../middleware/rate-limit";
import {
  ForbiddenError,
  UnauthorizedError,
  ValidationError,
} from "../lib/errors";
import {
  createBookingSchema,
  paginationSchema,
  updateBookingSchema,
} from "../schemas";
import type { CreateBookingInput, PaginationInput } from "../schemas";
import { bookingService } from "../services/booking.service";

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

  // Use service layer instead of direct DB access
  const result = await bookingService.getAll(page, limit);

  return c.json(result);
});

// Get bookings for the authenticated user
bookings.get("/mine", requireAuth(), async (c) => {
  const authUser = getAuthUser(c);

  if (!authUser) {
    throw new UnauthorizedError();
  }

  // Use service layer
  const bookingsForUser = await bookingService.getUserBookings(authUser.sub);

  return c.json(bookingsForUser);
});

// Get booking by ID
bookings.get("/:id", requireAuth(), async (c) => {
  const id = c.req.param("id");
  const authUser = getAuthUser(c);

  // Use service layer
  const booking = await bookingService.getById(id);

  // Authorization check (service layer focuses on business logic, auth stays in route)
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

  const { booking, checkoutUrl } = await bookingService.createWithIntegrations(
    payload,
    authUser,
  );

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

  const authUser = getAuthUser(c);

  if (!authUser) {
    throw new UnauthorizedError();
  }

  const booking = await bookingService.update(id, parseResult.data, {
    authUser,
  });

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
