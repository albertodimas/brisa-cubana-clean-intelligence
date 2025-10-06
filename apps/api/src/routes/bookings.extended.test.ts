import { describe, expect, it, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import type { Context } from "hono";
import { generateAccessToken } from "../lib/token";
import { isAppError } from "../lib/errors";

// Set environment FIRST
process.env.JWT_SECRET = "test-secret";

// Mock with inline functions
vi.mock("../lib/db", () => ({
  db: {
    booking: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    service: {
      findUnique: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    property: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("../services/notifications", () => ({
  sendBookingConfirmation: vi.fn(),
  sendStatusUpdate: vi.fn(),
  sendCompletionNotification: vi.fn(),
}));

vi.mock("../lib/stripe", () => ({
  stripeEnabled: vi.fn(() => false),
  getStripe: vi.fn(),
}));

// Import after mocking
const { default: bookings } = await import("./bookings");

// Get mock references for assertions
const { db } = await import("../lib/db");
const bookingMock = db.booking;
const serviceMock = db.service;
const userMock = db.user;
const propertyMock = db.property;

const buildApp = () => {
  const app = new Hono();
  app.route("/api/bookings", bookings);

  app.onError((err, c: Context) => {
    if (isAppError(err)) {
      return c.json(err.toJSON(), err.statusCode as never);
    }
    return c.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      500,
    );
  });

  return app;
};

const authHeader = (role: "ADMIN" | "STAFF" | "CLIENT", sub: string) => ({
  Authorization: `Bearer ${generateAccessToken({
    sub,
    email: `${sub}@example.com`,
    role,
  })}`,
});

describe("Bookings Extended Tests - GET Operations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET / - List all bookings", () => {
    it("should return paginated bookings for admin", async () => {
      bookingMock.findMany.mockResolvedValue([
        {
          id: "booking-1",
          userId: "user-1",
          propertyId: "property-1",
          serviceId: "service-1",
          scheduledAt: new Date(),
          status: "PENDING",
          user: { id: "user-1", name: "User 1", email: "user1@test.com" },
          property: { id: "property-1", name: "Prop 1", address: "123 St" },
          service: { id: "service-1", name: "Service 1", basePrice: 100 },
        },
      ]);
      bookingMock.count.mockResolvedValue(1);

      const app = buildApp();
      const response = await app.request("/api/bookings?page=1&limit=10", {
        headers: authHeader("ADMIN", "admin-1"),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.data).toHaveLength(1);
      expect(data.meta).toMatchObject({
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      });
    });

    it("should reject access for non-admin/staff users", async () => {
      const app = buildApp();
      const response = await app.request("/api/bookings", {
        headers: authHeader("CLIENT", "client-1"),
      });

      expect(response.status).toBe(403);
      expect(bookingMock.findMany).not.toHaveBeenCalled();
    });

    it("should use default pagination values", async () => {
      bookingMock.findMany.mockResolvedValue([]);
      bookingMock.count.mockResolvedValue(0);

      const app = buildApp();
      const response = await app.request("/api/bookings", {
        headers: authHeader("ADMIN", "admin-1"),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.meta.page).toBe(1);
      expect(data.meta.limit).toBe(10);
    });

    it("should calculate total pages correctly", async () => {
      bookingMock.findMany.mockResolvedValue([]);
      bookingMock.count.mockResolvedValue(25);

      const app = buildApp();
      const response = await app.request("/api/bookings?page=1&limit=10", {
        headers: authHeader("ADMIN", "admin-1"),
      });

      const data = await response.json();
      expect(data.meta.totalPages).toBe(3); // ceil(25/10)
    });
  });

  describe("GET /mine - User's bookings", () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it("should return user's own bookings", async () => {
      bookingMock.findMany.mockResolvedValue([
        {
          id: "booking-1",
          userId: "user-1",
          service: { id: "service-1", name: "Service 1", basePrice: 100 },
          property: { id: "property-1", name: "Prop 1", address: "123 St" },
        },
      ]);

      const app = buildApp();
      const response = await app.request("/api/bookings/mine", {
        headers: authHeader("CLIENT", "user-1"),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveLength(1);
      expect(bookingMock.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: "user-1" },
        }),
      );
    });

    it("should require authentication", async () => {
      const app = buildApp();
      const response = await app.request("/api/bookings/mine");

      expect(response.status).toBe(401);
    });

    it("should include property and service details", async () => {
      bookingMock.findMany.mockResolvedValue([]);

      const app = buildApp();
      await app.request("/api/bookings/mine", {
        headers: authHeader("CLIENT", "user-1"),
      });

      expect(bookingMock.findMany).toHaveBeenCalledWith({
        where: { userId: "user-1" },
        orderBy: { scheduledAt: "asc" },
        include: {
          service: {
            select: {
              id: true,
              name: true,
              basePrice: true,
            },
          },
          property: {
            select: {
              id: true,
              name: true,
              address: true,
            },
          },
        },
      });
    });

    it("should order by scheduled date ascending", async () => {
      bookingMock.findMany.mockResolvedValue([]);

      const app = buildApp();
      await app.request("/api/bookings/mine", {
        headers: authHeader("CLIENT", "user-1"),
      });

      expect(bookingMock.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { scheduledAt: "asc" },
        }),
      );
    });
  });

  describe("GET /:id - Get booking by ID", () => {
    it("should return booking by id for owner", async () => {
      bookingMock.findUnique.mockResolvedValue({
        id: "booking-1",
        userId: "user-1",
        status: "PENDING",
        user: { id: "user-1", name: "User 1" },
        property: { id: "property-1", name: "Prop 1" },
        service: { id: "service-1", name: "Service 1" },
      });

      const app = buildApp();
      const response = await app.request("/api/bookings/booking-1", {
        headers: authHeader("CLIENT", "user-1"),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.id).toBe("booking-1");
    });

    it("should return 404 for non-existent booking", async () => {
      bookingMock.findUnique.mockResolvedValue(null);

      const app = buildApp();
      const response = await app.request("/api/bookings/non-existent", {
        headers: authHeader("CLIENT", "user-1"),
      });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toContain("Booking");
    });

    it("should prevent non-owner client from viewing booking", async () => {
      bookingMock.findUnique.mockResolvedValue({
        id: "booking-1",
        userId: "other-user",
        status: "PENDING",
        user: { id: "other-user", name: "Other User" },
        property: { id: "property-1", name: "Prop 1" },
        service: { id: "service-1", name: "Service 1" },
      });

      const app = buildApp();
      const response = await app.request("/api/bookings/booking-1", {
        headers: authHeader("CLIENT", "user-1"),
      });

      expect(response.status).toBe(403);
    });

    it("should allow staff to view any booking", async () => {
      bookingMock.findUnique.mockResolvedValue({
        id: "booking-1",
        userId: "user-1",
        status: "PENDING",
        user: { id: "user-1", name: "User 1" },
        property: { id: "property-1", name: "Prop 1" },
        service: { id: "service-1", name: "Service 1" },
      });

      const app = buildApp();
      const response = await app.request("/api/bookings/booking-1", {
        headers: authHeader("STAFF", "staff-1"),
      });

      expect(response.status).toBe(200);
    });

    it("should allow admin to view any booking", async () => {
      bookingMock.findUnique.mockResolvedValue({
        id: "booking-1",
        userId: "user-1",
        status: "PENDING",
        user: { id: "user-1", name: "User 1" },
        property: { id: "property-1", name: "Prop 1" },
        service: { id: "service-1", name: "Service 1" },
      });

      const app = buildApp();
      const response = await app.request("/api/bookings/booking-1", {
        headers: authHeader("ADMIN", "admin-1"),
      });

      expect(response.status).toBe(200);
    });
  });
});

describe("Bookings Extended Tests - POST create booking", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    serviceMock.findUnique.mockResolvedValue({
      id: "service-1",
      name: "Test service",
      description: "Desc",
      basePrice: 150,
      duration: 120,
      active: true,
    });
    userMock.findUnique.mockResolvedValue({
      id: "user-1",
      email: "user-1@example.com",
      name: "User 1",
      phone: "+1234567890",
    });
    propertyMock.findUnique.mockResolvedValue({
      id: "property-1",
      name: "Property 1",
      address: "123 Street",
      userId: "user-1",
    });
    bookingMock.findMany.mockResolvedValue([]);
  });

  it("should reject booking for inactive service", async () => {
    serviceMock.findUnique.mockResolvedValue({
      id: "service-1",
      name: "Test service",
      basePrice: 150,
      duration: 120,
      active: false,
    });

    const app = buildApp();
    const validScheduledAt = new Date(Date.now() + 3 * 60 * 60 * 1000);

    const response = await app.request("/api/bookings", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...authHeader("CLIENT", "user-1"),
      },
      body: JSON.stringify({
        userId: "user-1",
        propertyId: "property-1",
        serviceId: "service-1",
        scheduledAt: validScheduledAt.toISOString(),
      }),
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      error: "This service is currently unavailable",
    });
  });

  it("should reject booking with scheduling conflict", async () => {
    bookingMock.findMany.mockResolvedValue([
      {
        id: "existing-booking",
        propertyId: "property-1",
        status: "CONFIRMED",
        scheduledAt: new Date(Date.now() + 3 * 60 * 60 * 1000),
      },
    ]);

    const app = buildApp();
    const conflictingTime = new Date(Date.now() + 3 * 60 * 60 * 1000);

    const response = await app.request("/api/bookings", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...authHeader("CLIENT", "user-1"),
      },
      body: JSON.stringify({
        userId: "user-1",
        propertyId: "property-1",
        serviceId: "service-1",
        scheduledAt: conflictingTime.toISOString(),
      }),
    });

    expect(response.status).toBe(409);
    const data = await response.json();
    expect(data.code).toBe("CONFLICT");
  });

  it("should reject client creating booking for another user", async () => {
    const app = buildApp();
    const validScheduledAt = new Date(Date.now() + 3 * 60 * 60 * 1000);

    const response = await app.request("/api/bookings", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...authHeader("CLIENT", "user-1"),
      },
      body: JSON.stringify({
        userId: "other-user",
        propertyId: "property-1",
        serviceId: "service-1",
        scheduledAt: validScheduledAt.toISOString(),
      }),
    });

    expect(response.status).toBe(403);
  });

  it("should reject client creating booking for another user's property", async () => {
    propertyMock.findUnique.mockResolvedValue({
      id: "property-1",
      name: "Property 1",
      address: "123 Street",
      userId: "other-user",
    });

    const app = buildApp();
    const validScheduledAt = new Date(Date.now() + 3 * 60 * 60 * 1000);

    const response = await app.request("/api/bookings", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...authHeader("CLIENT", "user-1"),
      },
      body: JSON.stringify({
        userId: "user-1",
        propertyId: "property-1",
        serviceId: "service-1",
        scheduledAt: validScheduledAt.toISOString(),
      }),
    });

    expect(response.status).toBe(403);
  });

  it("should return 404 for non-existent service", async () => {
    serviceMock.findUnique.mockResolvedValue(null);

    const app = buildApp();
    const validScheduledAt = new Date(Date.now() + 3 * 60 * 60 * 1000);

    const response = await app.request("/api/bookings", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...authHeader("CLIENT", "user-1"),
      },
      body: JSON.stringify({
        userId: "user-1",
        propertyId: "property-1",
        serviceId: "non-existent",
        scheduledAt: validScheduledAt.toISOString(),
      }),
    });

    expect(response.status).toBe(404);
  });

  it("should return 404 for non-existent user", async () => {
    userMock.findUnique.mockResolvedValue(null);

    const app = buildApp();
    const validScheduledAt = new Date(Date.now() + 3 * 60 * 60 * 1000);

    const response = await app.request("/api/bookings", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...authHeader("ADMIN", "admin-1"),
      },
      body: JSON.stringify({
        userId: "non-existent",
        propertyId: "property-1",
        serviceId: "service-1",
        scheduledAt: validScheduledAt.toISOString(),
      }),
    });

    expect(response.status).toBe(404);
  });

  it("should return 404 for non-existent property", async () => {
    propertyMock.findUnique.mockResolvedValue(null);

    const app = buildApp();
    const validScheduledAt = new Date(Date.now() + 3 * 60 * 60 * 1000);

    const response = await app.request("/api/bookings", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...authHeader("CLIENT", "user-1"),
      },
      body: JSON.stringify({
        userId: "user-1",
        propertyId: "non-existent",
        serviceId: "service-1",
        scheduledAt: validScheduledAt.toISOString(),
      }),
    });

    expect(response.status).toBe(404);
  });

  it("should create booking successfully with all required fields", async () => {
    const validScheduledAt = new Date(Date.now() + 3 * 60 * 60 * 1000);

    bookingMock.create.mockResolvedValue({
      id: "booking-1",
      userId: "user-1",
      propertyId: "property-1",
      serviceId: "service-1",
      scheduledAt: validScheduledAt,
      totalPrice: 150,
      status: "PENDING",
      user: {
        id: "user-1",
        name: "User 1",
        email: "user1@test.com",
        phone: "+1234567890",
      },
      property: { id: "property-1", name: "Prop 1", address: "123 St" },
      service: {
        id: "service-1",
        name: "Service 1",
        description: "Test",
        basePrice: 150,
      },
    });

    const app = buildApp();
    const response = await app.request("/api/bookings", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...authHeader("CLIENT", "user-1"),
      },
      body: JSON.stringify({
        userId: "user-1",
        propertyId: "property-1",
        serviceId: "service-1",
        scheduledAt: validScheduledAt.toISOString(),
      }),
    });

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.booking.id).toBe("booking-1");
  });
});

describe("Bookings Extended Tests - PATCH update booking", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should prevent clients from updating bookings", async () => {
    const app = buildApp();
    const response = await app.request("/api/bookings/booking-1", {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
        ...authHeader("CLIENT", "user-1"),
      },
      body: JSON.stringify({ status: "CONFIRMED" }),
    });

    expect(response.status).toBe(403);
  });

  it("should update booking status to CONFIRMED", async () => {
    bookingMock.update.mockResolvedValue({
      id: "booking-1",
      status: "CONFIRMED",
      scheduledAt: new Date(),
      totalPrice: 150,
      user: { id: "user-1", name: "User 1", phone: "+1234567890" },
      property: { id: "property-1", name: "Prop 1", address: "123 St" },
      service: { id: "service-1", name: "Service 1" },
    });

    const app = buildApp();
    const response = await app.request("/api/bookings/booking-1", {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
        ...authHeader("STAFF", "staff-1"),
      },
      body: JSON.stringify({ status: "CONFIRMED" }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.status).toBe("CONFIRMED");
  });

  it("should update booking status to COMPLETED and set completedAt", async () => {
    bookingMock.update.mockResolvedValue({
      id: "booking-1",
      status: "COMPLETED",
      completedAt: new Date(),
      user: { id: "user-1", name: "User 1", phone: "+1234567890" },
      property: { id: "property-1", name: "Prop 1" },
      service: { id: "service-1", name: "Service 1" },
    });

    const app = buildApp();
    const response = await app.request("/api/bookings/booking-1", {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
        ...authHeader("STAFF", "staff-1"),
      },
      body: JSON.stringify({ status: "COMPLETED" }),
    });

    expect(response.status).toBe(200);
    expect(bookingMock.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "COMPLETED",
          completedAt: expect.any(Date),
        }),
      }),
    );
  });

  it("should update booking notes", async () => {
    bookingMock.update.mockResolvedValue({
      id: "booking-1",
      notes: "Updated notes",
      user: { id: "user-1", name: "User 1", phone: null },
      property: { id: "property-1", name: "Prop 1" },
      service: { id: "service-1", name: "Service 1" },
    });

    const app = buildApp();
    const response = await app.request("/api/bookings/booking-1", {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
        ...authHeader("STAFF", "staff-1"),
      },
      body: JSON.stringify({ notes: "Updated notes" }),
    });

    expect(response.status).toBe(200);
  });

  it("should update status to IN_PROGRESS", async () => {
    bookingMock.update.mockResolvedValue({
      id: "booking-1",
      status: "IN_PROGRESS",
      user: { id: "user-1", name: "User 1", phone: "+1234567890" },
      property: { id: "property-1", name: "Prop 1" },
      service: { id: "service-1", name: "Service 1" },
    });

    const app = buildApp();
    const response = await app.request("/api/bookings/booking-1", {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
        ...authHeader("STAFF", "staff-1"),
      },
      body: JSON.stringify({ status: "IN_PROGRESS" }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.status).toBe("IN_PROGRESS");
  });

  it("should update status to CANCELLED", async () => {
    bookingMock.update.mockResolvedValue({
      id: "booking-1",
      status: "CANCELLED",
      user: { id: "user-1", name: "User 1", phone: "+1234567890" },
      property: { id: "property-1", name: "Prop 1" },
      service: { id: "service-1", name: "Service 1" },
    });

    const app = buildApp();
    const response = await app.request("/api/bookings/booking-1", {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
        ...authHeader("STAFF", "staff-1"),
      },
      body: JSON.stringify({ status: "CANCELLED" }),
    });

    expect(response.status).toBe(200);
  });

  it("should handle empty notes by setting to undefined", async () => {
    bookingMock.update.mockResolvedValue({
      id: "booking-1",
      notes: null,
      status: "PENDING",
      user: { id: "user-1", name: "User 1", phone: null },
      property: { id: "property-1", name: "Prop 1" },
      service: { id: "service-1", name: "Service 1" },
    });

    const app = buildApp();
    const response = await app.request("/api/bookings/booking-1", {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
        ...authHeader("STAFF", "staff-1"),
      },
      body: JSON.stringify({ status: "PENDING", notes: "" }),
    });

    expect(response.status).toBe(200);
  });
});

describe("Bookings Extended Tests - DELETE cancel booking", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should prevent clients from cancelling bookings", async () => {
    const app = buildApp();
    const response = await app.request("/api/bookings/booking-1", {
      method: "DELETE",
      headers: authHeader("CLIENT", "user-1"),
    });

    expect(response.status).toBe(403);
  });

  it("should allow staff to cancel booking", async () => {
    bookingMock.update.mockResolvedValue({
      id: "booking-1",
      status: "CANCELLED",
    });

    const app = buildApp();
    const response = await app.request("/api/bookings/booking-1", {
      method: "DELETE",
      headers: authHeader("STAFF", "staff-1"),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.status).toBe("CANCELLED");
  });

  it("should allow admin to cancel booking", async () => {
    bookingMock.update.mockResolvedValue({
      id: "booking-1",
      status: "CANCELLED",
    });

    const app = buildApp();
    const response = await app.request("/api/bookings/booking-1", {
      method: "DELETE",
      headers: authHeader("ADMIN", "admin-1"),
    });

    expect(response.status).toBe(200);
  });

  it("should require authentication", async () => {
    const app = buildApp();
    const response = await app.request("/api/bookings/booking-1", {
      method: "DELETE",
    });

    expect(response.status).toBe(401);
  });
});
