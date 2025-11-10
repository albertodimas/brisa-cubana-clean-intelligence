import { Hono } from "hono";
import { z } from "zod";
import { authenticate, requireRoles } from "../middleware/auth.js";
import { getBookingRepository } from "../container.js";
import { serializeBooking } from "../lib/serializers.js";
import { calendarLogger } from "../lib/logger.js";
import type { BookingStatus } from "@prisma/client";
import type { BookingWithRelations } from "../repositories/booking-repository.js";

const router = new Hono();

type CalendarBookingPayload = {
  id: string;
  code: string;
  scheduledAt: string;
  durationMin: number;
  status: BookingStatus;
  totalAmount: number;
  service?: { id: string; name: string } | null;
  property?: { id: string; label: string } | null;
  customer?: {
    id: string;
    fullName: string | null;
    email: string;
  } | null;
  assignedStaff?: {
    id: string;
    fullName: string | null;
    email: string;
  } | null;
};

type CalendarResponsePayload = {
  bookingsByDate: Record<string, CalendarBookingPayload[]>;
  dateRange: string[];
  summary: {
    totalBookings: number;
    statusCounts: Record<string, number>;
    totalRevenue: string;
  };
};

type CalendarCacheEntry = {
  expiresAt: number;
  payload: CalendarResponsePayload;
  cachedAt: number;
};

const calendarCacheTtlMs = Math.max(
  0,
  Number(process.env.CALENDAR_CACHE_TTL_MS ?? "60000"),
);

const calendarCache = new Map<string, CalendarCacheEntry>();

const calendarQuerySchema = z.object({
  from: z.coerce.date(),
  to: z.coerce.date(),
  status: z
    .enum(["PENDING", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED"])
    .optional(),
  propertyId: z.string().cuid().optional(),
  serviceId: z.string().cuid().optional(),
  assignedStaffId: z.string().cuid().optional(),
});

/**
 * GET /api/calendar
 * Returns bookings grouped by date for calendar visualization
 */
router.get(
  "/",
  authenticate,
  requireRoles(["ADMIN", "COORDINATOR", "STAFF"]),
  async (c) => {
    const startedAt = Date.now();
    const parsed = calendarQuerySchema.safeParse(c.req.query());
    if (!parsed.success) {
      return c.json({ error: parsed.error.flatten() }, 400);
    }

    const { from, to, status, propertyId, serviceId, assignedStaffId } =
      parsed.data;

    // Validate date range
    if (from > to) {
      return c.json(
        {
          error: "Invalid date range: 'from' must be before or equal to 'to'",
        },
        400,
      );
    }

    // Limit to 90 days to prevent performance issues
    const daysDiff = Math.ceil(
      (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (daysDiff > 90) {
      return c.json(
        {
          error: "Date range too large: maximum 90 days allowed",
        },
        400,
      );
    }

    const repository = getBookingRepository();

    // Build filters
    const filters: {
      from?: Date;
      to?: Date;
      status?: BookingStatus;
      propertyId?: string;
      serviceId?: string;
      assignedStaffId?: string;
    } = {
      from,
      to,
    };

    if (status) {
      filters.status = status;
    }
    if (propertyId) {
      filters.propertyId = propertyId;
    }
    if (serviceId) {
      filters.serviceId = serviceId;
    }
    if (assignedStaffId) {
      filters.assignedStaffId = assignedStaffId;
    }

    const cacheKey = buildCacheKey({
      from: from.toISOString(),
      to: to.toISOString(),
      status,
      propertyId,
      serviceId,
      assignedStaffId,
    });

    const cached =
      calendarCacheTtlMs > 0 ? getCachedResponse(cacheKey) : undefined;
    if (cached) {
      const durationMs = Date.now() - startedAt;
      calendarLogger.debug({
        event: "calendar_cache_hit",
        cacheHit: true,
        durationMs,
      });
      return c.json({
        data: cached.payload,
        meta: {
          cacheHit: true,
          cachedAt: new Date(cached.cachedAt).toISOString(),
          durationMs,
        },
      });
    }

    // Fetch all bookings in range (high limit for calendar view)
    // Note: If a property has more than 2000 bookings in 90 days,
    // consider implementing server-side pagination for the calendar
    const result = await repository.findManyPaginated(
      2000, // Increased limit to handle high-volume properties
      undefined,
      filters,
      true,
      {
        orderBy: [{ scheduledAt: "asc" }],
      },
    );

    // Group bookings by date
    const bookingsByDate: Record<string, CalendarBookingPayload[]> = {};

    for (const booking of result.data) {
      // Extract date in YYYY-MM-DD format in local timezone
      const date = new Date(booking.scheduledAt);
      const dateKey = date.toISOString().split("T")[0];

      if (!dateKey) continue;

      if (!bookingsByDate[dateKey]) {
        bookingsByDate[dateKey] = [];
      }

      bookingsByDate[dateKey].push(transformBookingForCalendar(booking));
    }

    // Generate date range to include empty dates
    const dateRange: string[] = [];
    const currentDate = new Date(from);
    while (currentDate <= to) {
      const dateKey = currentDate.toISOString().split("T")[0];
      if (dateKey) {
        dateRange.push(dateKey);
        if (!bookingsByDate[dateKey]) {
          bookingsByDate[dateKey] = [];
        }
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Calculate summary statistics
    const totalBookings = result.data.length;
    const statusCounts = result.data.reduce(
      (acc, booking) => {
        acc[booking.status] = (acc[booking.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const totalRevenue = result.data.reduce(
      (sum, booking) => sum + Number(booking.totalAmount),
      0,
    );

    const payload: CalendarResponsePayload = {
      bookingsByDate,
      dateRange,
      summary: {
        totalBookings,
        statusCounts,
        totalRevenue: totalRevenue.toFixed(2),
      },
    };

    if (calendarCacheTtlMs > 0) {
      calendarCache.set(cacheKey, {
        expiresAt: Date.now() + calendarCacheTtlMs,
        payload,
        cachedAt: Date.now(),
      });
    }

    const durationMs = Date.now() - startedAt;
    calendarLogger.info({
      event: "calendar_query",
      durationMs,
      cacheHit: false,
      filters: {
        status,
        propertyId,
        serviceId,
        assignedStaffId,
      },
      totalBookings,
    });

    return c.json({
      data: payload,
      meta: {
        cacheHit: false,
        durationMs,
      },
    });
  },
);

/**
 * GET /api/calendar/availability
 * Returns available time slots for a given date and property
 */
router.get(
  "/availability",
  authenticate,
  requireRoles(["ADMIN", "COORDINATOR", "STAFF"]),
  async (c) => {
    const schema = z.object({
      date: z.coerce.date(),
      propertyId: z.string().cuid(),
      durationMin: z.coerce.number().int().min(30).default(60),
    });

    const parsed = schema.safeParse(c.req.query());
    if (!parsed.success) {
      return c.json({ error: parsed.error.flatten() }, 400);
    }

    const { date, propertyId, durationMin } = parsed.data;

    // Get all bookings for the property on this date
    const repository = getBookingRepository();

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const result = await repository.findManyPaginated(
      100,
      undefined,
      {
        from: startOfDay,
        to: endOfDay,
        propertyId,
      },
      true,
      {
        orderBy: [{ scheduledAt: "asc" }],
      },
    );

    // Generate time slots (8 AM to 8 PM in 30-minute intervals)
    const workStartHour = 8;
    const workEndHour = 20;
    const slotIntervalMin = 30;

    const timeSlots: {
      time: string;
      available: boolean;
      bookingId?: string;
    }[] = [];

    for (let hour = workStartHour; hour < workEndHour; hour++) {
      for (let minute = 0; minute < 60; minute += slotIntervalMin) {
        const slotTime = new Date(date);
        slotTime.setHours(hour, minute, 0, 0);

        const slotEndTime = new Date(slotTime);
        slotEndTime.setMinutes(slotEndTime.getMinutes() + durationMin);

        // Check if this slot conflicts with any booking (optimized to run once)
        const conflictingBooking = result.data.find((booking) => {
          const bookingStart = new Date(booking.scheduledAt);
          const bookingEnd = new Date(bookingStart);
          bookingEnd.setMinutes(bookingEnd.getMinutes() + booking.durationMin);

          // Check for overlap
          return (
            (slotTime >= bookingStart && slotTime < bookingEnd) ||
            (slotEndTime > bookingStart && slotEndTime <= bookingEnd) ||
            (slotTime <= bookingStart && slotEndTime >= bookingEnd)
          );
        });

        const hasConflict = !!conflictingBooking;

        timeSlots.push({
          time: slotTime.toISOString(),
          available: !hasConflict,
          ...(conflictingBooking ? { bookingId: conflictingBooking.id } : {}),
        });
      }
    }

    return c.json({
      data: {
        date: date.toISOString(),
        propertyId,
        durationMin,
        timeSlots,
        bookings: result.data.map((b) => serializeBooking(b)),
      },
    });
  },
);

export default router;

function buildCacheKey(filters: Record<string, string | undefined>) {
  const entries = Object.entries(filters)
    .filter(([, value]) => value !== undefined)
    .sort(([a], [b]) => a.localeCompare(b));
  return JSON.stringify(entries);
}

function getCachedResponse(key: string) {
  const entry = calendarCache.get(key);
  if (!entry) {
    return undefined;
  }
  if (entry.expiresAt < Date.now()) {
    calendarCache.delete(key);
    return undefined;
  }
  return entry;
}

function transformBookingForCalendar(
  booking: BookingWithRelations,
): CalendarBookingPayload {
  return {
    id: booking.id,
    code: booking.code,
    scheduledAt: booking.scheduledAt.toISOString(),
    durationMin: booking.durationMin,
    status: booking.status,
    totalAmount: Number(booking.totalAmount),
    service: booking.service
      ? {
          id: booking.service.id,
          name: booking.service.name,
        }
      : null,
    property: booking.property
      ? {
          id: booking.property.id,
          label: booking.property.label,
        }
      : null,
    customer: booking.customer
      ? {
          id: booking.customer.id,
          fullName: booking.customer.fullName,
          email: booking.customer.email,
        }
      : null,
    assignedStaff: booking.assignedStaff
      ? {
          id: booking.assignedStaff.id,
          fullName: booking.assignedStaff.fullName,
          email: booking.assignedStaff.email,
        }
      : null,
  };
}
