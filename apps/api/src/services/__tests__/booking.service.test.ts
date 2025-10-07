import { describe, it, expect, vi, beforeEach } from "vitest";
import { BookingService } from "../booking.service";
import {
  NotFoundError,
  ValidationError,
  ConflictError,
} from "../../lib/errors";

// Mock del logger
vi.mock("../../lib/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock del db - debe ser inline para vi.mock
vi.mock("../../lib/db", () => ({
  db: {
    booking: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    property: {
      findUnique: vi.fn(),
    },
    service: {
      findUnique: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
  },
}));

// Import after mocking
import { db } from "../../lib/db";

describe("BookingService", () => {
  let bookingService: BookingService;

  beforeEach(() => {
    bookingService = new BookingService();
    vi.clearAllMocks();
  });

  describe("getById", () => {
    it("should return booking with relations", async () => {
      const mockBooking = {
        id: "booking-1",
        userId: "user-1",
        propertyId: "property-1",
        serviceId: "service-1",
        scheduledAt: new Date("2025-10-10T10:00:00Z"),
        status: "CONFIRMED",
        price: 150,
        currency: "usd",
        user: { id: "user-1", email: "user@test.com", name: "Test User" },
        property: { id: "property-1", name: "Test Property" },
        service: { id: "service-1", name: "Deep Cleaning" },
      };

      vi.spyOn(db.booking, "findUnique").mockResolvedValue(mockBooking);

      const result = await bookingService.getById("booking-1");

      expect(result).toEqual(mockBooking);
      expect(db.booking.findUnique).toHaveBeenCalledWith({
        where: { id: "booking-1" },
        include: {
          user: { select: { id: true, name: true, email: true } },
          property: { select: { id: true, name: true, address: true } },
          service: { select: { id: true, name: true, basePrice: true } },
        },
      });
    });

    it("should throw NotFoundError when booking does not exist", async () => {
      vi.spyOn(db.booking, "findUnique").mockResolvedValue(null);

      await expect(bookingService.getById("non-existent")).rejects.toThrow(
        NotFoundError,
      );
      await expect(bookingService.getById("non-existent")).rejects.toThrow(
        "Booking with ID non-existent not found",
      );
    });
  });

  describe("getAll", () => {
    it("should return paginated bookings with default pagination", async () => {
      const mockBookings = [
        {
          id: "booking-1",
          userId: "user-1",
          scheduledAt: new Date("2025-10-10T10:00:00Z"),
          status: "CONFIRMED",
        },
        {
          id: "booking-2",
          userId: "user-2",
          scheduledAt: new Date("2025-10-11T14:00:00Z"),
          status: "PENDING",
        },
      ];

      vi.spyOn(db.booking, "findMany").mockResolvedValue(mockBookings as any);
      vi.spyOn(db.booking, "count").mockResolvedValue(2);

      const result = await bookingService.getAll(1, 10);

      expect(result).toEqual({
        data: mockBookings,
        meta: {
          page: 1,
          limit: 10,
          total: 2,
          totalPages: 1,
        },
      });

      expect(db.booking.findMany).toHaveBeenCalledWith({
        where: undefined,
        skip: 0,
        take: 10,
        include: {
          user: { select: { id: true, name: true, email: true } },
          property: { select: { id: true, name: true, address: true } },
          service: { select: { id: true, name: true, basePrice: true } },
        },
        orderBy: { scheduledAt: "desc" },
      });
    });

    it("should filter bookings by userId", async () => {
      const mockBookings = [
        {
          id: "booking-1",
          userId: "user-1",
          scheduledAt: new Date(),
          status: "CONFIRMED",
        },
      ];

      vi.spyOn(db.booking, "findMany").mockResolvedValue(mockBookings as any);
      vi.spyOn(db.booking, "count").mockResolvedValue(1);

      const result = await bookingService.getAll(1, 10, { userId: "user-1" });

      expect(db.booking.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: "user-1" },
          include: {
            user: { select: { id: true, name: true, email: true } },
            property: { select: { id: true, name: true, address: true } },
            service: { select: { id: true, name: true, basePrice: true } },
          },
        }),
      );
    });

    it("should filter bookings by status", async () => {
      vi.spyOn(db.booking, "findMany").mockResolvedValue([]);
      vi.spyOn(db.booking, "count").mockResolvedValue(0);

      await bookingService.getAll(1, 10, { status: "CONFIRMED" });

      expect(db.booking.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: "CONFIRMED" },
          include: {
            user: { select: { id: true, name: true, email: true } },
            property: { select: { id: true, name: true, address: true } },
            service: { select: { id: true, name: true, basePrice: true } },
          },
        }),
      );
    });
  });

  describe("getUserBookings", () => {
    it("should return all bookings for a user", async () => {
      const mockBookings = [
        {
          id: "booking-1",
          userId: "user-1",
          scheduledAt: new Date("2025-10-10T10:00:00Z"),
          status: "CONFIRMED",
        },
        {
          id: "booking-2",
          userId: "user-1",
          scheduledAt: new Date("2025-10-11T14:00:00Z"),
          status: "PENDING",
        },
      ];

      vi.spyOn(db.booking, "findMany").mockResolvedValue(mockBookings as any);

      const result = await bookingService.getUserBookings("user-1");

      expect(result).toEqual(mockBookings);
      expect(db.booking.findMany).toHaveBeenCalledWith({
        where: { userId: "user-1" },
        include: {
          service: { select: { id: true, name: true, basePrice: true } },
          property: { select: { id: true, name: true, address: true } },
        },
        orderBy: { scheduledAt: "asc" },
      });
    });
  });

  describe("create", () => {
    const validBookingData = {
      userId: "user-1",
      propertyId: "property-1",
      serviceId: "service-1",
      scheduledAt: new Date("2025-10-15T10:00:00Z"),
      price: 150,
      currency: "usd",
      status: "PENDING" as const,
    };

    beforeEach(() => {
      // Mock para property, service y user existentes
      vi.spyOn(db.property, "findUnique").mockResolvedValue({
        id: "property-1",
        name: "Test Property",
        address: "123 Main St",
        userId: "user-1",
      } as any);
      vi.spyOn(db.service, "findUnique").mockResolvedValue({
        id: "service-1",
        name: "Deep Cleaning",
        basePrice: 150,
        duration: 120,
        active: true,
        description: "Deep cleaning service",
      } as any);
      vi.spyOn(db.user, "findUnique").mockResolvedValue({
        id: "user-1",
        email: "user@test.com",
        name: "Test User",
        phone: "+1234567890",
      } as any);
      // Sin conflictos por defecto
      vi.spyOn(db.booking, "findMany").mockResolvedValue([]);
    });

    it("should create booking successfully", async () => {
      const mockCreatedBooking = {
        ...validBookingData,
        id: "booking-new",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.spyOn(db.booking, "create").mockResolvedValue(
        mockCreatedBooking as any,
      );

      const result = await bookingService.create(validBookingData);

      expect(result).toEqual(mockCreatedBooking);
      expect(db.booking.create).toHaveBeenCalledWith({
        data: {
          propertyId: validBookingData.propertyId,
          serviceId: validBookingData.serviceId,
          userId: validBookingData.userId,
          scheduledAt: validBookingData.scheduledAt,
          status: "PENDING",
          notes: undefined,
          totalPrice: 150,
        },
        include: {
          user: { select: { id: true, name: true, email: true, phone: true } },
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
      });
    });

    it("should throw NotFoundError when property does not exist", async () => {
      vi.spyOn(db.property, "findUnique").mockResolvedValue(null);

      await expect(bookingService.create(validBookingData)).rejects.toThrow(
        NotFoundError,
      );
      await expect(bookingService.create(validBookingData)).rejects.toThrow(
        "Property with ID property-1 not found",
      );
    });

    it("should throw NotFoundError when service does not exist", async () => {
      vi.spyOn(db.service, "findUnique").mockResolvedValue(null);

      await expect(bookingService.create(validBookingData)).rejects.toThrow(
        NotFoundError,
      );
      await expect(bookingService.create(validBookingData)).rejects.toThrow(
        "Service with ID service-1 not found",
      );
    });

    it("should throw NotFoundError when user does not exist", async () => {
      vi.spyOn(db.user, "findUnique").mockResolvedValue(null);

      await expect(bookingService.create(validBookingData)).rejects.toThrow(
        NotFoundError,
      );
      await expect(bookingService.create(validBookingData)).rejects.toThrow(
        "User with ID user-1 not found",
      );
    });

    it("should throw ConflictError when booking overlaps with existing one", async () => {
      const conflictingBooking = {
        id: "booking-existing",
        propertyId: "property-1",
        scheduledAt: new Date("2025-10-15T10:00:00Z"),
        status: "CONFIRMED",
      };

      vi.spyOn(db.booking, "findMany").mockResolvedValue([
        conflictingBooking,
      ] as any);

      await expect(bookingService.create(validBookingData)).rejects.toThrow(
        ConflictError,
      );
      await expect(bookingService.create(validBookingData)).rejects.toThrow(
        "This time slot conflicts with an existing booking for this property",
      );
    });

    it("should not conflict with CANCELLED bookings", async () => {
      const cancelledBooking = {
        id: "booking-cancelled",
        propertyId: "property-1",
        scheduledAt: new Date("2025-10-15T10:00:00Z"),
        status: "CANCELLED",
      };

      vi.spyOn(db.booking, "findMany").mockResolvedValue([]);
      vi.spyOn(db.booking, "create").mockResolvedValue({
        ...validBookingData,
        id: "booking-new",
      } as any);

      const result = await bookingService.create(validBookingData);

      expect(result).toBeDefined();
      expect(db.booking.create).toHaveBeenCalled();
    });
  });

  describe("update", () => {
    const existingBooking = {
      id: "booking-1",
      userId: "user-1",
      propertyId: "property-1",
      serviceId: "service-1",
      scheduledAt: new Date("2025-10-10T10:00:00Z"),
      status: "PENDING",
      price: 150,
      currency: "usd",
      user: {
        id: "user-1",
        name: "Test User",
        email: "test@example.com",
        phone: "+1234567890",
      },
      property: {
        id: "property-1",
        name: "Test Property",
        address: "123 Main St",
      },
      service: {
        id: "service-1",
        name: "Deep Cleaning",
        basePrice: 100,
        description: "Deep cleaning service",
      },
    };

    beforeEach(() => {
      vi.spyOn(db.booking, "findUnique").mockResolvedValue(
        existingBooking as any,
      );
    });

    it("should update booking successfully", async () => {
      const updateData = {
        status: "CONFIRMED" as const,
        notes: "Confirmed by admin",
      };

      const updatedBooking = {
        ...existingBooking,
        ...updateData,
      };

      vi.spyOn(db.booking, "update").mockResolvedValue(updatedBooking as any);

      const result = await bookingService.update("booking-1", updateData);

      expect(result).toEqual(updatedBooking);
      expect(db.booking.update).toHaveBeenCalledWith({
        where: { id: "booking-1" },
        data: {
          status: "CONFIRMED",
          notes: "Confirmed by admin",
        },
        include: {
          user: { select: { id: true, name: true, email: true, phone: true } },
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
      });
    });

    // Authorization tests should be in routes layer tests, not service tests

    it("should throw ValidationError for invalid status transition", async () => {
      const bookingInProgress = {
        ...existingBooking,
        status: "IN_PROGRESS",
      };

      vi.spyOn(db.booking, "findUnique").mockResolvedValue(
        bookingInProgress as any,
      );

      await expect(
        bookingService.update("booking-1", { status: "PENDING" }),
      ).rejects.toThrow(ValidationError);
      await expect(
        bookingService.update("booking-1", { status: "PENDING" }),
      ).rejects.toThrow("Invalid status transition");
    });

    it("should allow valid status transitions", async () => {
      const validTransitions = [
        { from: "PENDING", to: "CONFIRMED" },
        { from: "CONFIRMED", to: "IN_PROGRESS" },
        { from: "IN_PROGRESS", to: "COMPLETED" },
        { from: "PENDING", to: "CANCELLED" },
      ];

      for (const transition of validTransitions) {
        vi.spyOn(db.booking, "findUnique").mockResolvedValue({
          ...existingBooking,
          status: transition.from,
        } as any);

        vi.spyOn(db.booking, "update").mockResolvedValue({
          ...existingBooking,
          status: transition.to,
        } as any);

        await expect(
          bookingService.update("booking-1", { status: transition.to as any }),
        ).resolves.toBeDefined();
      }
    });

    it("should allow CANCELLED from any status", async () => {
      const statuses = ["PENDING", "CONFIRMED", "IN_PROGRESS"];

      for (const status of statuses) {
        vi.spyOn(db.booking, "findUnique").mockResolvedValue({
          ...existingBooking,
          status,
        } as any);

        vi.spyOn(db.booking, "update").mockResolvedValue({
          ...existingBooking,
          status: "CANCELLED",
        } as any);

        await expect(
          bookingService.update("booking-1", { status: "CANCELLED" }),
        ).resolves.toBeDefined();
      }
    });
  });

  describe("delete", () => {
    it("should delete PENDING booking successfully", async () => {
      const pendingBooking = {
        id: "booking-1",
        userId: "user-1",
        status: "PENDING",
      };

      vi.spyOn(db.booking, "findUnique").mockResolvedValue(
        pendingBooking as any,
      );
      vi.spyOn(db.booking, "delete").mockResolvedValue(pendingBooking as any);

      await bookingService.delete("booking-1");

      expect(db.booking.delete).toHaveBeenCalledWith({
        where: { id: "booking-1" },
      });
    });

    it("should delete CANCELLED booking successfully", async () => {
      const cancelledBooking = {
        id: "booking-1",
        userId: "user-1",
        status: "CANCELLED",
      };

      vi.spyOn(db.booking, "findUnique").mockResolvedValue(
        cancelledBooking as any,
      );
      vi.spyOn(db.booking, "delete").mockResolvedValue(cancelledBooking as any);

      await bookingService.delete("booking-1");

      expect(db.booking.delete).toHaveBeenCalled();
    });

    // Authorization tests should be in routes layer tests, not service tests

    it("should throw ValidationError for CONFIRMED booking", async () => {
      const confirmedBooking = {
        id: "booking-1",
        userId: "user-1",
        status: "CONFIRMED",
      };

      vi.spyOn(db.booking, "findUnique").mockResolvedValue(
        confirmedBooking as any,
      );

      await expect(bookingService.delete("booking-1")).rejects.toThrow(
        ValidationError,
      );
      await expect(bookingService.delete("booking-1")).rejects.toThrow(
        "Only PENDING or CANCELLED bookings can be deleted",
      );
    });

    it("should throw ValidationError for IN_PROGRESS booking", async () => {
      const inProgressBooking = {
        id: "booking-1",
        userId: "user-1",
        status: "IN_PROGRESS",
      };

      vi.spyOn(db.booking, "findUnique").mockResolvedValue(
        inProgressBooking as any,
      );

      await expect(bookingService.delete("booking-1")).rejects.toThrow(
        ValidationError,
      );
    });

    it("should throw ValidationError for COMPLETED booking", async () => {
      const completedBooking = {
        id: "booking-1",
        userId: "user-1",
        status: "COMPLETED",
      };

      vi.spyOn(db.booking, "findUnique").mockResolvedValue(
        completedBooking as any,
      );

      await expect(bookingService.delete("booking-1")).rejects.toThrow(
        ValidationError,
      );
    });
  });
});
