import { db } from "../lib/db";
import { logger } from "../lib/logger";
import type { Booking, BookingStatus } from "../generated/prisma";
import {
  NotFoundError,
  ValidationError,
  ConflictError,
  ForbiddenError,
  BadRequestError,
} from "../lib/errors";
import { sanitizePlainText } from "../lib/sanitize";
import { stripeEnabled, getStripe } from "../lib/stripe";
import {
  sendBookingConfirmation,
  sendStatusUpdate,
  sendCompletionNotification,
} from "./notifications";
import { env } from "../config/env";
import type { AccessTokenPayload } from "../lib/token";
import type { CreateBookingInput } from "../schemas";

export interface CreateBookingData {
  propertyId: string;
  serviceId: string;
  scheduledAt: Date;
  notes?: string;
  userId: string;
  totalPrice?: number;
}

export interface UpdateBookingData {
  scheduledAt?: Date;
  status?: BookingStatus;
  notes?: string;
  completedAt?: Date;
  totalPrice?: number;
}

export interface BookingFilters {
  userId?: string;
  propertyId?: string;
  serviceId?: string;
  status?: BookingStatus;
}

type BookingWithRelations = Booking & {
  user: {
    id: string;
    name: string | null;
    email: string;
    phone: string | null;
  };
  property: { id: string; name: string; address: string };
  service: {
    id: string;
    name: string;
    basePrice: unknown;
    description?: string | null;
  };
};

/**
 * Booking Service
 *
 * Handles all business logic related to bookings:
 * - CRUD operations
 * - Status transitions
 * - Notifications
 * - Payment integration
 */
export class BookingService {
  /**
   * Get a booking by ID with relations
   */
  async getById(id: string): Promise<Booking> {
    const booking = await db.booking.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        property: { select: { id: true, name: true, address: true } },
        service: { select: { id: true, name: true, basePrice: true } },
      },
    });

    if (!booking) {
      throw new NotFoundError(`Booking with ID ${id} not found`);
    }

    return booking;
  }

  /**
   * Get all bookings with pagination and filters
   */
  async getAll(
    page: number,
    limit: number,
    filters?: BookingFilters,
  ): Promise<{
    data: Booking[];
    meta: { page: number; limit: number; total: number; totalPages: number };
  }> {
    if (page < 1) {
      throw new ValidationError("Page must be >= 1");
    }

    if (limit < 1 || limit > 100) {
      throw new ValidationError("Limit must be between 1 and 100");
    }

    const skip = (page - 1) * limit;

    const where = filters
      ? {
          ...(filters.userId && { userId: filters.userId }),
          ...(filters.propertyId && { propertyId: filters.propertyId }),
          ...(filters.serviceId && { serviceId: filters.serviceId }),
          ...(filters.status && { status: filters.status }),
        }
      : undefined;

    const [data, total] = await Promise.all([
      db.booking.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: { select: { id: true, name: true, email: true } },
          property: { select: { id: true, name: true, address: true } },
          service: { select: { id: true, name: true, basePrice: true } },
        },
        orderBy: { scheduledAt: "desc" },
      }),
      db.booking.count({ where }),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get bookings for a specific user
   */
  async getUserBookings(userId: string): Promise<Booking[]> {
    return await db.booking.findMany({
      where: { userId },
      include: {
        service: { select: { id: true, name: true, basePrice: true } },
        property: { select: { id: true, name: true, address: true } },
      },
      orderBy: { scheduledAt: "asc" },
    });
  }

  /**
   * Create a new booking with full domain validation
   */
  async create(
    data: CreateBookingData,
    options: { authUser?: AccessTokenPayload | null } = {},
  ): Promise<BookingWithRelations> {
    const scheduledDate = new Date(data.scheduledAt);

    const property = await db.property.findUnique({
      where: { id: data.propertyId },
      select: { id: true, userId: true, name: true, address: true },
    });

    if (!property) {
      throw new NotFoundError(`Property with ID ${data.propertyId} not found`);
    }

    const service = await db.service.findUnique({
      where: { id: data.serviceId },
      select: {
        id: true,
        name: true,
        basePrice: true,
        duration: true,
        active: true,
        description: true,
      },
    });

    if (!service) {
      throw new NotFoundError(`Service with ID ${data.serviceId} not found`);
    }

    if (!service.active) {
      throw new BadRequestError("This service is currently unavailable");
    }

    const user = await db.user.findUnique({
      where: { id: data.userId },
      select: { id: true, email: true, name: true, phone: true },
    });

    if (!user) {
      throw new NotFoundError(`User with ID ${data.userId} not found`);
    }

    if (
      options.authUser?.role === "CLIENT" &&
      options.authUser.sub !== data.userId
    ) {
      throw new ForbiddenError(
        "You can only create bookings for your own user",
      );
    }

    if (
      options.authUser?.role === "CLIENT" &&
      property.userId &&
      property.userId !== options.authUser.sub
    ) {
      throw new ForbiddenError(
        "You can only create bookings for your own properties",
      );
    }

    const serviceDurationMs = service.duration * 60 * 1000;
    const bookingEndTime = new Date(
      scheduledDate.getTime() + serviceDurationMs,
    );

    const conflictingBookings = await db.booking.findMany({
      where: {
        propertyId: data.propertyId,
        status: {
          in: ["PENDING", "CONFIRMED", "IN_PROGRESS"],
        },
        OR: [
          {
            AND: [
              { scheduledAt: { lte: scheduledDate } },
              {
                scheduledAt: {
                  gte: new Date(scheduledDate.getTime() - serviceDurationMs),
                },
              },
            ],
          },
          {
            AND: [
              { scheduledAt: { lte: bookingEndTime } },
              { scheduledAt: { gte: scheduledDate } },
            ],
          },
        ],
      },
      select: { id: true },
    });

    if (conflictingBookings.length > 0) {
      throw new ConflictError(
        "This time slot conflicts with an existing booking for this property",
        {
          conflictingBookingIds: conflictingBookings.map((b) => b.id),
        },
      );
    }

    const totalPrice =
      data.totalPrice ?? Number.parseFloat(String(service.basePrice));

    const sanitizedNotes = data.notes
      ? sanitizePlainText(data.notes)
      : undefined;

    const booking = (await db.booking.create({
      data: {
        propertyId: data.propertyId,
        serviceId: data.serviceId,
        userId: data.userId,
        scheduledAt: scheduledDate,
        status: "PENDING",
        notes: sanitizedNotes,
        totalPrice,
      },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        property: { select: { id: true, name: true, address: true } },
        service: {
          select: { id: true, name: true, basePrice: true, description: true },
        },
      },
    })) as BookingWithRelations;

    logger.info(
      {
        bookingId: booking.id,
        userId: user.id,
      },
      "Booking created",
    );

    return booking;
  }

  async createWithIntegrations(
    payload: CreateBookingInput,
    authUser: AccessTokenPayload | null,
  ): Promise<{ booking: BookingWithRelations; checkoutUrl: string | null }> {
    let bookingRecord = await this.create(
      {
        propertyId: payload.propertyId,
        serviceId: payload.serviceId,
        scheduledAt: payload.scheduledAt,
        notes: payload.notes,
        userId: payload.userId,
        totalPrice: payload.totalPrice,
      },
      { authUser },
    );

    let checkoutUrl: string | null = null;

    if (stripeEnabled()) {
      try {
        const stripe = getStripe();
        const session = await stripe.checkout.sessions.create({
          mode: "payment",
          success_url: env.stripe.successUrl,
          cancel_url: env.stripe.cancelUrl,
          customer_email: bookingRecord.user.email,
          metadata: {
            bookingId: bookingRecord.id,
          },
          line_items: [
            {
              price_data: {
                currency: "usd",
                product_data: {
                  name: bookingRecord.service.name,
                  description: bookingRecord.service.description ?? undefined,
                },
                unit_amount: Math.round(Number(bookingRecord.totalPrice) * 100),
              },
              quantity: 1,
            },
          ],
        });

        bookingRecord = (await db.booking.update({
          where: { id: bookingRecord.id },
          data: {
            checkoutSessionId: session.id,
            paymentStatus: "PENDING_PAYMENT",
            paymentIntentId:
              typeof session.payment_intent === "string"
                ? session.payment_intent
                : (session.payment_intent?.id ?? undefined),
          },
          include: {
            user: {
              select: { id: true, name: true, email: true, phone: true },
            },
            property: { select: { id: true, name: true, address: true } },
            service: {
              select: {
                id: true,
                name: true,
                basePrice: true,
                description: true,
              },
            },
          },
        })) as BookingWithRelations;

        checkoutUrl = session.url ?? null;
      } catch (error) {
        logger.error(
          {
            error: error instanceof Error ? error.message : "unknown",
            bookingId: bookingRecord.id,
          },
          "Stripe checkout session error",
        );
      }
    }

    if (bookingRecord.user.phone) {
      const scheduledAt = new Date(bookingRecord.scheduledAt);
      const scheduledDate = scheduledAt.toLocaleDateString("es-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      const scheduledTime = scheduledAt.toLocaleTimeString("es-US", {
        hour: "2-digit",
        minute: "2-digit",
      });

      void sendBookingConfirmation(
        {
          clientName: bookingRecord.user.name ?? "Cliente",
          clientPhone: bookingRecord.user.phone,
          serviceName: bookingRecord.service.name,
          propertyName: bookingRecord.property.name,
          propertyAddress: bookingRecord.property.address,
          scheduledDate,
          scheduledTime,
          totalPrice: Number(bookingRecord.totalPrice).toFixed(2),
          bookingId: bookingRecord.id,
        },
        "PENDING",
      );
    }

    return { booking: bookingRecord, checkoutUrl };
  }

  /**
   * Update a booking
   *
   * Handles status transitions and sends appropriate notifications
   */
  async update(
    id: string,
    data: UpdateBookingData,
    options: { authUser?: AccessTokenPayload | null } = {},
  ): Promise<BookingWithRelations> {
    const existingBooking = await db.booking.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        property: { select: { id: true, name: true, address: true } },
        service: {
          select: { id: true, name: true, basePrice: true, description: true },
        },
      },
    });

    if (!existingBooking) {
      throw new NotFoundError(`Booking with ID ${id} not found`);
    }

    if (options.authUser?.role === "CLIENT") {
      throw new ForbiddenError("Clients cannot update bookings");
    }

    // Validate status transitions
    if (data.status) {
      this.validateStatusTransition(existingBooking.status, data.status);
    }

    const sanitizedNotes =
      data.notes === undefined
        ? undefined
        : data.notes === ""
          ? undefined
          : sanitizePlainText(data.notes);

    const updatePayload: Record<string, unknown> = {
      ...(data.scheduledAt && { scheduledAt: data.scheduledAt }),
      ...(data.status && { status: data.status }),
      ...(sanitizedNotes !== undefined && { notes: sanitizedNotes }),
      ...(data.totalPrice && { totalPrice: data.totalPrice }),
    };

    if (data.status === "COMPLETED") {
      updatePayload.completedAt = data.completedAt ?? new Date();
    }

    const booking = (await db.booking.update({
      where: { id },
      data: updatePayload,
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        property: { select: { id: true, name: true, address: true } },
        service: {
          select: { id: true, name: true, basePrice: true, description: true },
        },
      },
    })) as BookingWithRelations;

    if (data.status && data.status !== existingBooking.status) {
      this.handleStatusNotification(booking, data.status);
    }

    return booking;
  }

  /**
   * Delete a booking
   *
   * Only allows deletion of SCHEDULED or CANCELLED bookings
   */
  async delete(id: string): Promise<void> {
    const booking = await this.getById(id);

    // Only allow deletion of pending or cancelled bookings
    if (!["PENDING", "CANCELLED"].includes(booking.status)) {
      throw new ValidationError(
        `Cannot delete booking with status ${booking.status}. Only PENDING or CANCELLED bookings can be deleted.`,
      );
    }

    await db.booking.delete({ where: { id } });
  }

  /**
   * Validate status transitions
   */
  private validateStatusTransition(
    currentStatus: BookingStatus,
    newStatus: BookingStatus,
  ): void {
    const validTransitions: Record<BookingStatus, BookingStatus[]> = {
      PENDING: ["CONFIRMED", "CANCELLED"],
      CONFIRMED: ["IN_PROGRESS", "CANCELLED"],
      IN_PROGRESS: ["COMPLETED", "CANCELLED"],
      COMPLETED: [],
      CANCELLED: [],
    };

    const allowedStatuses = validTransitions[currentStatus];

    if (!allowedStatuses.includes(newStatus)) {
      throw new ValidationError(
        `Invalid status transition from ${currentStatus} to ${newStatus}. Allowed: ${allowedStatuses.join(", ")}`,
      );
    }
  }

  /**
   * Send notifications based on status change
   */
  private handleStatusNotification(
    booking: BookingWithRelations,
    newStatus: BookingStatus,
  ): void {
    if (!booking.user.phone) {
      logger.info(
        {
          bookingId: booking.id,
          status: newStatus,
        },
        "Booking status changed (no phone available for notification)",
      );
      return;
    }

    const formattedPrice = Number(booking.totalPrice).toFixed(2);
    const scheduledAt = new Date(booking.scheduledAt);
    const scheduledDate = scheduledAt.toLocaleDateString("es-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const scheduledTime = scheduledAt.toLocaleTimeString("es-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

    switch (newStatus) {
      case "IN_PROGRESS":
        void sendStatusUpdate({
          clientName: booking.user.name ?? "Cliente",
          clientPhone: booking.user.phone,
          serviceName: booking.service.name,
          propertyName: booking.property.name,
          status: newStatus,
          bookingId: booking.id,
        });
        break;
      case "COMPLETED":
        void sendCompletionNotification({
          clientName: booking.user.name ?? "Cliente",
          clientPhone: booking.user.phone,
          serviceName: booking.service.name,
          propertyName: booking.property.name,
          bookingId: booking.id,
        });
        break;
      case "CANCELLED":
        void sendStatusUpdate({
          clientName: booking.user.name ?? "Cliente",
          clientPhone: booking.user.phone,
          serviceName: booking.service.name,
          propertyName: booking.property.name,
          status: newStatus,
          bookingId: booking.id,
        });
        break;
      case "CONFIRMED":
        void sendBookingConfirmation(
          {
            clientName: booking.user.name ?? "Cliente",
            clientPhone: booking.user.phone,
            serviceName: booking.service.name,
            propertyName: booking.property.name,
            propertyAddress: booking.property.address,
            scheduledDate,
            scheduledTime,
            totalPrice: formattedPrice,
            bookingId: booking.id,
          },
          "CONFIRMED",
        );
        break;
      default:
        logger.info(
          {
            bookingId: booking.id,
            status: newStatus,
          },
          "Booking status change without notification handler",
        );
        break;
    }
  }
}

// Export singleton instance
export const bookingService = new BookingService();
