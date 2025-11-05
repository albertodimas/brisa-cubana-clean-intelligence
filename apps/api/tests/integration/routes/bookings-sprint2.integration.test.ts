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

// CUIDs válidos para los tests
const TEST_SERVICE_ID = "clh5k2j3a0001mh08abc12345";
const TEST_CUSTOMER_ID = "clh5k2j3a0002mh08def67890";
const TEST_PROPERTY_ID = "clh5k2j3a0003mh08ghi11111";
const TEST_BOOKING_ID = "clh5k2j3a0005mh08mno33333";
const TEST_STAFF_ID = "clh5k2j3a0006mh08staff001";

const bookingRepositoryMock = {
  findById: vi.fn(),
  findByIdWithRelations: vi.fn(),
  findManyPaginated: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  hasTimeConflict: vi.fn(),
};

const userRepositoryMock = {
  findById: vi.fn(),
  findByEmail: vi.fn(),
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

const sampleStaff = {
  id: TEST_STAFF_ID,
  email: "staff@test.com",
  fullName: "Staff Member",
  isActive: true,
  role: "STAFF",
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
  assignedStaffId: null,
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
let getUserRepositorySpy: ReturnType<typeof vi.spyOn>;

describe("Bookings routes - Sprint 2 Features", () => {
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
    getUserRepositorySpy = vi
      .spyOn(containerModule, "getUserRepository")
      .mockReturnValue(userRepositoryMock as any);

    app = (await import("../../../src/app.js")).default;
  });

  afterAll(() => {
    getBookingRepositorySpy.mockRestore();
    getUserRepositorySpy.mockRestore();
    delete process.env.JWT_SECRET;
    delete process.env.DATABASE_URL;
    delete process.env.DATABASE_URL_UNPOOLED;
  });

  beforeEach(() => {
    bookingRepositoryMock.findById.mockReset();
    bookingRepositoryMock.findByIdWithRelations.mockReset();
    bookingRepositoryMock.findManyPaginated.mockReset();
    bookingRepositoryMock.update.mockReset();
    userRepositoryMock.findById.mockReset();
    userRepositoryMock.findByEmail.mockReset();

    // Default mocks
    userRepositoryMock.findByEmail.mockResolvedValue({
      ...sampleCustomer,
      email: "admin@test.com",
      role: "ADMIN",
    });
    bookingRepositoryMock.findByIdWithRelations.mockResolvedValue({
      ...sampleBooking,
      service: sampleService,
      property: sampleProperty,
      customer: sampleCustomer,
      assignedStaff: null,
    });
  });

  describe("GET /api/bookings/:id - Get booking by ID", () => {
    it("retorna un booking por ID con todas las relaciones", async () => {
      const token = makeToken("admin@test.com", "ADMIN");

      const response = await app.request(`/api/bookings/${TEST_BOOKING_ID}`, {
        method: "GET",
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.data).toMatchObject({
        id: TEST_BOOKING_ID,
        code: "BRISA-0001",
        totalAmount: 15000,
      });
      expect(json.data.service).toBeDefined();
      expect(json.data.property).toBeDefined();
      expect(json.data.customer).toBeDefined();
      expect(bookingRepositoryMock.findByIdWithRelations).toHaveBeenCalledWith(
        TEST_BOOKING_ID,
      );
    });

    it("retorna 404 si el booking no existe", async () => {
      const token = makeToken("admin@test.com", "ADMIN");
      bookingRepositoryMock.findByIdWithRelations.mockResolvedValue(null);

      const response = await app.request(`/api/bookings/${TEST_BOOKING_ID}`, {
        method: "GET",
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      expect(response.status).toBe(404);
      const json = await response.json();
      expect(json.error).toBe("Booking not found");
    });

    it("incluye assignedStaff cuando está asignado", async () => {
      const token = makeToken("admin@test.com", "ADMIN");
      bookingRepositoryMock.findByIdWithRelations.mockResolvedValue({
        ...sampleBooking,
        assignedStaffId: TEST_STAFF_ID,
        assignedStaff: sampleStaff,
        service: sampleService,
        property: sampleProperty,
        customer: sampleCustomer,
      });

      const response = await app.request(`/api/bookings/${TEST_BOOKING_ID}`, {
        method: "GET",
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.data.assignedStaff).toMatchObject({
        id: TEST_STAFF_ID,
        email: "staff@test.com",
        fullName: "Staff Member",
        role: "STAFF",
      });
    });

    it("requiere autenticación", async () => {
      const response = await app.request(`/api/bookings/${TEST_BOOKING_ID}`, {
        method: "GET",
      });

      expect(response.status).toBe(401);
    });
  });

  describe("PATCH /api/bookings/:id/assign-staff - Assign staff to booking", () => {
    it("asigna staff a un booking correctamente", async () => {
      const token = makeToken("admin@test.com", "ADMIN");
      userRepositoryMock.findById.mockResolvedValue(sampleStaff);
      bookingRepositoryMock.update.mockResolvedValue({
        ...sampleBooking,
        assignedStaffId: TEST_STAFF_ID,
      });
      bookingRepositoryMock.findByIdWithRelations.mockResolvedValue({
        ...sampleBooking,
        assignedStaffId: TEST_STAFF_ID,
        assignedStaff: sampleStaff,
        service: sampleService,
        property: sampleProperty,
        customer: sampleCustomer,
      });

      const response = await app.request(
        `/api/bookings/${TEST_BOOKING_ID}/assign-staff`,
        {
          method: "PATCH",
          headers: {
            authorization: `Bearer ${token}`,
            "content-type": "application/json",
          },
          body: JSON.stringify({
            staffId: TEST_STAFF_ID,
          }),
        },
      );

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.data.assignedStaff).toMatchObject({
        id: TEST_STAFF_ID,
        email: "staff@test.com",
      });
      expect(bookingRepositoryMock.update).toHaveBeenCalledWith(
        TEST_BOOKING_ID,
        {
          assignedStaffId: TEST_STAFF_ID,
        },
      );
    });

    it("permite desasignar staff pasando null", async () => {
      const token = makeToken("admin@test.com", "ADMIN");
      bookingRepositoryMock.update.mockResolvedValue({
        ...sampleBooking,
        assignedStaffId: null,
      });
      bookingRepositoryMock.findByIdWithRelations.mockResolvedValue({
        ...sampleBooking,
        assignedStaffId: null,
        assignedStaff: null,
        service: sampleService,
        property: sampleProperty,
        customer: sampleCustomer,
      });

      const response = await app.request(
        `/api/bookings/${TEST_BOOKING_ID}/assign-staff`,
        {
          method: "PATCH",
          headers: {
            authorization: `Bearer ${token}`,
            "content-type": "application/json",
          },
          body: JSON.stringify({
            staffId: null,
          }),
        },
      );

      expect(response.status).toBe(200);
      expect(bookingRepositoryMock.update).toHaveBeenCalledWith(
        TEST_BOOKING_ID,
        {
          assignedStaffId: null,
        },
      );
    });

    it("valida que el usuario existe", async () => {
      const token = makeToken("admin@test.com", "ADMIN");
      userRepositoryMock.findById.mockResolvedValue(null);

      const response = await app.request(
        `/api/bookings/${TEST_BOOKING_ID}/assign-staff`,
        {
          method: "PATCH",
          headers: {
            authorization: `Bearer ${token}`,
            "content-type": "application/json",
          },
          body: JSON.stringify({
            staffId: TEST_STAFF_ID,
          }),
        },
      );

      expect(response.status).toBe(404);
      const json = await response.json();
      expect(json.error).toBe("Usuario no encontrado");
      expect(bookingRepositoryMock.update).not.toHaveBeenCalled();
    });

    it("valida que el usuario tiene rol STAFF", async () => {
      const token = makeToken("admin@test.com", "ADMIN");
      userRepositoryMock.findById.mockResolvedValue({
        ...sampleStaff,
        role: "CLIENT",
      });

      const response = await app.request(
        `/api/bookings/${TEST_BOOKING_ID}/assign-staff`,
        {
          method: "PATCH",
          headers: {
            authorization: `Bearer ${token}`,
            "content-type": "application/json",
          },
          body: JSON.stringify({
            staffId: TEST_STAFF_ID,
          }),
        },
      );

      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.error).toBe("El usuario debe tener rol de STAFF");
      expect(bookingRepositoryMock.update).not.toHaveBeenCalled();
    });

    it("valida que el staff está activo", async () => {
      const token = makeToken("admin@test.com", "ADMIN");
      userRepositoryMock.findById.mockResolvedValue({
        ...sampleStaff,
        isActive: false,
      });

      const response = await app.request(
        `/api/bookings/${TEST_BOOKING_ID}/assign-staff`,
        {
          method: "PATCH",
          headers: {
            authorization: `Bearer ${token}`,
            "content-type": "application/json",
          },
          body: JSON.stringify({
            staffId: TEST_STAFF_ID,
          }),
        },
      );

      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.error).toBe("El staff asignado debe estar activo");
      expect(bookingRepositoryMock.update).not.toHaveBeenCalled();
    });

    it("solo ADMIN y COORDINATOR pueden asignar staff", async () => {
      const token = makeToken("staff@test.com", "STAFF");

      const response = await app.request(
        `/api/bookings/${TEST_BOOKING_ID}/assign-staff`,
        {
          method: "PATCH",
          headers: {
            authorization: `Bearer ${token}`,
            "content-type": "application/json",
          },
          body: JSON.stringify({
            staffId: TEST_STAFF_ID,
          }),
        },
      );

      expect(response.status).toBe(403);
    });
  });

  describe("GET /api/bookings - Filters", () => {
    it("filtra por assignedStaffId", async () => {
      const token = makeToken("admin@test.com", "ADMIN");
      bookingRepositoryMock.findManyPaginated.mockResolvedValue({
        data: [{ ...sampleBooking, assignedStaffId: TEST_STAFF_ID }],
        nextCursor: null,
        hasMore: false,
      });

      const response = await app.request(
        `/api/bookings?assignedStaffId=${TEST_STAFF_ID}`,
        {
          method: "GET",
          headers: {
            authorization: `Bearer ${token}`,
          },
        },
      );

      expect(response.status).toBe(200);
      expect(bookingRepositoryMock.findManyPaginated).toHaveBeenCalledWith(
        20,
        undefined,
        expect.objectContaining({
          assignedStaffId: TEST_STAFF_ID,
        }),
        true,
        expect.any(Object),
      );
    });

    it("filtra por code", async () => {
      const token = makeToken("admin@test.com", "ADMIN");
      bookingRepositoryMock.findManyPaginated.mockResolvedValue({
        data: [sampleBooking],
        nextCursor: null,
        hasMore: false,
      });

      const response = await app.request(`/api/bookings?code=BRISA-0001`, {
        method: "GET",
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      expect(response.status).toBe(200);
      expect(bookingRepositoryMock.findManyPaginated).toHaveBeenCalledWith(
        20,
        undefined,
        expect.objectContaining({
          code: "BRISA-0001",
        }),
        true,
        expect.any(Object),
      );
    });

    it("combina filtros de assignedStaffId y status", async () => {
      const token = makeToken("admin@test.com", "ADMIN");
      bookingRepositoryMock.findManyPaginated.mockResolvedValue({
        data: [],
        nextCursor: null,
        hasMore: false,
      });

      const response = await app.request(
        `/api/bookings?assignedStaffId=${TEST_STAFF_ID}&status=CONFIRMED`,
        {
          method: "GET",
          headers: {
            authorization: `Bearer ${token}`,
          },
        },
      );

      expect(response.status).toBe(200);
      expect(bookingRepositoryMock.findManyPaginated).toHaveBeenCalledWith(
        20,
        undefined,
        expect.objectContaining({
          assignedStaffId: TEST_STAFF_ID,
          status: "CONFIRMED",
        }),
        true,
        expect.any(Object),
      );
    });
  });
});
