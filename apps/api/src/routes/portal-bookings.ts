import { Hono } from "hono";
import { z } from "zod";
import type { BookingStatus } from "@prisma/client";
import { getBookingRepository, getUserRepository } from "../container.js";
import { authenticatePortal, getPortalAuth } from "../middleware/auth.js";
import { serializeBooking } from "../lib/serializers.js";

const router = new Hono();

const bookingStatusValues = [
  "PENDING",
  "CONFIRMED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
] as const;

const portalBookingsQuerySchema = z.object({
  status: z.enum(bookingStatusValues).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
  cursor: z.string().cuid().optional(),
});

router.use("*", authenticatePortal);

router.get("/", async (c) => {
  const portalAuth = getPortalAuth(c);
  if (!portalAuth) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const query = portalBookingsQuerySchema.safeParse(c.req.query());
  if (!query.success) {
    return c.json({ error: query.error.flatten() }, 400);
  }

  const { status, limit, cursor } = query.data;

  const userRepository = getUserRepository();
  const user = await userRepository.findByEmail(portalAuth.email);

  if (!user || !user.isActive || user.role !== "CLIENT") {
    return c.json({ error: "Cuenta no habilitada para portal" }, 403);
  }

  const bookingRepository = getBookingRepository();
  const result = await bookingRepository.findManyPaginated(
    limit,
    cursor,
    {
      customerId: user.id,
      ...(status ? { status: status as BookingStatus } : {}),
    },
    true,
    {
      orderBy: [{ scheduledAt: "asc" }, { id: "asc" }],
    },
  );

  const serialized = result.data.map((booking) => serializeBooking(booking));

  return c.json({
    data: serialized,
    customer: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
    },
    pagination: {
      limit,
      cursor: cursor ?? null,
      nextCursor: result.nextCursor ?? null,
      hasMore: result.hasMore,
    },
  });
});

export default router;
