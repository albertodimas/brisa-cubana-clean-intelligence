import { beforeEach, describe, expect, it, vi } from "vitest";
import { Hono } from "hono";
import { generateAccessToken } from "../lib/token";

const bookingMock = {
  findUnique: vi.fn(),
};

const cleanScoreReportMock = {
  upsert: vi.fn(),
  findUnique: vi.fn(),
  update: vi.fn(),
  findMany: vi.fn(),
  count: vi.fn(),
};

vi.mock("../lib/db", () => ({
  db: {
    booking: bookingMock,
    cleanScoreReport: cleanScoreReportMock,
  },
}));

const sendCleanScoreReport = vi.fn();
const calculateCleanScore = vi.fn();

vi.mock("../services/reports", () => ({
  sendCleanScoreReport: sendCleanScoreReport.mockResolvedValue({
    success: true,
  }),
  calculateCleanScore: calculateCleanScore.mockReturnValue(92.5),
}));

process.env.JWT_SECRET = "test-secret";

const { default: reports } = await import("./reports");

const buildApp = () => {
  const app = new Hono();
  app.route("/api/reports", reports);
  return app;
};

describe("reports route", () => {
  const adminToken = generateAccessToken({
    sub: "admin-1",
    email: "admin@example.com",
    role: "ADMIN",
  });

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

  it("rejects CleanScore generation when request is not authenticated", async () => {
    const app = buildApp();

    const response = await app.request("/api/reports/cleanscore", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ bookingId: "booking-1" }),
    });

    expect(response.status).toBe(401);
    expect(cleanScoreReportMock.upsert).not.toHaveBeenCalled();
  });

  it("generates CleanScore report and stores structured JSON", async () => {
    const app = buildApp();

    const response = await app.request("/api/reports/cleanscore", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        bookingId: "booking-1",
        images: ["https://example.com/foto.jpg"],
        videos: ["https://example.com/video.mp4"],
        checklist: [
          { area: "Cocina", status: "PASS" },
          { area: "Baño", status: "WARN", notes: "Revisar toallas" },
        ],
      }),
    });

    const jsonBody = (await response.json()) as Record<string, unknown>;
    expect(response.status, JSON.stringify(jsonBody)).toBe(200);
    expect(cleanScoreReportMock.upsert).toHaveBeenCalledTimes(1);

    const [{ create, update }] = cleanScoreReportMock.upsert.mock.calls[0];
    expect(create.photos).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ url: "https://example.com/foto.jpg" }),
      ]),
    );
    expect(create.videos).toEqual(
      expect.arrayContaining(["https://example.com/video.mp4"]),
    );
    expect(create.checklist).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ area: "Cocina", status: "PASS" }),
      ]),
    );
    expect(update.checklist).toEqual(create.checklist);
  });

  it("publishes report when sendEmail succeeds", async () => {
    const app = buildApp();
    cleanScoreReportMock.upsert.mockResolvedValueOnce({
      id: "csr_123",
      status: "DRAFT",
    });

    const response = await app.request("/api/reports/cleanscore", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        bookingId: "booking-1",
        publish: true,
      }),
    });

    const payload = (await response.json()) as { status?: string };
    expect(response.status, JSON.stringify(payload)).toBe(200);
    expect(sendCleanScoreReport).toHaveBeenCalledWith(
      expect.objectContaining({
        bookingId: "booking-1",
        clientEmail: "client@example.com",
      }),
    );
    expect(cleanScoreReportMock.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "csr_123" },
        data: expect.objectContaining({
          status: "PUBLISHED",
          sentToEmail: "client@example.com",
        }),
      }),
    );
    expect(payload.status).toBe("PUBLISHED");
  });
});
