import { beforeEach, describe, expect, it, vi } from "vitest";
import { Hono } from "hono";
import { generateAccessToken } from "../lib/token";

// Set environment FIRST
process.env.JWT_SECRET = "test-secret";

// Store mock functions
const sendCleanScoreReport = vi.fn();
const calculateCleanScore = vi.fn();

// Mock with inline functions
vi.mock("../lib/db", () => ({
  db: {
    booking: {
      findUnique: vi.fn(),
    },
    cleanScoreReport: {
      upsert: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));

vi.mock("../services/reports", () => ({
  sendCleanScoreReport: sendCleanScoreReport.mockResolvedValue({
    success: true,
  }),
  calculateCleanScore: calculateCleanScore.mockReturnValue(92.5),
}));

// Import after mocking
const { default: reports } = await import("./reports");

// Get mock references for assertions
const { db } = await import("../lib/db");
const bookingMock = db.booking;
const cleanScoreReportMock = db.cleanScoreReport;

const buildApp = () => {
  const app = new Hono();
  app.route("/api/reports", reports);
  return app;
};

const authHeader = (role: "ADMIN" | "STAFF" | "CLIENT", sub: string) => ({
  Authorization: `Bearer ${generateAccessToken({
    sub,
    email: `${sub}@example.com`,
    role,
  })}`,
});

describe("POST /api/reports/cleanscore - Extended Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    bookingMock.findUnique.mockResolvedValue({
      id: "booking-1",
      scheduledAt: new Date("2025-01-01T10:00:00Z"),
      completedAt: new Date("2025-01-01T12:00:00Z"),
      status: "COMPLETED",
      user: {
        email: "client@example.com",
        name: "Cliente Demo",
      },
      property: {
        name: "Skyline Loft",
        address: "890 Biscayne Blvd",
      },
      service: {
        name: "Limpieza Premium",
      },
    });
    cleanScoreReportMock.upsert.mockResolvedValue({
      id: "csr_123",
      status: "DRAFT",
    });
  });

  it("should return 400 if bookingId is missing", async () => {
    const app = buildApp();

    const response = await app.request("/api/reports/cleanscore", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...authHeader("ADMIN", "admin-1"),
      },
      body: JSON.stringify({}),
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBeDefined();
  });

  it("should return 404 if booking not found", async () => {
    const app = buildApp();
    bookingMock.findUnique.mockResolvedValueOnce(null);

    const response = await app.request("/api/reports/cleanscore", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...authHeader("ADMIN", "admin-1"),
      },
      body: JSON.stringify({ bookingId: "nonexistent" }),
    });

    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toContain("Booking");
  });

  it("should normalize checklist items with status", async () => {
    const app = buildApp();

    const response = await app.request("/api/reports/cleanscore", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...authHeader("ADMIN", "admin-1"),
      },
      body: JSON.stringify({
        bookingId: "booking-1",
        checklist: [
          { area: "Sala", status: "PASS" },
          { area: "Dormitorio", status: "WARN" },
        ],
      }),
    });

    expect(response.status).toBe(200);
    const [{ create }] = cleanScoreReportMock.upsert.mock.calls[0];
    expect(create.checklist.length).toBeGreaterThan(0);
  });

  it("should normalize invalid checklist status to PASS", async () => {
    const app = buildApp();

    const response = await app.request("/api/reports/cleanscore", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...authHeader("ADMIN", "admin-1"),
      },
      body: JSON.stringify({
        bookingId: "booking-1",
        checklist: [{ area: "Cocina", status: "INVALID_STATUS" }],
      }),
    });

    expect(response.status).toBe(200);
    const [{ create }] = cleanScoreReportMock.upsert.mock.calls[0];
    expect(create.checklist[0].status).toBe("PASS");
  });

  it("should trim notes and set to undefined if empty", async () => {
    const app = buildApp();

    const response = await app.request("/api/reports/cleanscore", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...authHeader("ADMIN", "admin-1"),
      },
      body: JSON.stringify({
        bookingId: "booking-1",
        checklist: [
          { area: "Baño", status: "WARN", notes: "  Revisar  " },
          { area: "Cocina", status: "PASS", notes: "   " },
        ],
      }),
    });

    expect(response.status).toBe(200);
    const [{ create }] = cleanScoreReportMock.upsert.mock.calls[0];
    expect(create.checklist[0].notes).toBe("Revisar");
    expect(create.checklist[1].notes).toBeUndefined();
  });

  it("should handle empty checklist gracefully", async () => {
    const app = buildApp();

    const response = await app.request("/api/reports/cleanscore", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...authHeader("ADMIN", "admin-1"),
      },
      body: JSON.stringify({
        bookingId: "booking-1",
        checklist: [],
      }),
    });

    expect(response.status).toBe(200);
    const [{ create }] = cleanScoreReportMock.upsert.mock.calls[0];
    expect(create.checklist).toEqual([]);
    expect(create.score).toBeDefined(); // Score should still be calculated
  });

  it("should allow STAFF to create reports", async () => {
    const app = buildApp();

    const response = await app.request("/api/reports/cleanscore", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...authHeader("STAFF", "staff-1"),
      },
      body: JSON.stringify({ bookingId: "booking-1" }),
    });

    expect(response.status).toBe(200);
    expect(cleanScoreReportMock.upsert).toHaveBeenCalled();
  });

  it("should return 403 for CLIENT role", async () => {
    const app = buildApp();

    const response = await app.request("/api/reports/cleanscore", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...authHeader("CLIENT", "client-1"),
      },
      body: JSON.stringify({ bookingId: "booking-1" }),
    });

    expect(response.status).toBe(403);
    expect(cleanScoreReportMock.upsert).not.toHaveBeenCalled();
  });

  it("should keep report as DRAFT when publish is false", async () => {
    const app = buildApp();

    const response = await app.request("/api/reports/cleanscore", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...authHeader("ADMIN", "admin-1"),
      },
      body: JSON.stringify({
        bookingId: "booking-1",
        publish: false,
      }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.status).toBe("DRAFT");
    expect(sendCleanScoreReport).not.toHaveBeenCalled();
    expect(cleanScoreReportMock.update).not.toHaveBeenCalled();
  });

  it("should handle FAIL status in checklist", async () => {
    const app = buildApp();

    const response = await app.request("/api/reports/cleanscore", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...authHeader("ADMIN", "admin-1"),
      },
      body: JSON.stringify({
        bookingId: "booking-1",
        checklist: [
          { area: "Cocina", status: "FAIL", notes: "Sucio" },
          { area: "Baño", status: "PASS" },
        ],
      }),
    });

    expect(response.status).toBe(200);
    const [{ create }] = cleanScoreReportMock.upsert.mock.calls[0];
    expect(create.checklist).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ area: "Cocina", status: "FAIL" }),
      ]),
    );
    // Recommendations should include rework for failed areas
    expect(create.recommendations).toBeDefined();
  });
});

describe("GET /api/reports/cleanscore/:bookingId", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 for unauthenticated request", async () => {
    const app = buildApp();

    const response = await app.request("/api/reports/cleanscore/booking-1");

    expect(response.status).toBe(401);
  });

  it("should return report for ADMIN", async () => {
    const app = buildApp();
    cleanScoreReportMock.findUnique.mockResolvedValueOnce({
      id: "report-1",
      bookingId: "booking-1",
      score: 92,
      status: "PUBLISHED",
      metrics: {},
      photos: [],
      videos: [],
      checklist: [],
      teamMembers: [],
      observations: null,
      recommendations: [],
      generatedBy: "admin-1",
      sentToEmail: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      booking: {
        id: "booking-1",
        userId: "user-1",
        status: "COMPLETED",
        scheduledAt: new Date(),
        completedAt: new Date(),
        user: { id: "user-1", email: "client@example.com", name: "Cliente" },
        property: { name: "Property 1", address: "123 Main St" },
        service: { name: "Deep Clean" },
      },
    });

    const response = await app.request("/api/reports/cleanscore/booking-1", {
      headers: authHeader("ADMIN", "admin-1"),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.id).toBe("report-1");
    expect(data.score).toBe(92);
  });

  it("should return 404 if report not found", async () => {
    const app = buildApp();
    cleanScoreReportMock.findUnique.mockResolvedValueOnce(null);

    const response = await app.request("/api/reports/cleanscore/booking-1", {
      headers: authHeader("ADMIN", "admin-1"),
    });

    expect(response.status).toBe(404);
  });

  it("should allow CLIENT to view own report", async () => {
    const app = buildApp();
    cleanScoreReportMock.findUnique.mockResolvedValueOnce({
      id: "report-1",
      bookingId: "booking-1",
      score: 92,
      status: "PUBLISHED",
      metrics: {},
      photos: [],
      videos: [],
      checklist: [],
      teamMembers: [],
      observations: null,
      recommendations: [],
      generatedBy: "staff-1",
      sentToEmail: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      booking: {
        id: "booking-1",
        userId: "client-1",
        status: "COMPLETED",
        scheduledAt: new Date(),
        completedAt: new Date(),
        user: { id: "client-1", email: "client@example.com", name: "Cliente" },
        property: { name: "Property 1", address: "123 Main St" },
        service: { name: "Deep Clean" },
      },
    });

    const response = await app.request("/api/reports/cleanscore/booking-1", {
      headers: authHeader("CLIENT", "client-1"),
    });

    expect(response.status).toBe(200);
  });

  it("should return 403 for CLIENT viewing other's report", async () => {
    const app = buildApp();
    cleanScoreReportMock.findUnique.mockResolvedValueOnce({
      id: "report-1",
      bookingId: "booking-1",
      score: 92,
      status: "PUBLISHED",
      metrics: {},
      photos: [],
      videos: [],
      checklist: [],
      teamMembers: [],
      observations: null,
      recommendations: [],
      generatedBy: "staff-1",
      sentToEmail: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      booking: {
        id: "booking-1",
        userId: "other-user",
        status: "COMPLETED",
        scheduledAt: new Date(),
        completedAt: new Date(),
        user: { id: "other-user", email: "other@example.com", name: "Otro" },
        property: { name: "Property 1", address: "123 Main St" },
        service: { name: "Deep Clean" },
      },
    });

    const response = await app.request("/api/reports/cleanscore/booking-1", {
      headers: authHeader("CLIENT", "client-1"),
    });

    expect(response.status).toBe(403);
  });
});

describe("GET /api/reports/cleanscore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return paginated reports for ADMIN", async () => {
    const app = buildApp();
    cleanScoreReportMock.count.mockResolvedValueOnce(25);
    cleanScoreReportMock.findMany.mockResolvedValueOnce([
      {
        id: "report-1",
        bookingId: "booking-1",
        score: 92,
        status: "PUBLISHED",
        metrics: {},
        photos: [],
        videos: [],
        checklist: [],
        teamMembers: [],
        observations: null,
        recommendations: [],
        generatedBy: "admin-1",
        sentToEmail: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        booking: {
          id: "booking-1",
          status: "COMPLETED",
          scheduledAt: new Date(),
          completedAt: new Date(),
          user: { id: "user-1", email: "client@example.com", name: "Cliente" },
          property: {
            id: "prop-1",
            name: "Property 1",
            address: "123 Main St",
          },
          service: { id: "service-1", name: "Deep Clean" },
        },
      },
      {
        id: "report-2",
        bookingId: "booking-2",
        score: 88,
        status: "DRAFT",
        metrics: {},
        photos: [],
        videos: [],
        checklist: [],
        teamMembers: [],
        observations: null,
        recommendations: [],
        generatedBy: "admin-1",
        sentToEmail: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        booking: {
          id: "booking-2",
          status: "COMPLETED",
          scheduledAt: new Date(),
          completedAt: new Date(),
          user: {
            id: "user-2",
            email: "client2@example.com",
            name: "Cliente 2",
          },
          property: {
            id: "prop-2",
            name: "Property 2",
            address: "456 Main St",
          },
          service: { id: "service-1", name: "Deep Clean" },
        },
      },
    ]);

    const response = await app.request(
      "/api/reports/cleanscore?offset=0&limit=10",
      {
        headers: authHeader("ADMIN", "admin-1"),
      },
    );

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.reports).toHaveLength(2);
    expect(data.pagination.total).toBe(25);
  });

  it("should filter by status for STAFF", async () => {
    const app = buildApp();
    cleanScoreReportMock.count.mockResolvedValueOnce(5);
    cleanScoreReportMock.findMany.mockResolvedValueOnce([]);

    const response = await app.request(
      "/api/reports/cleanscore?status=PUBLISHED",
      {
        headers: authHeader("STAFF", "staff-1"),
      },
    );

    expect(response.status).toBe(200);
    expect(cleanScoreReportMock.findMany).toHaveBeenCalled();
  });

  it("should return 403 for CLIENT accessing list endpoint", async () => {
    const app = buildApp();

    const response = await app.request("/api/reports/cleanscore", {
      headers: authHeader("CLIENT", "client-1"),
    });

    expect(response.status).toBe(403);
    expect(cleanScoreReportMock.findMany).not.toHaveBeenCalled();
  });
});
