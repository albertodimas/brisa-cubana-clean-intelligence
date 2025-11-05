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
import type { BookingStatus } from "@prisma/client";

let app: Hono;

// CUIDs válidos para los tests (formato: c + 24 caracteres alfanuméricos)
const TEST_SERVICE_ID = "clh5k2j3a0001mh08abc12345";
const TEST_CUSTOMER_ID = "clh5k2j3a0002mh08def67890";
const TEST_PROPERTY_ID = "clh5k2j3a0003mh08ghi11111";
const TEST_PROPERTY_ID_2 = "clh5k2j3a0004mh08jkl22222";
const TEST_BOOKING_ID = "clh5k2j3a0005mh08mno33333";

const bookingRepositoryMock = {
  findById: vi.fn(),
  findByIdWithRelations: vi.fn(),
  findManyPaginated: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  hasTimeConflict: vi.fn(),
};

const serviceRepositoryMock = {
  findById: vi.fn(),
};

const userRepositoryMock = {
  findById: vi.fn(),
  findByEmail: vi.fn(),
};

const propertyRepositoryMock = {
  findById: vi.fn(),
};

const sampleService = {
  id: TEST_SERVICE_ID,
  name: "Limpieza profunda",
  basePrice: 15000,
  durationMin: 120,
  active: true,
};

const sampleCustomer = {
  id: TEST_CUSTOMER_ID,
  email: "customer@test.com",
  fullName: "Cliente Test",
  isActive: true,
  role: "CLIENT",
};

const sampleProperty = {
  id: TEST_PROPERTY_ID,
  label: "Skyline Loft Brickell",
  city: "Miami",
  state: "FL",
  zipCode: "33131",
  type: "VACATION_RENTAL",
  ownerId: TEST_CUSTOMER_ID,
};

const sampleBooking = {
  id: TEST_BOOKING_ID,
  code: "BRISA-0001",
  scheduledAt: new Date("2025-11-15T14:00:00.000Z"),
  durationMin: 120,
  status: "CONFIRMED" as BookingStatus,
  totalAmount: 15000,
  serviceId: TEST_SERVICE_ID,
  propertyId: TEST_PROPERTY_ID,
  customerId: TEST_CUSTOMER_ID,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

const makeToken = (email: string, role: string = "ADMIN") =>
  jwt.sign(
    {
      sub: email,
      role,
    },
    process.env.JWT_SECRET ?? "test-secret",
    {
      expiresIn: "1h",
    },
  );

let getBookingRepositorySpy: ReturnType<typeof vi.spyOn>;
let getServiceRepositorySpy: ReturnType<typeof vi.spyOn>;
let getUserRepositorySpy: ReturnType<typeof vi.spyOn>;
let getPropertyRepositorySpy: ReturnType<typeof vi.spyOn>;

describe("Bookings routes - Double booking prevention", () => {
  beforeAll(async () => {
    process.env.JWT_SECRET = "test-secret";
    process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
    process.env.DATABASE_URL_UNPOOLED =
      "postgresql://test:test@localhost:5432/test";

    vi.resetModules();
    const containerModule = await import("../../../src/container.js");
    getBookingRepositorySpy = vi
      .spyOn(containerModule, "getBookingRepository")
      .mockReturnValue(bookingRepositoryMock as any);
    getServiceRepositorySpy = vi
      .spyOn(containerModule, "getServiceRepository")
      .mockReturnValue(serviceRepositoryMock as any);
    getUserRepositorySpy = vi
      .spyOn(containerModule, "getUserRepository")
      .mockReturnValue(userRepositoryMock as any);
    getPropertyRepositorySpy = vi
      .spyOn(containerModule, "getPropertyRepository")
      .mockReturnValue(propertyRepositoryMock as any);

    app = (await import("../../../src/app.js")).default;
  });

  afterAll(() => {
    getBookingRepositorySpy.mockRestore();
    getServiceRepositorySpy.mockRestore();
    getUserRepositorySpy.mockRestore();
    getPropertyRepositorySpy.mockRestore();
    delete process.env.JWT_SECRET;
    delete process.env.DATABASE_URL;
    delete process.env.DATABASE_URL_UNPOOLED;
  });

  beforeEach(() => {
    bookingRepositoryMock.findById.mockReset();
    bookingRepositoryMock.findByIdWithRelations.mockReset();
    bookingRepositoryMock.findManyPaginated.mockReset();
    bookingRepositoryMock.create.mockReset();
    bookingRepositoryMock.update.mockReset();
    bookingRepositoryMock.hasTimeConflict.mockReset();
    serviceRepositoryMock.findById.mockReset();
    userRepositoryMock.findById.mockReset();
    userRepositoryMock.findByEmail.mockReset();
    propertyRepositoryMock.findById.mockReset();

    // Default mocks
    serviceRepositoryMock.findById.mockResolvedValue(sampleService);
    userRepositoryMock.findById.mockResolvedValue(sampleCustomer);
    userRepositoryMock.findByEmail.mockResolvedValue({
      ...sampleCustomer,
      email: "admin@test.com",
      role: "ADMIN",
    });
    propertyRepositoryMock.findById.mockResolvedValue(sampleProperty);
    bookingRepositoryMock.hasTimeConflict.mockResolvedValue(false);
    bookingRepositoryMock.create.mockResolvedValue(sampleBooking);
    bookingRepositoryMock.findByIdWithRelations.mockResolvedValue({
      ...sampleBooking,
      service: sampleService,
      property: sampleProperty,
      customer: sampleCustomer,
    });
  });

  describe("POST /api/bookings - Create booking", () => {
    it("crea una reserva cuando no hay conflicto de horario", async () => {
      const token = makeToken("admin@test.com", "ADMIN");
      bookingRepositoryMock.hasTimeConflict.mockResolvedValue(false);

      const response = await app.request("/api/bookings", {
        method: "POST",
        headers: {
          authorization: `Bearer ${token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          customerId: TEST_CUSTOMER_ID,
          propertyId: TEST_PROPERTY_ID,
          serviceId: TEST_SERVICE_ID,
          scheduledAt: "2025-11-15T14:00:00.000Z",
          durationMin: 120,
        }),
      });

      expect(response.status).toBe(201);
      expect(bookingRepositoryMock.hasTimeConflict).toHaveBeenCalledWith(
        TEST_PROPERTY_ID,
        expect.any(Date),
        120,
      );
      expect(bookingRepositoryMock.create).toHaveBeenCalled();
    });

    it("rechaza reserva con conflicto de horario (409)", async () => {
      const token = makeToken("admin@test.com", "ADMIN");
      bookingRepositoryMock.hasTimeConflict.mockResolvedValue(true);

      const response = await app.request("/api/bookings", {
        method: "POST",
        headers: {
          authorization: `Bearer ${token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          customerId: TEST_CUSTOMER_ID,
          propertyId: TEST_PROPERTY_ID,
          serviceId: TEST_SERVICE_ID,
          scheduledAt: "2025-11-15T14:00:00.000Z",
          durationMin: 120,
        }),
      });

      expect(response.status).toBe(409);
      const json = await response.json();
      expect(json).toEqual({
        error:
          "Conflicto de horario: La propiedad ya tiene una reserva activa en ese rango de tiempo",
        code: "BOOKING_TIME_CONFLICT",
      });
      expect(bookingRepositoryMock.create).not.toHaveBeenCalled();
    });

    it("usa la duración del servicio si no se especifica", async () => {
      const token = makeToken("admin@test.com", "ADMIN");
      bookingRepositoryMock.hasTimeConflict.mockResolvedValue(false);

      await app.request("/api/bookings", {
        method: "POST",
        headers: {
          authorization: `Bearer ${token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          customerId: TEST_CUSTOMER_ID,
          propertyId: TEST_PROPERTY_ID,
          serviceId: TEST_SERVICE_ID,
          scheduledAt: "2025-11-15T14:00:00.000Z",
          // Sin durationMin
        }),
      });

      expect(bookingRepositoryMock.hasTimeConflict).toHaveBeenCalledWith(
        TEST_PROPERTY_ID,
        expect.any(Date),
        120, // Duración del servicio
      );
    });
  });

  describe("PATCH /api/bookings/:id - Update booking", () => {
    it("actualiza una reserva cuando no hay conflicto de horario", async () => {
      const token = makeToken("admin@test.com", "ADMIN");
      bookingRepositoryMock.findById.mockResolvedValue(sampleBooking);
      bookingRepositoryMock.hasTimeConflict.mockResolvedValue(false);
      bookingRepositoryMock.update.mockResolvedValue({
        ...sampleBooking,
        scheduledAt: new Date("2025-11-16T10:00:00.000Z"),
      });

      const response = await app.request(`/api/bookings/${TEST_BOOKING_ID}`, {
        method: "PATCH",
        headers: {
          authorization: `Bearer ${token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          scheduledAt: "2025-11-16T10:00:00.000Z",
        }),
      });

      expect(response.status).toBe(200);
      expect(bookingRepositoryMock.hasTimeConflict).toHaveBeenCalledWith(
        TEST_PROPERTY_ID,
        expect.any(Date),
        120,
        TEST_BOOKING_ID, // excludeBookingId
      );
    });

    it("rechaza actualización con conflicto de horario (409)", async () => {
      const token = makeToken("admin@test.com", "ADMIN");
      bookingRepositoryMock.findById.mockResolvedValue(sampleBooking);
      bookingRepositoryMock.hasTimeConflict.mockResolvedValue(true);

      const response = await app.request(`/api/bookings/${TEST_BOOKING_ID}`, {
        method: "PATCH",
        headers: {
          authorization: `Bearer ${token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          scheduledAt: "2025-11-16T10:00:00.000Z",
        }),
      });

      expect(response.status).toBe(409);
      const json = await response.json();
      expect(json).toEqual({
        error:
          "Conflicto de horario: La propiedad ya tiene una reserva activa en ese rango de tiempo",
        code: "BOOKING_TIME_CONFLICT",
      });
      expect(bookingRepositoryMock.update).not.toHaveBeenCalled();
    });

    it("valida conflicto al cambiar propiedad", async () => {
      const token = makeToken("admin@test.com", "ADMIN");
      bookingRepositoryMock.findById.mockResolvedValue(sampleBooking);
      bookingRepositoryMock.hasTimeConflict.mockResolvedValue(false);

      await app.request(`/api/bookings/${TEST_BOOKING_ID}`, {
        method: "PATCH",
        headers: {
          authorization: `Bearer ${token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          propertyId: TEST_PROPERTY_ID_2,
        }),
      });

      expect(bookingRepositoryMock.hasTimeConflict).toHaveBeenCalledWith(
        TEST_PROPERTY_ID_2, // Nueva propiedad
        expect.any(Date),
        120,
        TEST_BOOKING_ID,
      );
    });

    it("valida conflicto al cambiar duración", async () => {
      const token = makeToken("admin@test.com", "ADMIN");
      bookingRepositoryMock.findById.mockResolvedValue(sampleBooking);
      bookingRepositoryMock.hasTimeConflict.mockResolvedValue(false);

      await app.request(`/api/bookings/${TEST_BOOKING_ID}`, {
        method: "PATCH",
        headers: {
          authorization: `Bearer ${token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          durationMin: 180,
        }),
      });

      expect(bookingRepositoryMock.hasTimeConflict).toHaveBeenCalledWith(
        TEST_PROPERTY_ID,
        expect.any(Date),
        180, // Nueva duración
        TEST_BOOKING_ID,
      );
    });

    it("no valida conflicto si solo cambia el status", async () => {
      const token = makeToken("admin@test.com", "ADMIN");
      bookingRepositoryMock.update.mockResolvedValue({
        ...sampleBooking,
        status: "COMPLETED",
      });
      bookingRepositoryMock.findByIdWithRelations.mockResolvedValue({
        ...sampleBooking,
        status: "COMPLETED",
      });

      await app.request(`/api/bookings/${TEST_BOOKING_ID}`, {
        method: "PATCH",
        headers: {
          authorization: `Bearer ${token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          status: "COMPLETED",
        }),
      });

      expect(bookingRepositoryMock.hasTimeConflict).not.toHaveBeenCalled();
      expect(bookingRepositoryMock.update).toHaveBeenCalled();
    });
  });
});
