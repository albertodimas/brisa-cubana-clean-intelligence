import { db } from "../lib/db";
import { logger } from "../lib/logger";
import type { Booking, BookingStatus } from "../generated/prisma";
import { NotFoundError, ValidationError, ConflictError } from "../lib/errors";

export interface CreateBookingData {
  propertyId: string;
  serviceId: string;
  scheduledAt: Date;
  notes?: string;
  userId: string;
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
   * Create a new booking
   * 
   * Validates property and service exist, creates booking, sends confirmation email
   */
  async create(data: CreateBookingData): Promise<Booking> {
    // Validate property exists
    const property = await db.property.findUnique({
      where: { id: data.propertyId },
    });

    if (!property) {
      throw new NotFoundError(`Property with ID ${data.propertyId} not found`);
    }

    // Validate service exists
    const service = await db.service.findUnique({
      where: { id: data.serviceId },
    });

    if (!service) {
      throw new NotFoundError(
        `Service with ID ${data.serviceId} not found`,
      );
    }

    // Validate user exists
    const user = await db.user.findUnique({
      where: { id: data.userId },
      select: { id: true, email: true, name: true },
    });

    if (!user) {
      throw new NotFoundError(`User with ID ${data.userId} not found`);
    }

    // Check for overlapping bookings
    const scheduledDate = new Date(data.scheduledAt);
    const existingBooking = await db.booking.findFirst({
      where: {
        propertyId: data.propertyId,
        scheduledAt: scheduledDate,
        status: { in: ["CONFIRMED", "IN_PROGRESS"] },
      },
    });

    if (existingBooking) {
      throw new ConflictError(
        "There is already a booking scheduled for this property at this time",
      );
    }

    // Create booking
    const booking = await db.booking.create({
      data: {
        propertyId: data.propertyId,
        serviceId: data.serviceId,
        userId: data.userId,
        scheduledAt: scheduledDate,
        status: "PENDING",
        notes: data.notes,
        totalPrice: service.basePrice,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        property: { select: { id: true, name: true, address: true } },
        service: { select: { id: true, name: true, basePrice: true } },
      },
    });

    // Log booking creation (notifications can be added later)
    logger.info(`Booking created: ${booking.id} for user ${user.id}`);

    return booking;
  }

  /**
   * Update a booking
   * 
   * Handles status transitions and sends appropriate notifications
   */
  async update(id: string, data: UpdateBookingData): Promise<Booking> {
    const existingBooking = await this.getById(id);

    // Validate status transitions
    if (data.status) {
      this.validateStatusTransition(existingBooking.status, data.status);
    }

    // Update booking
    const booking = await db.booking.update({
      where: { id },
      data: {
        ...(data.scheduledAt && { scheduledAt: data.scheduledAt }),
        ...(data.status && { status: data.status }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.completedAt && { completedAt: data.completedAt }),
        ...(data.totalPrice && { totalPrice: data.totalPrice }),
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        property: { select: { id: true, name: true, address: true } },
        service: { select: { id: true, name: true, basePrice: true } },
      },
    });

    // Send notifications based on status change
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
    booking: Booking & {
      user: { id: string; name: string | null; email: string };
      property: { id: string; name: string; address: string };
      service: { id: string; name: string; basePrice: unknown };
    },
    newStatus: BookingStatus,
  ): void {
    // Notifications are handled by a separate system
    // This is a placeholder for future implementation
    logger.info(
      `Booking ${booking.id} status changed to ${newStatus} for user ${booking.user.id}`,
    );
  }
}

// Export singleton instance
export const bookingService = new BookingService();
