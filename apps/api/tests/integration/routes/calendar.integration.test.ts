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
process.env.TZ = "UTC";

// Valid CUIDs for tests (format: c + 24 alphanumeric characters)
const TEST_SERVICE_ID = "clh5k2j3a0001mh08abc12345";
const TEST_CUSTOMER_ID = "clh5k2j3a0002mh08def67890";
const TEST_PROPERTY_ID = "clh5k2j3a0003mh08ghi11111";
const TEST_PROPERTY_ID_2 = "clh5k2j3a0004mh08jkl22222";
const TEST_STAFF_ID = "clh5k2j3a0006mh08staff123";
const TEST_BOOKING_ID_1 = "clh5k2j3a0007mh08book1111";
const TEST_BOOKING_ID_2 = "clh5k2j3a0008mh08book2222";

const bookingRepositoryMock = {
  findById: vi.fn(),
  findByIdWithRelations: vi.fn(),
  findManyPaginated: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  hasTimeConflict: vi.fn(),
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

const sampleBooking1 = {
  id: TEST_BOOKING_ID_1,
  code: "BRISA-0001",
  scheduledAt: new Date("2025-11-15T10:00:00.000Z"),
  durationMin: 120,
  status: "CONFIRMED" as BookingStatus,
  totalAmount: 15000,
  serviceId: TEST_SERVICE_ID,
  propertyId: TEST_PROPERTY_ID,
  customerId: TEST_CUSTOMER_ID,
  assignedStaffId: TEST_STAFF_ID,
  service: sampleService,
  property: sampleProperty,
  customer: sampleCustomer,
  assignedStaff: sampleStaff,
  createdAt: new Date("2025-11-01T10:00:00.000Z"),
  updatedAt: new Date("2025-11-01T10:00:00.000Z"),
};

const sampleBooking2 = {
  id: TEST_BOOKING_ID_2,
  code: "BRISA-0002",
  scheduledAt: new Date("2025-11-16T14:00:00.000Z"),
  durationMin: 60,
  status: "PENDING" as BookingStatus,
  totalAmount: 10000,
  serviceId: TEST_SERVICE_ID,
  propertyId: TEST_PROPERTY_ID_2,
  customerId: TEST_CUSTOMER_ID,
  assignedStaffId: null,
  service: sampleService,
  property: { ...sampleProperty, id: TEST_PROPERTY_ID_2, label: "Ocean View" },
  customer: sampleCustomer,
  assignedStaff: null,
  createdAt: new Date("2025-11-01T11:00:00.000Z"),
  updatedAt: new Date("2025-11-01T11:00:00.000Z"),
};

beforeAll(async () => {
  // Mock environment variables
  process.env.JWT_SECRET = "test-secret-key-for-testing-only";

  // Mock the container module
  vi.mock("../../../src/container.js", () => ({
    initializeContainer: vi.fn(),
    getBookingRepository: () => bookingRepositoryMock,
  }));

  // Import app after mocking
  const { default: importedApp } = await import("../../../src/app.js");
  app = importedApp;
});

afterAll(() => {
  vi.clearAllMocks();
  vi.resetModules();
});

beforeEach(() => {
  vi.clearAllMocks();
});

/**
 * Helper to generate JWT token for test user
 */
function generateTestToken(
  role: "ADMIN" | "COORDINATOR" | "STAFF" | "CLIENT" = "ADMIN",
): string {
  return jwt.sign(
    {
      userId: role === "STAFF" ? TEST_STAFF_ID : TEST_CUSTOMER_ID,
      email: role === "STAFF" ? "staff@test.com" : "admin@test.com",
      role,
    },
    process.env.JWT_SECRET!,
    { expiresIn: "1h" },
  );
}

describe("GET /api/calendar", () => {
  it("retorna bookings agrupados por fecha", async () => {
    const token = generateTestToken("ADMIN");

    bookingRepositoryMock.findManyPaginated.mockResolvedValue({
      data: [sampleBooking1, sampleBooking2],
      pagination: { total: 2, page: 1, limit: 2000, totalPages: 1 },
    });

    const from = "2025-11-01T00:00:00.000Z";
    const to = "2025-11-30T23:59:59.999Z";

    const res = await app.request(
      `/api/calendar?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Forwarded-For": "127.0.0.1",
        },
      },
    );

    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.data).toBeDefined();
    expect(body.data.bookingsByDate).toBeDefined();
    expect(body.data.dateRange).toBeDefined();
    expect(body.data.summary).toBeDefined();

    // Check bookings are grouped by date
    expect(body.data.bookingsByDate["2025-11-15"]).toHaveLength(1);
    expect(body.data.bookingsByDate["2025-11-16"]).toHaveLength(1);

    // Check summary statistics
    expect(body.data.summary.totalBookings).toBe(2);
    expect(body.data.summary.statusCounts.CONFIRMED).toBe(1);
    expect(body.data.summary.statusCounts.PENDING).toBe(1);
    expect(body.data.summary.totalRevenue).toBe("25000.00");
  });

  it("rechaza solicitud sin autenticación", async () => {
    const res = await app.request(
      `/api/calendar?from=2025-11-01&to=2025-11-30`,
      {
        headers: {
          "X-Forwarded-For": "127.0.0.1",
        },
      },
    );

    expect(res.status).toBe(401);
  });

  it("rechaza solicitud de usuario CLIENT", async () => {
    const token = generateTestToken("CLIENT");

    const res = await app.request(
      `/api/calendar?from=2025-11-01&to=2025-11-30`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Forwarded-For": "127.0.0.1",
        },
      },
    );

    expect(res.status).toBe(403);
  });

  it("permite solicitud de usuario STAFF", async () => {
    const token = generateTestToken("STAFF");

    bookingRepositoryMock.findManyPaginated.mockResolvedValue({
      data: [],
      pagination: { total: 0, page: 1, limit: 2000, totalPages: 0 },
    });

    const res = await app.request(
      `/api/calendar?from=2025-11-01&to=2025-11-30`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Forwarded-For": "127.0.0.1",
        },
      },
    );

    expect(res.status).toBe(200);
  });

  it("rechaza rango de fechas inválido (from > to)", async () => {
    const token = generateTestToken("ADMIN");

    const res = await app.request(
      `/api/calendar?from=2025-11-30&to=2025-11-01`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Forwarded-For": "127.0.0.1",
        },
      },
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("Invalid date range");
  });

  it("rechaza rango de fechas mayor a 90 días", async () => {
    const token = generateTestToken("ADMIN");

    const from = "2025-11-01";
    const to = "2026-02-01"; // More than 90 days

    const res = await app.request(`/api/calendar?from=${from}&to=${to}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "X-Forwarded-For": "127.0.0.1",
      },
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("Date range too large");
  });

  it("filtra por estado de reserva", async () => {
    const token = generateTestToken("ADMIN");

    bookingRepositoryMock.findManyPaginated.mockResolvedValue({
      data: [sampleBooking1], // Only CONFIRMED
      pagination: { total: 1, page: 1, limit: 2000, totalPages: 1 },
    });

    const from = "2025-11-01";
    const to = "2025-11-30";
    const status = "CONFIRMED";

    const res = await app.request(
      `/api/calendar?from=${from}&to=${to}&status=${status}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Forwarded-For": "127.0.0.1",
        },
      },
    );

    expect(res.status).toBe(200);

    // Verify the mock was called with status filter
    expect(bookingRepositoryMock.findManyPaginated).toHaveBeenCalledWith(
      2000,
      undefined,
      expect.objectContaining({
        status: "CONFIRMED",
      }),
      true,
      expect.any(Object),
    );
  });

  it("filtra por propiedad", async () => {
    const token = generateTestToken("ADMIN");

    bookingRepositoryMock.findManyPaginated.mockResolvedValue({
      data: [sampleBooking1],
      pagination: { total: 1, page: 1, limit: 2000, totalPages: 1 },
    });

    const from = "2025-11-01";
    const to = "2025-11-30";

    const res = await app.request(
      `/api/calendar?from=${from}&to=${to}&propertyId=${TEST_PROPERTY_ID}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Forwarded-For": "127.0.0.1",
        },
      },
    );

    expect(res.status).toBe(200);

    expect(bookingRepositoryMock.findManyPaginated).toHaveBeenCalledWith(
      2000,
      undefined,
      expect.objectContaining({
        propertyId: TEST_PROPERTY_ID,
      }),
      true,
      expect.any(Object),
    );
  });

  it("filtra por servicio", async () => {
    const token = generateTestToken("ADMIN");

    bookingRepositoryMock.findManyPaginated.mockResolvedValue({
      data: [sampleBooking1],
      pagination: { total: 1, page: 1, limit: 2000, totalPages: 1 },
    });

    const from = "2025-11-01";
    const to = "2025-11-30";

    const res = await app.request(
      `/api/calendar?from=${from}&to=${to}&serviceId=${TEST_SERVICE_ID}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Forwarded-For": "127.0.0.1",
        },
      },
    );

    expect(res.status).toBe(200);

    expect(bookingRepositoryMock.findManyPaginated).toHaveBeenCalledWith(
      2000,
      undefined,
      expect.objectContaining({
        serviceId: TEST_SERVICE_ID,
      }),
      true,
      expect.any(Object),
    );
  });

  it("filtra por personal asignado", async () => {
    const token = generateTestToken("ADMIN");

    bookingRepositoryMock.findManyPaginated.mockResolvedValue({
      data: [sampleBooking1],
      pagination: { total: 1, page: 1, limit: 2000, totalPages: 1 },
    });

    const from = "2025-11-01";
    const to = "2025-11-30";

    const res = await app.request(
      `/api/calendar?from=${from}&to=${to}&assignedStaffId=${TEST_STAFF_ID}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Forwarded-For": "127.0.0.1",
        },
      },
    );

    expect(res.status).toBe(200);

    expect(bookingRepositoryMock.findManyPaginated).toHaveBeenCalledWith(
      2000,
      undefined,
      expect.objectContaining({
        assignedStaffId: TEST_STAFF_ID,
      }),
      true,
      expect.any(Object),
    );
  });

  it("incluye fechas vacías en el rango", async () => {
    const token = generateTestToken("ADMIN");

    bookingRepositoryMock.findManyPaginated.mockResolvedValue({
      data: [sampleBooking1], // Only one booking on Nov 15
      pagination: { total: 1, page: 1, limit: 2000, totalPages: 1 },
    });

    const from = "2025-11-14";
    const to = "2025-11-17";

    const res = await app.request(`/api/calendar?from=${from}&to=${to}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "X-Forwarded-For": "127.0.0.1",
      },
    });

    expect(res.status).toBe(200);

    const body = await res.json();

    // Should have 4 dates in range (14, 15, 16, 17)
    expect(body.data.dateRange).toHaveLength(4);
    expect(body.data.dateRange).toContain("2025-11-14");
    expect(body.data.dateRange).toContain("2025-11-15");
    expect(body.data.dateRange).toContain("2025-11-16");
    expect(body.data.dateRange).toContain("2025-11-17");

    // Empty dates should have empty arrays
    expect(body.data.bookingsByDate["2025-11-14"]).toEqual([]);
    expect(body.data.bookingsByDate["2025-11-16"]).toEqual([]);
    expect(body.data.bookingsByDate["2025-11-17"]).toEqual([]);
  });
});

describe("GET /api/calendar/availability", () => {
  it("retorna slots de tiempo disponibles", async () => {
    const token = generateTestToken("ADMIN");

    // No bookings for this day
    bookingRepositoryMock.findManyPaginated.mockResolvedValue({
      data: [],
      pagination: { total: 0, page: 1, limit: 100, totalPages: 0 },
    });

    const date = "2025-11-20T00:00:00.000Z";

    const res = await app.request(
      `/api/calendar/availability?date=${encodeURIComponent(date)}&propertyId=${TEST_PROPERTY_ID}&durationMin=60`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Forwarded-For": "127.0.0.1",
        },
      },
    );

    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.data).toBeDefined();
    expect(body.data.timeSlots).toBeDefined();
    expect(body.data.timeSlots.length).toBeGreaterThan(0);

    // All slots should be available
    const allAvailable = body.data.timeSlots.every(
      (slot: { available: boolean }) => slot.available === true,
    );
    expect(allAvailable).toBe(true);
  });

  it("marca slots como no disponibles cuando hay conflicto", async () => {
    const token = generateTestToken("ADMIN");

    // Booking from 10:00 to 12:00
    const bookingAt10 = {
      ...sampleBooking1,
      scheduledAt: new Date("2025-11-20T10:00:00.000Z"),
      durationMin: 120,
    };

    bookingRepositoryMock.findManyPaginated.mockResolvedValue({
      data: [bookingAt10],
      pagination: { total: 1, page: 1, limit: 100, totalPages: 1 },
    });

    const date = "2025-11-20T00:00:00.000Z";

    const res = await app.request(
      `/api/calendar/availability?date=${encodeURIComponent(date)}&propertyId=${TEST_PROPERTY_ID}&durationMin=60`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Forwarded-For": "127.0.0.1",
        },
      },
    );

    expect(res.status).toBe(200);

    const body = await res.json();

    const conflictSlots = body.data.timeSlots.filter(
      (s: { bookingId?: string | null }) => s.bookingId === TEST_BOOKING_ID_1,
    );

    expect(conflictSlots.length).toBeGreaterThan(0);
    conflictSlots.forEach(
      (slot: { available: boolean; bookingId?: string | null }) => {
        expect(slot.available).toBe(false);
        expect(slot.bookingId).toBe(TEST_BOOKING_ID_1);
      },
    );
  });

  it("rechaza solicitud sin propertyId", async () => {
    const token = generateTestToken("ADMIN");

    const date = "2025-11-20";

    const res = await app.request(
      `/api/calendar/availability?date=${date}&durationMin=60`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Forwarded-For": "127.0.0.1",
        },
      },
    );

    expect(res.status).toBe(400);
  });

  it("rechaza solicitud sin fecha", async () => {
    const token = generateTestToken("ADMIN");

    const res = await app.request(
      `/api/calendar/availability?propertyId=${TEST_PROPERTY_ID}&durationMin=60`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Forwarded-For": "127.0.0.1",
        },
      },
    );

    expect(res.status).toBe(400);
  });

  it("usa duración por defecto de 60 minutos", async () => {
    const token = generateTestToken("ADMIN");

    bookingRepositoryMock.findManyPaginated.mockResolvedValue({
      data: [],
      pagination: { total: 0, page: 1, limit: 100, totalPages: 0 },
    });

    const date = "2025-11-20";

    const res = await app.request(
      `/api/calendar/availability?date=${date}&propertyId=${TEST_PROPERTY_ID}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Forwarded-For": "127.0.0.1",
        },
      },
    );

    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.data.durationMin).toBe(60);
  });

  it("rechaza duración menor a 30 minutos", async () => {
    const token = generateTestToken("ADMIN");

    const date = "2025-11-20";

    const res = await app.request(
      `/api/calendar/availability?date=${date}&propertyId=${TEST_PROPERTY_ID}&durationMin=15`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Forwarded-For": "127.0.0.1",
        },
      },
    );

    expect(res.status).toBe(400);
  });

  it("retorna bookings del día en la respuesta", async () => {
    const token = generateTestToken("ADMIN");

    bookingRepositoryMock.findManyPaginated.mockResolvedValue({
      data: [sampleBooking1],
      pagination: { total: 1, page: 1, limit: 100, totalPages: 1 },
    });

    const date = "2025-11-15";

    const res = await app.request(
      `/api/calendar/availability?date=${date}&propertyId=${TEST_PROPERTY_ID}&durationMin=60`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Forwarded-For": "127.0.0.1",
        },
      },
    );

    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.data.bookings).toBeDefined();
    expect(body.data.bookings).toHaveLength(1);
    expect(body.data.bookings[0].id).toBe(TEST_BOOKING_ID_1);
  });
});
