import { describe, expect, it, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import { generateAccessToken } from "../lib/token";

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

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      error: "Invalid booking payload",
    });
    expect(bookingMock.create).not.toHaveBeenCalled();
  });

  it("allows totalPrice equal to zero", async () => {
    const app = buildApp();

    bookingMock.create.mockResolvedValueOnce({
      id: "booking-1",
      status: "PENDING",
      userId: "user-1",
      propertyId: "property-1",
      serviceId: "service-1",
      totalPrice: 0,
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
        scheduledAt: new Date().toISOString(),
        totalPrice: 0,
      }),
    });

    expect(response.status).toBe(201);
    expect(bookingMock.create).toHaveBeenCalled();
    const firstCall = bookingMock.create.mock.calls[0]?.[0] as unknown;
    const payload = (
      firstCall as { data?: { totalPrice?: number; userId?: string } }
    ).data;
    expect(payload?.totalPrice).toBe(0);
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
