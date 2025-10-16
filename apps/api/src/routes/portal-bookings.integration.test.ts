import {
  describe,
  beforeAll,
  afterAll,
  beforeEach,
  it,
  expect,
  vi,
} from "vitest";
import type { Hono } from "hono";
import jwt from "jsonwebtoken";

let app: Hono;

const bookingRepositoryMock = {
  findManyPaginated: vi.fn(),
};

const userRepositoryMock = {
  findByEmail: vi.fn(),
};

const sampleBooking = {
  id: "booking-1",
  code: "BRISA-0001",
  scheduledAt: new Date("2025-10-20T14:00:00.000Z"),
  durationMin: 120,
  status: "CONFIRMED",
  totalAmount: 15000,
  service: {
    id: "srv-1",
    name: "Limpieza profunda",
    basePrice: 15000,
  },
  property: {
    id: "prop-1",
    label: "Brickell Loft",
    city: "Miami",
  },
  customerId: "user-1",
};

const makeToken = (email: string) =>
  jwt.sign(
    {
      sub: email,
      scope: "portal-client",
      aud: "portal-client",
      iss: "brisa-cubana",
    },
    process.env.JWT_SECRET ?? "test-secret",
    {
      expiresIn: "1h",
    },
  );

let getBookingRepositorySpy: ReturnType<typeof vi.spyOn>;
let getUserRepositorySpy: ReturnType<typeof vi.spyOn>;

describe("Portal bookings routes", () => {
  beforeAll(async () => {
    process.env.JWT_SECRET = "test-secret";
    process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
    process.env.DATABASE_URL_UNPOOLED =
      "postgresql://test:test@localhost:5432/test";

    vi.resetModules();
    const containerModule = await import("../container.js");
    getBookingRepositorySpy = vi
      .spyOn(containerModule, "getBookingRepository")
      .mockReturnValue(bookingRepositoryMock as any);
    getUserRepositorySpy = vi
      .spyOn(containerModule, "getUserRepository")
      .mockReturnValue(userRepositoryMock as any);

    app = (await import("../app.js")).default;
  });

  afterAll(() => {
    getBookingRepositorySpy.mockRestore();
    getUserRepositorySpy.mockRestore();
    delete process.env.JWT_SECRET;
    delete process.env.DATABASE_URL;
    delete process.env.DATABASE_URL_UNPOOLED;
  });

  beforeEach(() => {
    bookingRepositoryMock.findManyPaginated.mockReset();
    userRepositoryMock.findByEmail.mockReset();

    userRepositoryMock.findByEmail.mockResolvedValue({
      id: "user-1",
      email: "client@portal.test",
      fullName: "Cliente Portal",
      isActive: true,
      role: "CLIENT",
    });

    bookingRepositoryMock.findManyPaginated.mockResolvedValue({
      data: [sampleBooking],
      nextCursor: null,
      hasMore: false,
    });
  });

  it("retorna reservas filtradas por el portal token", async () => {
    const token = makeToken("client@portal.test");

    const response = await app.request("/api/portal/bookings", {
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    expect(response.status).toBe(200);
    const json = (await response.json()) as {
      data: Array<{ id: string }>;
      customer: { id: string; email: string };
      pagination?: { hasMore: boolean };
    };

    expect(userRepositoryMock.findByEmail).toHaveBeenCalledWith(
      "client@portal.test",
    );
    expect(bookingRepositoryMock.findManyPaginated).toHaveBeenCalledWith(
      20,
      undefined,
      { customerId: "user-1" },
      true,
      {
        orderBy: [{ scheduledAt: "asc" }, { id: "asc" }],
      },
    );

    expect(json.data).toHaveLength(1);
    expect(json.customer.id).toBe("user-1");
    expect(json.pagination?.hasMore).toBe(false);
  });

  it("rechaza tokens sin scope portal", async () => {
    const token = jwt.sign(
      { sub: "client@portal.test", scope: "unknown" },
      process.env.JWT_SECRET ?? "test-secret",
    );

    const response = await app.request("/api/portal/bookings", {
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    expect(response.status).toBe(401);
  });

  it("permite cerrar sesión con token portal válido", async () => {
    const token = makeToken("client@portal.test");

    const response = await app.request("/api/portal/auth/logout", {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ success: true });
  });

  it("retorna 401 al cerrar sesión sin token", async () => {
    const response = await app.request("/api/portal/auth/logout", {
      method: "POST",
    });

    expect(response.status).toBe(401);
  });
});
