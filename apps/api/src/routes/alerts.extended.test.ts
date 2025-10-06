import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Hono } from "hono";
import { generateAccessToken } from "../lib/token";

// Set environment before any imports
process.env.JWT_SECRET = "test-secret-alerts";

// Mock dependencies - define mocks INSIDE vi.mock factory
vi.mock("../lib/db", () => ({
  db: {
    paymentAlert: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
    },
  },
}));

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

// Import after mocking
const alerts = (await import("./alerts")).default;

// Get reference to the mocked db for test assertions
const { db } = await import("../lib/db");
const paymentAlertMock = db.paymentAlert;

function buildApp() {
  const app = new Hono();
  app.route("/api/alerts", alerts);
  return app;
}

function authHeader(role: "ADMIN" | "STAFF" | "CLIENT", sub: string) {
  return {
    Authorization: `Bearer ${generateAccessToken({
      sub,
      email: `${sub}@example.com`,
      role,
    })}`,
  };
}

describe("Alerts Extended - GET /payment", () => {
  let app: Hono;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    app = buildApp();
    originalEnv = { ...process.env };
    vi.clearAllMocks();
    fetchMock.mockReset();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("Authorization", () => {
    it("should return 401 for unauthenticated requests", async () => {
      const response = await app.request("/api/alerts/payment");

      expect(response.status).toBe(401);
    });

    it("should return 403 for CLIENT role", async () => {
      const response = await app.request("/api/alerts/payment", {
        headers: authHeader("CLIENT", "client-1"),
      });

      expect(response.status).toBe(403);
    });

    it("should allow ADMIN access", async () => {
      paymentAlertMock.findMany.mockResolvedValueOnce([]);

      const response = await app.request("/api/alerts/payment", {
        headers: authHeader("ADMIN", "admin-1"),
      });

      expect(response.status).toBe(200);
    });

    it("should allow STAFF access", async () => {
      paymentAlertMock.findMany.mockResolvedValueOnce([]);

      const response = await app.request("/api/alerts/payment", {
        headers: authHeader("STAFF", "staff-1"),
      });

      expect(response.status).toBe(200);
    });
  });

  describe("Query Parameters", () => {
    it("should use default limit of 20", async () => {
      paymentAlertMock.findMany.mockResolvedValueOnce([]);

      await app.request("/api/alerts/payment", {
        headers: authHeader("ADMIN", "admin-1"),
      });

      expect(paymentAlertMock.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 20,
        }),
      );
    });

    it("should respect custom limit", async () => {
      paymentAlertMock.findMany.mockResolvedValueOnce([]);

      await app.request("/api/alerts/payment?limit=50", {
        headers: authHeader("ADMIN", "admin-1"),
      });

      expect(paymentAlertMock.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 50,
        }),
      );
    });

    it("should cap limit at 100", async () => {
      paymentAlertMock.findMany.mockResolvedValueOnce([]);

      await app.request("/api/alerts/payment?limit=500", {
        headers: authHeader("ADMIN", "admin-1"),
      });

      expect(paymentAlertMock.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 100,
        }),
      );
    });

    it("should handle invalid limit by using default", async () => {
      paymentAlertMock.findMany.mockResolvedValueOnce([]);

      await app.request("/api/alerts/payment?limit=invalid", {
        headers: authHeader("ADMIN", "admin-1"),
      });

      expect(paymentAlertMock.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 20,
        }),
      );
    });

    it("should filter by startDate", async () => {
      paymentAlertMock.findMany.mockResolvedValueOnce([]);

      await app.request("/api/alerts/payment?startDate=2025-01-01", {
        headers: authHeader("ADMIN", "admin-1"),
      });

      expect(paymentAlertMock.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            triggeredAt: expect.objectContaining({
              gte: new Date("2025-01-01"),
            }),
          }),
        }),
      );
    });

    it("should filter by endDate", async () => {
      paymentAlertMock.findMany.mockResolvedValueOnce([]);

      await app.request("/api/alerts/payment?endDate=2025-12-31", {
        headers: authHeader("ADMIN", "admin-1"),
      });

      expect(paymentAlertMock.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            triggeredAt: expect.objectContaining({
              lte: new Date("2025-12-31"),
            }),
          }),
        }),
      );
    });

    it("should filter by date range", async () => {
      paymentAlertMock.findMany.mockResolvedValueOnce([]);

      await app.request(
        "/api/alerts/payment?startDate=2025-01-01&endDate=2025-12-31",
        {
          headers: authHeader("ADMIN", "admin-1"),
        },
      );

      expect(paymentAlertMock.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            triggeredAt: {
              gte: new Date("2025-01-01"),
              lte: new Date("2025-12-31"),
            },
          }),
        }),
      );
    });

    it("should filter by minFailed", async () => {
      paymentAlertMock.findMany.mockResolvedValueOnce([]);

      await app.request("/api/alerts/payment?minFailed=5", {
        headers: authHeader("ADMIN", "admin-1"),
      });

      expect(paymentAlertMock.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            failedPayments: { gte: 5 },
          }),
        }),
      );
    });

    it("should filter by minPending", async () => {
      paymentAlertMock.findMany.mockResolvedValueOnce([]);

      await app.request("/api/alerts/payment?minPending=10", {
        headers: authHeader("ADMIN", "admin-1"),
      });

      expect(paymentAlertMock.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            pendingPayments: { gte: 10 },
          }),
        }),
      );
    });

    it("should handle invalid minFailed", async () => {
      paymentAlertMock.findMany.mockResolvedValueOnce([]);

      await app.request("/api/alerts/payment?minFailed=abc", {
        headers: authHeader("ADMIN", "admin-1"),
      });

      expect(paymentAlertMock.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            failedPayments: undefined,
          }),
        }),
      );
    });

    it("should combine all filters", async () => {
      paymentAlertMock.findMany.mockResolvedValueOnce([]);

      await app.request(
        "/api/alerts/payment?startDate=2025-01-01&endDate=2025-12-31&minFailed=3&minPending=7&limit=30",
        {
          headers: authHeader("ADMIN", "admin-1"),
        },
      );

      expect(paymentAlertMock.findMany).toHaveBeenCalledWith({
        where: {
          triggeredAt: {
            gte: new Date("2025-01-01"),
            lte: new Date("2025-12-31"),
          },
          failedPayments: { gte: 3 },
          pendingPayments: { gte: 7 },
        },
        orderBy: { triggeredAt: "desc" },
        take: 30,
      });
    });
  });

  describe("Response", () => {
    it("should return array of alerts", async () => {
      const mockAlerts = [
        {
          id: "alert-1",
          failedPayments: 5,
          pendingPayments: 10,
          payloadHash: "5-10",
          triggeredAt: new Date("2025-01-15"),
        },
        {
          id: "alert-2",
          failedPayments: 2,
          pendingPayments: 8,
          payloadHash: "2-8",
          triggeredAt: new Date("2025-01-14"),
        },
      ];

      paymentAlertMock.findMany.mockResolvedValueOnce(mockAlerts);

      const response = await app.request("/api/alerts/payment", {
        headers: authHeader("ADMIN", "admin-1"),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveLength(2);
      expect(data[0].id).toBe("alert-1");
    });

    it("should order by triggeredAt desc", async () => {
      paymentAlertMock.findMany.mockResolvedValueOnce([]);

      await app.request("/api/alerts/payment", {
        headers: authHeader("ADMIN", "admin-1"),
      });

      expect(paymentAlertMock.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { triggeredAt: "desc" },
        }),
      );
    });
  });
});

describe("Alerts Extended - POST /payment", () => {
  let app: Hono;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    app = buildApp();
    originalEnv = { ...process.env };
    delete process.env.ALERTS_SLACK_WEBHOOK;
    vi.clearAllMocks();
    fetchMock.mockReset();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("Authorization", () => {
    it("should return 401 for unauthenticated requests", async () => {
      const response = await app.request("/api/alerts/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ failedPayments: 1, pendingPayments: 6 }),
      });

      expect(response.status).toBe(401);
    });

    it("should return 403 for CLIENT role", async () => {
      const response = await app.request("/api/alerts/payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader("CLIENT", "client-1"),
        },
        body: JSON.stringify({ failedPayments: 1, pendingPayments: 6 }),
      });

      expect(response.status).toBe(403);
    });

    it("should allow ADMIN to create alerts", async () => {
      paymentAlertMock.findFirst.mockResolvedValueOnce(null);
      paymentAlertMock.create.mockResolvedValueOnce({
        id: "alert-1",
        failedPayments: 1,
        pendingPayments: 6,
      });

      const response = await app.request("/api/alerts/payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader("ADMIN", "admin-1"),
        },
        body: JSON.stringify({ failedPayments: 1, pendingPayments: 6 }),
      });

      expect(response.status).toBe(200);
    });

    it("should allow STAFF to create alerts", async () => {
      paymentAlertMock.findFirst.mockResolvedValueOnce(null);
      paymentAlertMock.create.mockResolvedValueOnce({
        id: "alert-1",
        failedPayments: 1,
        pendingPayments: 6,
      });

      const response = await app.request("/api/alerts/payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader("STAFF", "staff-1"),
        },
        body: JSON.stringify({ failedPayments: 1, pendingPayments: 6 }),
      });

      expect(response.status).toBe(200);
    });
  });

  describe("Validation", () => {
    it("should return 400 for missing failedPayments", async () => {
      const response = await app.request("/api/alerts/payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader("ADMIN", "admin-1"),
        },
        body: JSON.stringify({ pendingPayments: 6 }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe("Invalid payment alert payload");
      expect(data.details).toBeDefined();
    });

    it("should return 400 for missing pendingPayments", async () => {
      const response = await app.request("/api/alerts/payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader("ADMIN", "admin-1"),
        },
        body: JSON.stringify({ failedPayments: 1 }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe("Invalid payment alert payload");
    });

    it("should return 400 for negative failedPayments", async () => {
      const response = await app.request("/api/alerts/payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader("ADMIN", "admin-1"),
        },
        body: JSON.stringify({ failedPayments: -1, pendingPayments: 6 }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe("Invalid payment alert payload");
    });

    it("should return 400 for negative pendingPayments", async () => {
      const response = await app.request("/api/alerts/payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader("ADMIN", "admin-1"),
        },
        body: JSON.stringify({ failedPayments: 1, pendingPayments: -5 }),
      });

      expect(response.status).toBe(400);
    });

    it("should return 400 for non-integer failedPayments", async () => {
      const response = await app.request("/api/alerts/payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader("ADMIN", "admin-1"),
        },
        body: JSON.stringify({ failedPayments: 1.5, pendingPayments: 6 }),
      });

      expect(response.status).toBe(400);
    });
  });

  describe("Threshold Logic", () => {
    it("should skip alert when failedPayments is 0 and pendingPayments <= 5", async () => {
      const response = await app.request("/api/alerts/payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader("ADMIN", "admin-1"),
        },
        body: JSON.stringify({ failedPayments: 0, pendingPayments: 5 }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.queued).toBe(false);
      expect(data.reason).toBe("threshold");
      expect(paymentAlertMock.create).not.toHaveBeenCalled();
    });

    it("should create alert when failedPayments > 0", async () => {
      paymentAlertMock.findFirst.mockResolvedValueOnce(null);
      paymentAlertMock.create.mockResolvedValueOnce({ id: "alert-1" });

      const response = await app.request("/api/alerts/payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader("ADMIN", "admin-1"),
        },
        body: JSON.stringify({ failedPayments: 1, pendingPayments: 0 }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.queued).toBe(true);
    });

    it("should create alert when pendingPayments > 5", async () => {
      paymentAlertMock.findFirst.mockResolvedValueOnce(null);
      paymentAlertMock.create.mockResolvedValueOnce({ id: "alert-1" });

      const response = await app.request("/api/alerts/payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader("ADMIN", "admin-1"),
        },
        body: JSON.stringify({ failedPayments: 0, pendingPayments: 6 }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.queued).toBe(true);
    });
  });

  describe("Duplicate Detection", () => {
    it("should skip duplicate alerts within 10 minutes", async () => {
      paymentAlertMock.findFirst.mockResolvedValueOnce({
        id: "recent-alert",
        payloadHash: "2-7",
        triggeredAt: new Date(),
      });

      const response = await app.request("/api/alerts/payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader("ADMIN", "admin-1"),
        },
        body: JSON.stringify({ failedPayments: 2, pendingPayments: 7 }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.queued).toBe(false);
      expect(data.reason).toBe("duplicate");
      expect(paymentAlertMock.create).not.toHaveBeenCalled();
    });

    it("should create alert if no recent duplicate exists", async () => {
      paymentAlertMock.findFirst.mockResolvedValueOnce(null);
      paymentAlertMock.create.mockResolvedValueOnce({
        id: "alert-new",
        failedPayments: 3,
        pendingPayments: 8,
      });

      const response = await app.request("/api/alerts/payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader("ADMIN", "admin-1"),
        },
        body: JSON.stringify({ failedPayments: 3, pendingPayments: 8 }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.queued).toBe(true);
    });

    it("should use correct payloadHash for duplicate check", async () => {
      paymentAlertMock.findFirst.mockResolvedValueOnce(null);
      paymentAlertMock.create.mockResolvedValueOnce({ id: "alert-1" });

      await app.request("/api/alerts/payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader("ADMIN", "admin-1"),
        },
        body: JSON.stringify({ failedPayments: 5, pendingPayments: 12 }),
      });

      expect(paymentAlertMock.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            payloadHash: "5-12",
          }),
        }),
      );
    });

    it("should check for duplicates within 10 minutes window", async () => {
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
      paymentAlertMock.findFirst.mockResolvedValueOnce(null);
      paymentAlertMock.create.mockResolvedValueOnce({ id: "alert-1" });

      await app.request("/api/alerts/payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader("ADMIN", "admin-1"),
        },
        body: JSON.stringify({ failedPayments: 1, pendingPayments: 6 }),
      });

      const call = paymentAlertMock.findFirst.mock.calls[0][0];
      const triggeredAtGte = call.where.triggeredAt.gte;

      // Should be approximately 10 minutes ago (with small tolerance)
      expect(triggeredAtGte.getTime()).toBeGreaterThanOrEqual(
        tenMinutesAgo.getTime() - 1000,
      );
      expect(triggeredAtGte.getTime()).toBeLessThanOrEqual(
        tenMinutesAgo.getTime() + 1000,
      );
    });
  });

  describe("Alert Creation", () => {
    it("should create alert with correct data", async () => {
      paymentAlertMock.findFirst.mockResolvedValueOnce(null);
      paymentAlertMock.create.mockResolvedValueOnce({
        id: "alert-1",
        failedPayments: 7,
        pendingPayments: 15,
        payloadHash: "7-15",
      });

      await app.request("/api/alerts/payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader("ADMIN", "admin-1"),
        },
        body: JSON.stringify({ failedPayments: 7, pendingPayments: 15 }),
      });

      expect(paymentAlertMock.create).toHaveBeenCalledWith({
        data: {
          failedPayments: 7,
          pendingPayments: 15,
          payloadHash: "7-15",
        },
      });
    });

    it("should return created alert in response", async () => {
      const mockAlert = {
        id: "alert-123",
        failedPayments: 2,
        pendingPayments: 8,
        payloadHash: "2-8",
        triggeredAt: new Date(),
      };

      paymentAlertMock.findFirst.mockResolvedValueOnce(null);
      paymentAlertMock.create.mockResolvedValueOnce(mockAlert);

      const response = await app.request("/api/alerts/payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader("ADMIN", "admin-1"),
        },
        body: JSON.stringify({ failedPayments: 2, pendingPayments: 8 }),
      });

      const data = await response.json();
      expect(data.queued).toBe(true);
      expect(data.alert.id).toBe("alert-123");
      expect(data.alert.failedPayments).toBe(2);
      expect(data.alert.pendingPayments).toBe(8);
      expect(data.alert.payloadHash).toBe("2-8");
    });
  });

  describe("Slack Integration", () => {
    it("should not send Slack notification when webhook not configured", async () => {
      delete process.env.ALERTS_SLACK_WEBHOOK;

      paymentAlertMock.findFirst.mockResolvedValueOnce(null);
      paymentAlertMock.create.mockResolvedValueOnce({ id: "alert-1" });

      await app.request("/api/alerts/payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader("ADMIN", "admin-1"),
        },
        body: JSON.stringify({ failedPayments: 1, pendingPayments: 6 }),
      });

      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("should send Slack notification when webhook configured", async () => {
      process.env.ALERTS_SLACK_WEBHOOK = "https://hooks.slack.com/test";
      fetchMock.mockResolvedValueOnce({ ok: true } as Response);

      paymentAlertMock.findFirst.mockResolvedValueOnce(null);
      paymentAlertMock.create.mockResolvedValueOnce({ id: "alert-1" });

      await app.request("/api/alerts/payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader("ADMIN", "admin-1"),
        },
        body: JSON.stringify({ failedPayments: 3, pendingPayments: 10 }),
      });

      expect(fetchMock).toHaveBeenCalledWith(
        "https://hooks.slack.com/test",
        expect.objectContaining({
          method: "POST",
          headers: { "content-type": "application/json" },
          body: expect.stringContaining("Failed: 3"),
        }),
      );
    });

    it("should include user email in Slack message", async () => {
      process.env.ALERTS_SLACK_WEBHOOK = "https://hooks.slack.com/test";
      fetchMock.mockResolvedValueOnce({ ok: true } as Response);

      paymentAlertMock.findFirst.mockResolvedValueOnce(null);
      paymentAlertMock.create.mockResolvedValueOnce({ id: "alert-1" });

      await app.request("/api/alerts/payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader("STAFF", "staff-123"),
        },
        body: JSON.stringify({ failedPayments: 2, pendingPayments: 7 }),
      });

      const fetchCall = fetchMock.mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);
      expect(body.text).toContain("staff-123@example.com");
      expect(body.text).toContain("Failed: 2");
      expect(body.text).toContain("Pending: 7");
    });

    it("should handle Slack webhook failure gracefully", async () => {
      process.env.ALERTS_SLACK_WEBHOOK = "https://hooks.slack.com/test";
      fetchMock.mockRejectedValueOnce(new Error("Network error"));

      paymentAlertMock.findFirst.mockResolvedValueOnce(null);
      paymentAlertMock.create.mockResolvedValueOnce({ id: "alert-1" });

      const response = await app.request("/api/alerts/payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader("ADMIN", "admin-1"),
        },
        body: JSON.stringify({ failedPayments: 1, pendingPayments: 6 }),
      });

      // Should still succeed even if Slack fails
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.queued).toBe(true);
    });
  });
});
