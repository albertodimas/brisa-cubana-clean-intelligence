import { describe, expect, it, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import type { Context } from "hono";
import { generateAccessToken } from "../lib/token";
import { isAppError } from "../lib/errors";

const bookingMock = {
  findMany: vi.fn(),
  count: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
};

const serviceMock = {
  findUnique: vi.fn(),
};

const userMock = {
  findUnique: vi.fn(),
};

const propertyMock = {
  findUnique: vi.fn(),
};

vi.mock("../lib/db", () => ({
  db: {
    booking: bookingMock,
    service: serviceMock,
    user: userMock,
    property: propertyMock,
  },
}));

process.env.JWT_SECRET = "test-secret";

const { default: bookings } = await import("./bookings");

const buildApp = () => {
  const app = new Hono();
  app.route("/api/bookings", bookings);

  // Add error handler to match production app behavior
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

describe("bookings route validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    serviceMock.findUnique.mockResolvedValue({
      id: "service-1",
      name: "Test service",
      description: "Desc",
      basePrice: 150,
    });
    userMock.findUnique.mockResolvedValue({
      id: "user-1",
      email: "user-1@example.com",
      name: "User 1",
    });
    propertyMock.findUnique.mockResolvedValue({
      id: "property-1",
      name: "Property 1",
      address: "123 Street",
      userId: "user-1",
    });
  });

  it("rejects invalid pagination parameters", async () => {
    const app = buildApp();
    const response = await app.request("/api/bookings?page=abc", {
      headers: authHeader("ADMIN", "admin-1"),
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      error: "Invalid pagination parameters",
    });
    expect(bookingMock.findMany).not.toHaveBeenCalled();
  });

  it("rejects malformed booking payloads", async () => {
    const app = buildApp();
    const response = await app.request("/api/bookings", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...authHeader("CLIENT", "user-1"),
      },
      body: JSON.stringify({}),
    });

    expect(response.status).toBe(422);
    expect(await response.json()).toMatchObject({
      error: "Invalid booking payload",
      code: "VALIDATION_ERROR",
    });
    expect(bookingMock.create).not.toHaveBeenCalled();
  });

  it("uses service basePrice when totalPrice is zero/undefined", async () => {
    const app = buildApp();

    // Mock service lookup
    serviceMock.findUnique.mockResolvedValue({
      id: "service-1",
      name: "Test service",
      description: "Desc",
      basePrice: 150,
      duration: 120, // 2 hours
      active: true,
    });

    // Mock user lookup
    userMock.findUnique.mockResolvedValue({
      id: "user-1",
      email: "user-1@example.com",
      name: "User 1",
    });

    // Mock property lookup
    propertyMock.findUnique.mockResolvedValue({
      id: "property-1",
      name: "Property 1",
      address: "123 Street",
      userId: "user-1",
    });

    // Mock no conflicting bookings
    bookingMock.findMany.mockResolvedValue([]);

    // Mock successful booking creation
    bookingMock.create.mockResolvedValueOnce({
      id: "booking-1",
      status: "PENDING",
      userId: "user-1",
      propertyId: "property-1",
      serviceId: "service-1",
      totalPrice: 150,
      scheduledAt: new Date().toISOString(),
      user: { id: "user-1", email: "user-1@example.com", name: "User 1" },
      property: { id: "property-1", name: "Property 1", address: "123 Street" },
      service: {
        id: "service-1",
        name: "Test service",
        description: "Desc",
        basePrice: 150,
      },
    });

    // Use a valid future date (3 hours from now)
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
        // Don't provide totalPrice - should use service basePrice (150)
      }),
    });

    expect(response.status).toBe(201);
    expect(bookingMock.create).toHaveBeenCalled();
    const firstCall = bookingMock.create.mock.calls[0]?.[0] as unknown;
    const payload = (
      firstCall as { data?: { totalPrice?: number; userId?: string } }
    ).data;
    // Should use service basePrice of 150
    expect(payload?.totalPrice).toBe(150);
    expect(payload?.userId).toBe("user-1");

    const json = (await response.json()) as {
      booking: { id: string };
      checkoutUrl?: string | null;
    };
    expect(json.booking.id).toBe("booking-1");
    expect(json.checkoutUrl).toBeNull();
  });

  it("rejects booking updates without payload", async () => {
    const app = buildApp();

    const response = await app.request("/api/bookings/booking-1", {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
        ...authHeader("STAFF", "staff-1"),
      },
      body: JSON.stringify({}),
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      error: "Invalid booking update payload",
    });
    expect(bookingMock.update).not.toHaveBeenCalled();
  });
});
