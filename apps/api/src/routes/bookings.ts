import { Hono } from "hono";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import type { BookingStatus } from "@prisma/client";
import {
  authenticate,
  requireRoles,
  getAuthenticatedUser,
} from "../middleware/auth.js";
import { serializeBooking } from "../lib/serializers.js";
import { handlePrismaError } from "../lib/prisma-error-handler.js";
import { parseSearchableQuery } from "../lib/pagination.js";
import { isParseFailure } from "../lib/parse-result.js";
import { logger } from "../lib/logger.js";
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

const createBookingSchema = z
  .object({
    customerId: z.string().cuid(),
    propertyId: z.string().cuid(),
    serviceId: z.string().cuid(),
    scheduledAt: z.coerce.date(),
    durationMin: z.coerce.number().int().positive().optional(),
    notes: z.string().max(500).optional(),
  })
  .refine(
    (data) => {
      // Validar que scheduledAt no esté en el pasado
      // Permitir un margen de 1 minuto para evitar problemas con pequeños delays
      const now = new Date();
      const oneMinuteAgo = new Date(now.getTime() - 60000);
      const scheduled = new Date(data.scheduledAt);
      return scheduled > oneMinuteAgo;
    },
    {
      message:
        "La fecha programada debe ser en el futuro. No se pueden crear reservas para fechas pasadas.",
      path: ["scheduledAt"],
    },
  );

const router = new Hono();

const bookingStatusValues = [
  "PENDING",
  "CONFIRMED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
] as const;

const bookingQuerySchema = z
  .object({
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
    status: z.enum(bookingStatusValues).optional(),
    propertyId: z.string().cuid().optional(),
    serviceId: z.string().cuid().optional(),
    customerId: z.string().cuid().optional(),
    assignedStaffId: z.string().cuid().optional(),
    code: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(100).optional().default(20),
    cursor: z.string().cuid().optional(),
  })
  .refine(
    (data) => {
      // Validar que el rango de fechas sea válido (from debe ser antes que to)
      if (data.from && data.to) {
        return data.from <= data.to;
      }
      return true;
    },
    {
      message:
        "El rango de fechas es inválido: 'from' debe ser anterior o igual a 'to'",
      path: ["from", "to"],
    },
  );

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
  })
  .refine(
    (data) => {
      // Validar que scheduledAt no esté en el pasado (si se proporciona)
      // Permitir un margen de 1 minuto para evitar problemas con pequeños delays
      if (data.scheduledAt) {
        const now = new Date();
        const oneMinuteAgo = new Date(now.getTime() - 60000);
        const scheduled = new Date(data.scheduledAt);
        return scheduled > oneMinuteAgo;
      }
      return true;
    },
    {
      message:
        "La fecha programada debe ser en el futuro. No se pueden reprogramar reservas para fechas pasadas.",
      path: ["scheduledAt"],
    },
  );

router.get(
  "/",
  authenticate,
  requireRoles(["ADMIN", "COORDINATOR", "STAFF"]),
  async (c) => {
    const queryResult = parseSearchableQuery(c, bookingQuerySchema);
    if (isParseFailure(queryResult)) {
      return queryResult.response;
    }

    const {
      search,
      from,
      to,
      status,
      propertyId,
      serviceId,
      customerId,
      assignedStaffId,
      code,
      limit,
      cursor,
    } = queryResult.data;

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
    if (assignedStaffId) {
      filters.assignedStaffId = assignedStaffId;
    }
    if (code) {
      filters.code = code;
    }
    if (search) {
      filters.search = search;
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
  },
);

router.get(
  "/:id",
  authenticate,
  requireRoles(["ADMIN", "COORDINATOR", "STAFF"]),
  async (c) => {
    const id = c.req.param("id");
    const repository = getBookingRepository();

    try {
      const booking = await repository.findByIdWithRelations(id);

      if (!booking) {
        return c.json({ error: "Booking not found" }, 404);
      }

      return c.json({ data: serializeBooking(booking) });
    } catch (error) {
      return handlePrismaError(c, error, {
        notFound: "Booking not found",
        default: "Could not retrieve booking",
      });
    }
  },
);

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

    // SECURITY: Validar conflicto de horario antes de crear la reserva
    const finalDuration = durationMin ?? service.durationMin;
    const hasConflict = await bookingRepository.hasTimeConflict(
      propertyId,
      rest.scheduledAt,
      finalDuration,
    );

    if (hasConflict) {
      return c.json(
        {
          error:
            "Conflicto de horario: La propiedad ya tiene una reserva activa en ese rango de tiempo",
          code: "BOOKING_TIME_CONFLICT",
        },
        409,
      );
    }

    try {
      const createPayload: BookingCreateInput = {
        code: `BRISA-${randomUUID().slice(0, 8)}`,
        scheduledAt: rest.scheduledAt,
        durationMin: finalDuration,
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

    // SECURITY: Si se cambia horario o propiedad, validar conflicto
    if (rest.scheduledAt || rest.durationMin !== undefined || propertyId) {
      const existingBooking = await bookingRepository.findById(id);
      if (!existingBooking) {
        return c.json({ error: "Reserva no encontrada" }, 404);
      }

      const targetPropertyId = propertyId ?? existingBooking.propertyId;
      const targetScheduledAt = rest.scheduledAt ?? existingBooking.scheduledAt;
      const targetDuration =
        rest.durationMin !== undefined
          ? rest.durationMin
          : existingBooking.durationMin;

      const hasConflict = await bookingRepository.hasTimeConflict(
        targetPropertyId,
        targetScheduledAt,
        targetDuration,
        id, // Excluir el booking actual
      );

      if (hasConflict) {
        return c.json(
          {
            error:
              "Conflicto de horario: La propiedad ya tiene una reserva activa en ese rango de tiempo",
            code: "BOOKING_TIME_CONFLICT",
          },
          409,
        );
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

router.patch(
  "/:id/assign-staff",
  authenticate,
  requireRoles(["ADMIN", "COORDINATOR"]),
  async (c) => {
    const id = c.req.param("id");
    const body = await c.req.json();
    const authUser = getAuthenticatedUser(c);

    const assignStaffSchema = z.object({
      staffId: z.string().cuid().nullable(),
    });

    const parsed = assignStaffSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: parsed.error.flatten() }, 400);
    }

    const { staffId } = parsed.data;

    // Si se proporciona staffId, validar que el usuario existe, es STAFF y está activo
    if (staffId) {
      const userRepository = getUserRepository();
      const staff = await userRepository.findById(staffId);

      if (!staff) {
        return c.json({ error: "Usuario no encontrado" }, 404);
      }

      if (staff.role !== "STAFF") {
        return c.json({ error: "El usuario debe tener rol de STAFF" }, 400);
      }

      if (!staff.isActive) {
        return c.json({ error: "El staff asignado debe estar activo" }, 400);
      }
    }

    try {
      const bookingRepository = getBookingRepository();
      await bookingRepository.update(id, {
        assignedStaffId: staffId ?? null,
      });

      const updatedBooking = await bookingRepository.findByIdWithRelations(id);

      if (!updatedBooking) {
        return c.json({ error: "Reserva no encontrada" }, 404);
      }

      // Logging de acción administrativa
      logger.info(
        {
          action: "booking_staff_assignment",
          adminUser: authUser?.email,
          adminRole: authUser?.role,
          bookingId: id,
          bookingCode: updatedBooking.code,
          staffId: staffId ?? null,
          previousStaffId: null, // Se podría obtener del booking anterior si se necesita
        },
        staffId
          ? `Staff ${staffId} asignado a booking ${updatedBooking.code} por ${authUser?.email}`
          : `Staff desasignado de booking ${updatedBooking.code} por ${authUser?.email}`,
      );

      return c.json({ data: serializeBooking(updatedBooking) });
    } catch (error) {
      return handlePrismaError(c, error, {
        notFound: "Reserva no encontrada",
        default: "No se pudo asignar el staff a la reserva",
      });
    }
  },
);

router.delete(
  "/:id",
  authenticate,
  requireRoles(["ADMIN", "COORDINATOR"]),
  async (c) => {
    const id = c.req.param("id");
    const authUser = getAuthenticatedUser(c);

    try {
      const repository = getBookingRepository();

      // Obtener el booking antes de eliminarlo para logging
      const booking = await repository.findById(id);

      await repository.delete(id);

      // Logging de acción administrativa crítica
      logger.warn(
        {
          action: "booking_deleted",
          adminUser: authUser?.email,
          adminRole: authUser?.role,
          bookingId: id,
          bookingCode: booking?.code,
          bookingStatus: booking?.status,
        },
        `Booking ${booking?.code ?? id} eliminado por ${authUser?.email}`,
      );

      return c.json({ message: "Booking deleted successfully" });
    } catch (error) {
      return handlePrismaError(c, error, {
        notFound: "Reserva no encontrada",
        default: "No se pudo eliminar la reserva",
      });
    }
  },
);

export default router;
