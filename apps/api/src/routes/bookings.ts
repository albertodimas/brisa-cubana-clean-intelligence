import { Hono } from "hono";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import type { BookingStatus, Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { authenticate, requireRoles } from "../middleware/auth.js";
import { serializeBooking } from "../lib/serializers.js";
import { handlePrismaError } from "../lib/prisma-error-handler.js";

const createBookingSchema = z.object({
  customerId: z.string().cuid(),
  propertyId: z.string().cuid(),
  serviceId: z.string().cuid(),
  scheduledAt: z.coerce.date(),
  durationMin: z.coerce.number().int().positive().optional(),
  notes: z.string().max(500).optional(),
});

const router = new Hono();

const bookingStatusValues = [
  "PENDING",
  "CONFIRMED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
] as const;

const querySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  status: z.enum(bookingStatusValues).optional(),
  propertyId: z.string().cuid().optional(),
  serviceId: z.string().cuid().optional(),
  customerId: z.string().cuid().optional(),
  // Pagination
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  cursor: z.string().cuid().optional(),
});

const updateBookingSchema = z
  .object({
    scheduledAt: z.coerce.date().optional(),
    durationMin: z.coerce.number().int().min(30).optional(),
    notes: z.string().max(500).nullable().optional(),
    status: z.enum(bookingStatusValues).optional(),
    propertyId: z.string().cuid().optional(),
    serviceId: z.string().cuid().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Debe enviar al menos un campo para actualizar",
  });

router.get("/", async (c) => {
  const url = new URL(c.req.url, "http://localhost");
  const parsed = querySchema.safeParse(
    Object.fromEntries(url.searchParams.entries()),
  );
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const { from, to, status, propertyId, serviceId, customerId, limit, cursor } =
    parsed.data;
  const where: Prisma.BookingWhereInput = {};

  if (from || to) {
    where.scheduledAt = {
      ...(from ? { gte: from } : {}),
      ...(to ? { lte: to } : {}),
    };
  }
  if (status) {
    where.status = status as Prisma.BookingWhereInput["status"];
  }
  if (propertyId) {
    where.propertyId = propertyId;
  }
  if (serviceId) {
    where.serviceId = serviceId;
  }
  if (customerId) {
    where.customerId = customerId;
  }

  // Fetch limit + 1 to determine if there are more results
  const bookings = await prisma.booking.findMany({
    where,
    take: limit + 1,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    orderBy: [{ scheduledAt: "asc" }, { id: "asc" }],
    include: {
      customer: { select: { id: true, fullName: true, email: true } },
      property: { select: { id: true, label: true, city: true } },
      service: { select: { id: true, name: true, basePrice: true } },
    },
  });

  const hasMore = bookings.length > limit;
  const data = hasMore ? bookings.slice(0, limit) : bookings;
  const serialized = data.map((booking) => serializeBooking(booking));
  const nextCursor = hasMore ? data[data.length - 1]?.id : null;

  return c.json({
    data: serialized,
    pagination: {
      limit,
      cursor: cursor ?? null,
      nextCursor,
      hasMore,
    },
  });
});

router.post(
  "/",
  authenticate,
  requireRoles(["ADMIN", "COORDINATOR"]),
  async (c) => {
    const parsed = createBookingSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return c.json({ error: parsed.error.flatten() }, 400);
    }

    const { durationMin, serviceId, customerId, propertyId, ...rest } =
      parsed.data;
    const [service, customer, property] = await Promise.all([
      prisma.service.findUnique({ where: { id: serviceId } }),
      prisma.user.findUnique({ where: { id: customerId } }),
      prisma.property.findUnique({ where: { id: propertyId } }),
    ]);
    if (!service) {
      return c.json({ error: "Service not found" }, 404);
    }
    if (!customer) {
      return c.json({ error: "Customer not found" }, 404);
    }
    if (!property) {
      return c.json({ error: "Property not found" }, 404);
    }

    try {
      const booking = await prisma.booking.create({
        data: {
          ...rest,
          serviceId,
          customerId,
          propertyId,
          durationMin: durationMin ?? service.durationMin,
          totalAmount: service.basePrice,
          code: `BRISA-${randomUUID().slice(0, 8)}`,
        },
        include: {
          customer: { select: { id: true, fullName: true, email: true } },
          property: { select: { id: true, label: true, city: true } },
          service: { select: { id: true, name: true, basePrice: true } },
        },
      });

      return c.json({ data: serializeBooking(booking) }, 201);
    } catch (error) {
      return handlePrismaError(c, error, {
        foreignKey: "Relaciones inválidas para cliente, servicio o propiedad",
        conflict: "El código de la reserva ya existe",
        default: "No se pudo crear la reserva",
      });
    }
  },
);
router.patch(
  "/:id",
  authenticate,
  requireRoles(["ADMIN", "COORDINATOR"]),
  async (c) => {
    const id = c.req.param("id");
    const parsed = updateBookingSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return c.json({ error: parsed.error.flatten() }, 400);
    }

    const { propertyId, serviceId, ...rest } = parsed.data;

    if (serviceId) {
      const service = await prisma.service.findUnique({
        where: { id: serviceId },
      });
      if (!service) {
        return c.json({ error: "Service not found" }, 404);
      }
    }

    if (propertyId) {
      const property = await prisma.property.findUnique({
        where: { id: propertyId },
      });
      if (!property) {
        return c.json({ error: "Property not found" }, 404);
      }
    }

    try {
      const updates: Prisma.BookingUpdateInput = {};

      if (rest.scheduledAt) {
        updates.scheduledAt = rest.scheduledAt;
      }
      if (rest.durationMin !== undefined) {
        updates.durationMin = rest.durationMin;
      }
      if (rest.status) {
        updates.status = rest.status as BookingStatus;
      }
      if (rest.notes !== undefined) {
        updates.notes = rest.notes ?? null;
      }
      if (propertyId) {
        updates.property = { connect: { id: propertyId } };
      }
      if (serviceId) {
        updates.service = { connect: { id: serviceId } };
      }

      const booking = await prisma.booking.update({
        where: { id },
        data: updates,
        include: {
          customer: { select: { id: true, fullName: true, email: true } },
          property: { select: { id: true, label: true, city: true } },
          service: { select: { id: true, name: true, basePrice: true } },
        },
      });
      return c.json({ data: serializeBooking(booking) });
    } catch (error) {
      return handlePrismaError(c, error, {
        notFound: "Reserva no encontrada",
        default: "No se pudo actualizar la reserva",
      });
    }
  },
);

export default router;
