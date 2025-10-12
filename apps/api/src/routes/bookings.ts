import { Hono } from "hono";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import type { BookingStatus } from "@prisma/client";
import { authenticate, requireRoles } from "../middleware/auth.js";
import { serializeBooking } from "../lib/serializers.js";
import { handlePrismaError } from "../lib/prisma-error-handler.js";
import {
  getBookingRepository,
  getPropertyRepository,
  getServiceRepository,
  getUserRepository,
} from "../container.js";
import type {
  BookingCreateInput,
  BookingFilters,
  BookingUpdateInput,
} from "../repositories/booking-repository.js";

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

  const filters: BookingFilters = {};

  if (from) {
    filters.from = from;
  }
  if (to) {
    filters.to = to;
  }
  if (status) {
    filters.status = status;
  }
  if (propertyId) {
    filters.propertyId = propertyId;
  }
  if (serviceId) {
    filters.serviceId = serviceId;
  }
  if (customerId) {
    filters.customerId = customerId;
  }

  const repository = getBookingRepository();
  const result = await repository.findManyPaginated(
    limit,
    cursor,
    filters,
    true,
    {
      orderBy: [{ scheduledAt: "asc" }, { id: "asc" }],
    },
  );

  const serialized = result.data.map((booking) => serializeBooking(booking));

  return c.json({
    data: serialized,
    pagination: {
      limit,
      cursor: cursor ?? null,
      nextCursor: result.nextCursor ?? null,
      hasMore: result.hasMore,
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

    const serviceRepository = getServiceRepository();
    const userRepository = getUserRepository();
    const propertyRepository = getPropertyRepository();
    const bookingRepository = getBookingRepository();

    const [service, customer, property] = await Promise.all([
      serviceRepository.findById(serviceId),
      userRepository.findById(customerId),
      propertyRepository.findById(propertyId),
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
      const createPayload: BookingCreateInput = {
        code: `BRISA-${randomUUID().slice(0, 8)}`,
        scheduledAt: rest.scheduledAt,
        durationMin: durationMin ?? service.durationMin,
        status: "PENDING" as BookingStatus,
        totalAmount: Number(service.basePrice),
        serviceId,
        propertyId,
        customerId,
        ...(rest.notes !== undefined ? { notes: rest.notes } : {}),
      };

      const created = await bookingRepository.create(createPayload);
      const bookingWithRelations =
        await bookingRepository.findByIdWithRelations(created.id);

      return c.json(
        {
          data: serializeBooking(bookingWithRelations ?? created),
        },
        201,
      );
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
    const serviceRepository = getServiceRepository();
    const propertyRepository = getPropertyRepository();
    const bookingRepository = getBookingRepository();

    if (serviceId) {
      const service = await serviceRepository.findById(serviceId);
      if (!service) {
        return c.json({ error: "Service not found" }, 404);
      }
    }

    if (propertyId) {
      const property = await propertyRepository.findById(propertyId);
      if (!property) {
        return c.json({ error: "Property not found" }, 404);
      }
    }

    try {
      const updates: BookingUpdateInput = {};

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
        updates.propertyId = propertyId;
      }
      if (serviceId) {
        updates.serviceId = serviceId;
      }

      await bookingRepository.update(id, updates);
      const updatedBooking = await bookingRepository.findByIdWithRelations(id);

      if (!updatedBooking) {
        return c.json({ error: "Reserva no encontrada" }, 404);
      }

      return c.json({ data: serializeBooking(updatedBooking) });
    } catch (error) {
      return handlePrismaError(c, error, {
        notFound: "Reserva no encontrada",
        default: "No se pudo actualizar la reserva",
      });
    }
  },
);

export default router;
