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
import { NotificationType } from "@prisma/client";

let app: Hono;

const bookingRepositoryMock = {
  findManyPaginated: vi.fn(),
  findByIdWithRelations: vi.fn(),
  update: vi.fn(),
};

const userRepositoryMock = {
  findByEmail: vi.fn(),
  findActiveByRoles: vi.fn(),
};

const notificationRepositoryMock = {
  createNotification: vi.fn(),
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
let getNotificationRepositorySpy: ReturnType<typeof vi.spyOn>;

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
    getNotificationRepositorySpy = vi
      .spyOn(containerModule, "getNotificationRepository")
      .mockReturnValue(notificationRepositoryMock as any);

    app = (await import("../app.js")).default;
  });

  afterAll(() => {
    getBookingRepositorySpy.mockRestore();
    getUserRepositorySpy.mockRestore();
    getNotificationRepositorySpy.mockRestore();
    delete process.env.JWT_SECRET;
    delete process.env.DATABASE_URL;
    delete process.env.DATABASE_URL_UNPOOLED;
  });

  beforeEach(() => {
    bookingRepositoryMock.findManyPaginated.mockReset();
    bookingRepositoryMock.findByIdWithRelations.mockReset();
    bookingRepositoryMock.update.mockReset();
    userRepositoryMock.findByEmail.mockReset();
    userRepositoryMock.findActiveByRoles.mockReset();
    notificationRepositoryMock.createNotification.mockReset();

    userRepositoryMock.findByEmail.mockResolvedValue({
      id: "user-1",
      email: "client@portal.test",
      fullName: "Cliente Portal",
      isActive: true,
      role: "CLIENT",
    });
    userRepositoryMock.findActiveByRoles.mockResolvedValue([]);
    notificationRepositoryMock.createNotification.mockImplementation(
      async (input) => ({
        id: `notif-${Math.random().toString(36).slice(2, 8)}`,
        userId: input.userId,
        type: input.type,
        message: input.message,
        createdAt: new Date(),
        readAt: null,
      }),
    );

    bookingRepositoryMock.findManyPaginated.mockResolvedValue({
      data: [sampleBooking],
      nextCursor: null,
      hasMore: false,
    });
    bookingRepositoryMock.findByIdWithRelations.mockResolvedValue(
      sampleBooking,
    );
    bookingRepositoryMock.update.mockResolvedValue(sampleBooking);
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
  it("cancela una reserva del cliente autenticado", async () => {
    const token = makeToken("client@portal.test");
    userRepositoryMock.findActiveByRoles.mockResolvedValue([
      {
        id: "ops-1",
        email: "ops@portal.test",
        fullName: "Ops One",
        role: "COORDINATOR",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const response = await app.request(
      "/api/portal/bookings/booking-1/cancel",
      {
        method: "POST",
        headers: {
          authorization: `Bearer ${token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({ reason: "Necesito reagendar" }),
      },
    );

    expect(response.status).toBe(200);
    expect(bookingRepositoryMock.findByIdWithRelations).toHaveBeenCalledWith(
      "booking-1",
    );
    expect(bookingRepositoryMock.update).toHaveBeenCalledWith(
      "booking-1",
      expect.objectContaining({
        status: "CANCELLED",
      }),
    );
    expect(notificationRepositoryMock.createNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "ops-1",
        type: NotificationType.BOOKING_CANCELLED,
      }),
    );
  });

  it("rechaza cancelaciones para reservas que no pertenecen al cliente", async () => {
    bookingRepositoryMock.findByIdWithRelations.mockResolvedValueOnce({
      ...sampleBooking,
      customerId: "other-user",
    });

    const token = makeToken("client@portal.test");
    const response = await app.request(
      "/api/portal/bookings/booking-1/cancel",
      {
        method: "POST",
        headers: {
          authorization: `Bearer ${token}`,
        },
      },
    );

    expect(response.status).toBe(404);
  });

  it("permite reagendar una reserva futura del cliente", async () => {
    const token = makeToken("client@portal.test");
    const newDate = new Date(Date.now() + 86_400_000).toISOString();
    userRepositoryMock.findActiveByRoles.mockResolvedValue([
      {
        id: "ops-1",
        email: "ops@portal.test",
        fullName: "Ops One",
        role: "COORDINATOR",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const response = await app.request(
      "/api/portal/bookings/booking-1/reschedule",
      {
        method: "POST",
        headers: {
          authorization: `Bearer ${token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          scheduledAt: newDate,
          notes: "Prefiero martes",
        }),
      },
    );

    expect(response.status).toBe(200);
    expect(bookingRepositoryMock.update).toHaveBeenCalledWith(
      "booking-1",
      expect.objectContaining({
        scheduledAt: expect.any(Date),
      }),
    );
    expect(notificationRepositoryMock.createNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "ops-1",
        type: NotificationType.BOOKING_RESCHEDULED,
      }),
    );
  });
});
