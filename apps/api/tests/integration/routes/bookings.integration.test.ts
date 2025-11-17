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
const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_SCHEDULED_AT = new Date(Date.now() + 7 * DAY_MS);
const DEFAULT_SCHEDULED_AT_ISO = DEFAULT_SCHEDULED_AT.toISOString();
const UPDATED_SCHEDULED_AT_ISO = new Date(
  DEFAULT_SCHEDULED_AT.getTime() + DAY_MS,
).toISOString();

const TEST_TENANT_ID = "tenant_test";
const TEST_TENANT_SLUG = "tenant-test";
const TEST_TENANT_NAME = "Tenant Test";

const bookingRepositoryMock = {
  findById: vi.fn(),
  findByIdWithRelations: vi.fn(),
  findManyPaginated: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  hasTimeConflict: vi.fn(),
};

const bookingSummaryRepositoryMock = {
  findByBookingId: vi.fn(),
  upsert: vi.fn(),
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
  tenantId: TEST_TENANT_ID,
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
  tenantId: TEST_TENANT_ID,
};

const sampleBooking = {
  id: TEST_BOOKING_ID,
  code: "BRISA-0001",
  scheduledAt: DEFAULT_SCHEDULED_AT,
  durationMin: 120,
  status: "CONFIRMED" as BookingStatus,
  totalAmount: 15000,
  serviceId: TEST_SERVICE_ID,
  propertyId: TEST_PROPERTY_ID,
  customerId: TEST_CUSTOMER_ID,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  tenantId: TEST_TENANT_ID,
};

const makeToken = (email: string, role: string = "ADMIN") =>
  jwt.sign(
    {
      sub: email,
      email,
      role,
      tenantId: TEST_TENANT_ID,
      tenantSlug: TEST_TENANT_SLUG,
      tenantName: TEST_TENANT_NAME,
      sessionId: "test-session",
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
let getBookingSummaryRepositorySpy: ReturnType<typeof vi.spyOn>;

describe("Bookings routes - Double booking prevention", () => {
  beforeAll(async () => {
    process.env.JWT_SECRET = "test-secret";
    process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
    process.env.DATABASE_URL_UNPOOLED =
      "postgresql://test:test@localhost:5432/test";
    process.env.DEFAULT_TENANT_ID = TEST_TENANT_ID;
    process.env.DEFAULT_TENANT_SLUG = TEST_TENANT_SLUG;

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
    getBookingSummaryRepositorySpy = vi
      .spyOn(containerModule, "getBookingSummaryRepository")
      .mockReturnValue(bookingSummaryRepositoryMock as any);

    app = (await import("../../../src/app.js")).default;
  });

  afterAll(() => {
    getBookingRepositorySpy.mockRestore();
    getServiceRepositorySpy.mockRestore();
    getUserRepositorySpy.mockRestore();
    getPropertyRepositorySpy.mockRestore();
    getBookingSummaryRepositorySpy.mockRestore();
    delete process.env.JWT_SECRET;
    delete process.env.DATABASE_URL;
    delete process.env.DATABASE_URL_UNPOOLED;
    delete process.env.DEFAULT_TENANT_ID;
    delete process.env.DEFAULT_TENANT_SLUG;
  });

  beforeEach(() => {
    bookingRepositoryMock.findById.mockReset();
    bookingRepositoryMock.findByIdWithRelations.mockReset();
    bookingRepositoryMock.findManyPaginated.mockReset();
    bookingRepositoryMock.create.mockReset();
    bookingRepositoryMock.update.mockReset();
    bookingRepositoryMock.hasTimeConflict.mockReset();
    bookingSummaryRepositoryMock.findByBookingId.mockReset();
    bookingSummaryRepositoryMock.upsert.mockReset();
    serviceRepositoryMock.findById.mockReset();
    userRepositoryMock.findById.mockReset();
    userRepositoryMock.findByEmail.mockReset();
    propertyRepositoryMock.findById.mockReset();

    // Default mocks
    serviceRepositoryMock.findById.mockResolvedValue(sampleService);
    const tenantMembership = [
      {
        tenantId: TEST_TENANT_ID,
        tenantSlug: TEST_TENANT_SLUG,
        tenantName: TEST_TENANT_NAME,
        status: "ACTIVE",
        role: "ADMIN",
      },
    ];
    userRepositoryMock.findById.mockResolvedValue({
      ...sampleCustomer,
      tenants: tenantMembership,
    });
    userRepositoryMock.findByEmail.mockResolvedValue({
      ...sampleCustomer,
      email: "admin@test.com",
      role: "ADMIN",
      tenants: tenantMembership,
    });
    propertyRepositoryMock.findById.mockResolvedValue(sampleProperty);
    bookingRepositoryMock.hasTimeConflict.mockResolvedValue(false);
    bookingRepositoryMock.create.mockResolvedValue(sampleBooking);
    bookingRepositoryMock.findByIdWithRelations.mockResolvedValue({
      ...sampleBooking,
      tenantId: "tenant_test",
      property: sampleProperty,
      service: sampleService,
      customer: sampleCustomer,
    });
    bookingSummaryRepositoryMock.findByBookingId.mockResolvedValue(null);
    bookingSummaryRepositoryMock.upsert.mockResolvedValue({
      id: "sum_1",
      bookingId: TEST_BOOKING_ID,
      tenantId: "tenant_test",
      summary: "Servicio generado de prueba",
      model: "brisa-template-v1",
      tokens: 42,
      createdAt: new Date(),
    });
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
          scheduledAt: DEFAULT_SCHEDULED_AT_ISO,
          durationMin: 120,
        }),
      });

      expect(response.status).toBe(201);
      expect(bookingRepositoryMock.hasTimeConflict).toHaveBeenCalledWith(
        TEST_PROPERTY_ID,
        expect.any(Date),
        120,
        undefined,
        TEST_TENANT_ID,
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
          scheduledAt: DEFAULT_SCHEDULED_AT_ISO,
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
          scheduledAt: DEFAULT_SCHEDULED_AT_ISO,
          // Sin durationMin
        }),
      });

      expect(bookingRepositoryMock.hasTimeConflict).toHaveBeenCalledWith(
        TEST_PROPERTY_ID,
        expect.any(Date),
        120, // Duración del servicio
        undefined,
        TEST_TENANT_ID,
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
        scheduledAt: new Date(UPDATED_SCHEDULED_AT_ISO),
      });

      const response = await app.request(`/api/bookings/${TEST_BOOKING_ID}`, {
        method: "PATCH",
        headers: {
          authorization: `Bearer ${token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          scheduledAt: UPDATED_SCHEDULED_AT_ISO,
        }),
      });

      expect(response.status).toBe(200);
      expect(bookingRepositoryMock.hasTimeConflict).toHaveBeenCalledWith(
        TEST_PROPERTY_ID,
        expect.any(Date),
        120,
        TEST_BOOKING_ID, // excludeBookingId
        TEST_TENANT_ID,
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
          scheduledAt: UPDATED_SCHEDULED_AT_ISO,
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
        TEST_TENANT_ID,
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
        TEST_TENANT_ID,
      );
    });

    it("no valida conflicto si solo cambia el status", async () => {
      const token = makeToken("admin@test.com", "ADMIN");
      bookingRepositoryMock.update.mockResolvedValue({
        ...sampleBooking,
        status: "COMPLETED",
      });
      bookingRepositoryMock.findById.mockResolvedValue({
        ...sampleBooking,
        status: "CONFIRMED",
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

  describe("Booking summaries", () => {
    it("genera un resumen cuando no existe", async () => {
      const token = makeToken("admin@test.com", "ADMIN");
      bookingSummaryRepositoryMock.findByBookingId.mockResolvedValue(null);

      const response = await app.request(
        `/api/bookings/${TEST_BOOKING_ID}/summary`,
        {
          method: "POST",
          headers: {
            authorization: `Bearer ${token}`,
            "content-type": "application/json",
          },
          body: JSON.stringify({}),
        },
      );

      expect(response.status).toBe(200);
      expect(bookingSummaryRepositoryMock.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          bookingId: TEST_BOOKING_ID,
          model: "brisa-template-v1",
          tenantId: TEST_TENANT_ID,
        }),
      );
      const payload = await response.json();
      expect(payload.data.summary).toContain("Servicio");
    });

    it("obtiene un resumen existente", async () => {
      const token = makeToken("admin@test.com", "ADMIN");
      bookingSummaryRepositoryMock.findByBookingId.mockResolvedValue({
        id: "sum_existing",
        bookingId: TEST_BOOKING_ID,
        tenantId: "tenant_test",
        summary: "Resumen guardado",
        model: "brisa-template-v1",
        tokens: 10,
        createdAt: new Date(),
      });

      const response = await app.request(
        `/api/bookings/${TEST_BOOKING_ID}/summary`,
        {
          method: "GET",
          headers: {
            authorization: `Bearer ${token}`,
          },
        },
      );

      expect(response.status).toBe(200);
      const payload = await response.json();
      expect(payload.data.summary).toBe("Resumen guardado");
    });
  });
});
