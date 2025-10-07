import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Hono } from "hono";
import bookings from "../bookings";
import jwt from "jsonwebtoken";
import { db } from "../../lib/db";
import { ForbiddenError } from "../../lib/errors";

// Mock de db
vi.mock("../../lib/db", () => ({
  db: {
    booking: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
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

// Mock de servicios
vi.mock("../../services/booking.service", () => ({
  bookingService: {
    getById: vi.fn(),
    getAll: vi.fn(),
    getUserBookings: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("../../services/notifications", () => ({
  sendBookingConfirmation: vi.fn(),
  sendStatusUpdate: vi.fn(),
  sendCompletionNotification: vi.fn(),
}));

vi.mock("../../lib/stripe", () => ({
  getStripe: vi.fn(),
  stripeEnabled: vi.fn(() => false),
}));

// Mock de logger
vi.mock("../../lib/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

const JWT_SECRET = "test-secret";

// Mock token module to use our test secret
vi.mock("../../lib/token", async () => {
  const actual =
    await vi.importActual<typeof import("../../lib/token")>("../../lib/token");
  return {
    ...actual,
    verifyAccessToken: (token: string) => {
      try {
        return jwt.verify(token, JWT_SECRET) as any;
      } catch (error) {
        console.warn("Invalid access token", error);
        return null;
      }
    },
  };
});

import { bookingService } from "../../services/booking.service";

describe("Bookings Routes - Authorization Tests", () => {
  let app: Hono;

  // Helper para generar tokens JWT
  function generateToken(payload: {
    sub: string;
    email: string;
    role: "CLIENT" | "STAFF" | "ADMIN";
  }): string {
    return jwt.sign(
      {
        sub: payload.sub,
        email: payload.email,
        role: payload.role,
      },
      JWT_SECRET,
      { expiresIn: "1h" },
    );
  }

  beforeEach(() => {
    app = new Hono();

    // Add error handler
    app.onError((err: any, c) => {
      if (err.statusCode) {
        return c.json(
          {
            message: err.message,
            code: err.code,
            details: err.details,
          },
          err.statusCode as any,
        );
      }
      return c.json({ message: "Internal Server Error" }, 500);
    });

    app.route("/bookings", bookings);
    vi.clearAllMocks();

    // Set JWT secret for tests
    process.env.JWT_SECRET = JWT_SECRET;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("GET /bookings/:id - Authorization", () => {
    const mockBooking = {
      id: "booking-1",
      userId: "user-1",
      propertyId: "property-1",
      serviceId: "service-1",
      scheduledAt: new Date("2025-10-10T10:00:00Z"),
      status: "CONFIRMED",
      totalPrice: 150,
      user: { id: "user-1", email: "user1@test.com", name: "User 1" },
      property: {
        id: "property-1",
        name: "Test Property",
        address: "123 Main",
      },
      service: { id: "service-1", name: "Deep Clean", basePrice: 150 },
    };

    it("should allow user to view their own booking", async () => {
      vi.mocked(bookingService.getById).mockResolvedValue(mockBooking as any);

      const token = generateToken({
        sub: "user-1",
        email: "user1@test.com",
        role: "CLIENT",
      });

      const response = await app.request("/bookings/booking-1", {
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.id).toBe("booking-1");
    });

    it("should reject user viewing another user's booking", async () => {
      vi.mocked(bookingService.getById).mockResolvedValue(mockBooking as any);

      const token = generateToken({
        sub: "user-2", // Diferente userId
        email: "user2@test.com",
        role: "CLIENT",
      });

      const response = await app.request("/bookings/booking-1", {
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.message).toContain("only view your own bookings");
    });

    it("should allow ADMIN to view any booking", async () => {
      vi.mocked(bookingService.getById).mockResolvedValue(mockBooking as any);

      const token = generateToken({
        sub: "admin-1",
        email: "admin@test.com",
        role: "ADMIN",
      });

      const response = await app.request("/bookings/booking-1", {
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.id).toBe("booking-1");
    });

    it("should allow STAFF to view any booking", async () => {
      vi.mocked(bookingService.getById).mockResolvedValue(mockBooking as any);

      const token = generateToken({
        sub: "staff-1",
        email: "staff@test.com",
        role: "STAFF",
      });

      const response = await app.request("/bookings/booking-1", {
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.id).toBe("booking-1");
    });

    it("should reject unauthenticated requests", async () => {
      const response = await app.request("/bookings/booking-1");

      expect(response.status).toBe(401);
    });
  });

  describe("GET /bookings - Authorization", () => {
    it("should allow ADMIN to list all bookings", async () => {
      vi.mocked(bookingService.getAll).mockResolvedValue({
        data: [],
        meta: { page: 1, limit: 10, total: 0, totalPages: 0 },
      });

      const token = generateToken({
        sub: "admin-1",
        email: "admin@test.com",
        role: "ADMIN",
      });

      const response = await app.request("/bookings?page=1&limit=10", {
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(response.status).toBe(200);
    });

    it("should allow STAFF to list all bookings", async () => {
      vi.mocked(bookingService.getAll).mockResolvedValue({
        data: [],
        meta: { page: 1, limit: 10, total: 0, totalPages: 0 },
      });

      const token = generateToken({
        sub: "staff-1",
        email: "staff@test.com",
        role: "STAFF",
      });

      const response = await app.request("/bookings?page=1&limit=10", {
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(response.status).toBe(200);
    });

    it("should reject CLIENT from listing all bookings", async () => {
      const token = generateToken({
        sub: "user-1",
        email: "user@test.com",
        role: "CLIENT",
      });

      const response = await app.request("/bookings?page=1&limit=10", {
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toContain("Forbidden");
    });
  });

  describe("GET /bookings/mine - Authorization", () => {
    it("should allow authenticated user to view their own bookings", async () => {
      vi.mocked(bookingService.getUserBookings).mockResolvedValue([]);

      const token = generateToken({
        sub: "user-1",
        email: "user@test.com",
        role: "CLIENT",
      });

      const response = await app.request("/bookings/mine", {
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(response.status).toBe(200);
      expect(bookingService.getUserBookings).toHaveBeenCalledWith("user-1");
    });

    it("should reject unauthenticated requests", async () => {
      const response = await app.request("/bookings/mine");

      expect(response.status).toBe(401);
    });
  });

  describe("PATCH /bookings/:id - Authorization", () => {
    const mockBooking = {
      id: "booking-1",
      userId: "user-1",
      propertyId: "property-1",
      serviceId: "service-1",
      scheduledAt: new Date("2025-10-10T10:00:00Z"),
      status: "CONFIRMED",
      totalPrice: 150,
      user: {
        id: "user-1",
        email: "user1@test.com",
        name: "User 1",
        phone: null,
      },
      property: {
        id: "property-1",
        name: "Test Property",
        address: "123 Main",
      },
      service: { id: "service-1", name: "Deep Clean", basePrice: 150 },
    };

    it("should allow ADMIN to update booking", async () => {
      vi.mocked(db.booking.update).mockResolvedValue(mockBooking as any);

      const token = generateToken({
        sub: "admin-1",
        email: "admin@test.com",
        role: "ADMIN",
      });

      const response = await app.request("/bookings/booking-1", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "COMPLETED" }),
      });

      expect(response.status).toBe(200);
    });

    it("should allow STAFF to update booking", async () => {
      vi.mocked(db.booking.update).mockResolvedValue(mockBooking as any);

      const token = generateToken({
        sub: "staff-1",
        email: "staff@test.com",
        role: "STAFF",
      });

      const response = await app.request("/bookings/booking-1", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "COMPLETED" }),
      });

      expect(response.status).toBe(200);
    });

    it("should reject CLIENT from updating booking", async () => {
      const token = generateToken({
        sub: "user-1",
        email: "user@test.com",
        role: "CLIENT",
      });

      vi.mocked(bookingService.update).mockImplementation(() => {
        throw new ForbiddenError("Clients cannot update bookings");
      });

      const response = await app.request("/bookings/booking-1", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "COMPLETED" }),
      });

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.message).toContain("Clients cannot update bookings");
    });
  });

  describe("DELETE /bookings/:id - Authorization", () => {
    const mockBooking = {
      id: "booking-1",
      userId: "user-1",
      status: "CANCELLED",
    };

    it("should allow ADMIN to cancel booking", async () => {
      vi.mocked(db.booking.update).mockResolvedValue(mockBooking as any);

      const token = generateToken({
        sub: "admin-1",
        email: "admin@test.com",
        role: "ADMIN",
      });

      const response = await app.request("/bookings/booking-1", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(response.status).toBe(200);
    });

    it("should allow STAFF to cancel booking", async () => {
      vi.mocked(db.booking.update).mockResolvedValue(mockBooking as any);

      const token = generateToken({
        sub: "staff-1",
        email: "staff@test.com",
        role: "STAFF",
      });

      const response = await app.request("/bookings/booking-1", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(response.status).toBe(200);
    });

    it("should reject CLIENT from canceling booking", async () => {
      const token = generateToken({
        sub: "user-1",
        email: "user@test.com",
        role: "CLIENT",
      });

      const response = await app.request("/bookings/booking-1", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.message).toContain("Clients cannot cancel bookings");
    });
  });
});
