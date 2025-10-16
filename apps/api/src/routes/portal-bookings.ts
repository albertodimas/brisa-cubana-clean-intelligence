import { Hono } from "hono";
import { z } from "zod";
import { BookingStatus, NotificationType } from "@prisma/client";
import {
  getBookingRepository,
  getNotificationRepository,
  getUserRepository,
} from "../container.js";
import { authenticatePortal, getPortalAuth } from "../middleware/auth.js";
import { serializeBooking } from "../lib/serializers.js";
import { logger } from "../lib/logger.js";

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

const cancelBookingSchema = z
  .object({
    reason: z.string().trim().min(3).max(500).optional(),
  })
  .optional()
  .transform((value) => value ?? {});

const rescheduleBookingSchema = z.object({
  scheduledAt: z.coerce.date(),
  notes: z.string().trim().min(3).max(500).optional(),
});

function formatDateForMessage(date: Date): string {
  return date.toISOString().replace("T", " ").replace("Z", " UTC");
}

async function notifyOperationsAboutBooking(
  userRepository: ReturnType<typeof getUserRepository>,
  notificationRepository: ReturnType<typeof getNotificationRepository>,
  notification: { type: NotificationType; message: string },
) {
  const operations = await userRepository.findActiveByRoles([
    "ADMIN",
    "COORDINATOR",
  ]);

  if (operations.length === 0) {
    return;
  }

  const trimmedMessage = notification.message.slice(0, 240);

  await Promise.all(
    operations.map((operationsUser) =>
      notificationRepository.createNotification({
        userId: operationsUser.id,
        type: notification.type,
        message: trimmedMessage,
      }),
    ),
  );
}

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
  const sessionExpiresAtIso =
    typeof portalAuth.expiresAt === "number"
      ? new Date(portalAuth.expiresAt * 1000).toISOString()
      : null;

  return c.json({
    data: serialized,
    customer: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
    },
    session: {
      expiresAt: sessionExpiresAtIso,
    },
    pagination: {
      limit,
      cursor: cursor ?? null,
      nextCursor: result.nextCursor ?? null,
      hasMore: result.hasMore,
    },
  });
});

router.post("/:id/cancel", async (c) => {
  const portalAuth = getPortalAuth(c);
  if (!portalAuth) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const [parsedBody, id] = await Promise.all([
    cancelBookingSchema.safeParseAsync(await c.req.json().catch(() => ({}))),
    Promise.resolve(c.req.param("id")),
  ]);

  if (!parsedBody.success) {
    return c.json({ error: parsedBody.error.flatten() }, 400);
  }

  const { reason } = parsedBody.data;

  const userRepository = getUserRepository();
  const bookingRepository = getBookingRepository();
  const notificationRepository = getNotificationRepository();

  const user = await userRepository.findByEmail(portalAuth.email);
  if (!user || !user.isActive || user.role !== "CLIENT") {
    return c.json({ error: "Cuenta no habilitada para portal" }, 403);
  }

  const booking = await bookingRepository.findByIdWithRelations(id);
  if (!booking || booking.customerId !== user.id) {
    return c.json({ error: "Reserva no encontrada" }, 404);
  }

  if (booking.status === "CANCELLED" || booking.status === "COMPLETED") {
    return c.json(
      { error: "Esta reserva ya no puede cancelarse desde el portal" },
      409,
    );
  }

  const reasonNote = reason
    ? `Cancelación portal: ${reason}`
    : "Cancelación solicitada desde el portal cliente.";
  const updatedNotes = [booking.notes, reasonNote].filter(Boolean).join("\n\n");

  await bookingRepository.update(booking.id, {
    status: "CANCELLED",
    notes: updatedNotes.slice(0, 500),
  });

  const updated = await bookingRepository.findByIdWithRelations(booking.id);

  logger.info(
    {
      bookingId: booking.id,
      customerId: user.id,
      portalEmail: portalAuth.email,
    },
    "Portal booking cancellation processed",
  );

  const customerLabel = user.fullName ?? user.email;
  const scheduledAtLabel = formatDateForMessage(
    new Date(updated?.scheduledAt ?? booking.scheduledAt),
  );
  const reasonSnippet = reason
    ? ` Motivo: ${reason.trim().slice(0, 120)}.`
    : "";
  const serviceName = updated?.service?.name ?? booking.service?.name ?? "";
  const message =
    `Portal: ${booking.code} (${serviceName}) cancelada por ${customerLabel} (${scheduledAtLabel}).${reasonSnippet}`.trim();

  await notifyOperationsAboutBooking(userRepository, notificationRepository, {
    type: NotificationType.BOOKING_CANCELLED,
    message,
  });

  return c.json({
    data: serializeBooking(updated ?? booking),
  });
});

router.post("/:id/reschedule", async (c) => {
  const portalAuth = getPortalAuth(c);
  if (!portalAuth) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const id = c.req.param("id");
  const parsed = await rescheduleBookingSchema.safeParseAsync(
    await c.req.json().catch(() => null),
  );

  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const { scheduledAt, notes } = parsed.data;

  if (scheduledAt.getTime() < Date.now()) {
    return c.json(
      { error: "La nueva fecha debe ser posterior al momento actual." },
      400,
    );
  }

  const userRepository = getUserRepository();
  const bookingRepository = getBookingRepository();
  const notificationRepository = getNotificationRepository();

  const user = await userRepository.findByEmail(portalAuth.email);
  if (!user || !user.isActive || user.role !== "CLIENT") {
    return c.json({ error: "Cuenta no habilitada para portal" }, 403);
  }

  const booking = await bookingRepository.findByIdWithRelations(id);
  if (!booking || booking.customerId !== user.id) {
    return c.json({ error: "Reserva no encontrada" }, 404);
  }

  if (booking.status === "CANCELLED" || booking.status === "COMPLETED") {
    return c.json(
      { error: "Esta reserva ya no puede reagendarse desde el portal" },
      409,
    );
  }

  const noteSegments = [booking.notes];

  if (notes) {
    noteSegments.push(`Reagendado en portal: ${notes}`);
  } else {
    noteSegments.push("Reagendado desde el portal cliente.");
  }

  await bookingRepository.update(booking.id, {
    scheduledAt,
    status: booking.status === "PENDING" ? booking.status : "PENDING",
    notes: noteSegments.filter(Boolean).join("\n\n").slice(0, 500),
  });

  const updated = await bookingRepository.findByIdWithRelations(booking.id);

  logger.info(
    {
      bookingId: booking.id,
      customerId: user.id,
      portalEmail: portalAuth.email,
      scheduledAt: scheduledAt.toISOString(),
    },
    "Portal booking reschedule processed",
  );

  const customerLabel = user.fullName ?? user.email;
  const scheduledAtLabel = formatDateForMessage(
    new Date(updated?.scheduledAt ?? scheduledAt),
  );
  const serviceName = updated?.service?.name ?? booking.service?.name ?? "";
  const notesSnippet = notes ? ` Nota: ${notes.trim().slice(0, 120)}.` : "";
  const message =
    `Portal: ${booking.code} (${serviceName}) reagendada por ${customerLabel} al ${scheduledAtLabel}.${notesSnippet}`.trim();

  await notifyOperationsAboutBooking(userRepository, notificationRepository, {
    type: NotificationType.BOOKING_RESCHEDULED,
    message,
  });

  return c.json({
    data: serializeBooking(updated ?? booking),
  });
});

export default router;
