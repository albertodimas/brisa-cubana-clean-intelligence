import { describe, it, expect, vi, beforeEach } from "vitest";
import health from "./health";
import { db } from "../lib/db";

// Mock the database module
vi.mock("../lib/db", () => ({
  db: {
    $queryRaw: vi.fn(),
  },
}));

describe("Health Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /", () => {
    it("should return healthy status", async () => {
      const res = await health.request("/");
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data).toMatchObject({
        status: "healthy",
        service: "brisa-cubana-api",
        version: "0.1.0",
      });
      expect(data.timestamp).toBeDefined();
      expect(new Date(data.timestamp).getTime()).toBeGreaterThan(0);
    });

    it("should include valid ISO timestamp", async () => {
      const res = await health.request("/");
      const data = await res.json();

      // Verify timestamp is valid ISO 8601
      expect(() => new Date(data.timestamp)).not.toThrow();
      const timestamp = new Date(data.timestamp);
      expect(timestamp.toISOString()).toBe(data.timestamp);
    });
  });

  describe("GET /ready", () => {
    it("should return healthy when database is responsive", async () => {
      // Mock fast database response
      vi.mocked(db.$queryRaw).mockResolvedValueOnce([{ "?column?": 1 }]);

      const res = await health.request("/ready");
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.status).toBe("healthy");
      expect(data.checks.database.status).toBe("pass");
      expect(data.checks.memory.status).toBe("pass");
      expect(data.uptime).toBeGreaterThan(0);
    });

    it("should return unhealthy when database fails", async () => {
      // Mock database error
      vi.mocked(db.$queryRaw).mockRejectedValueOnce(
        new Error("Connection refused"),
      );

      const res = await health.request("/ready");
      expect(res.status).toBe(503);

      const data = await res.json();
      expect(data.status).toBe("unhealthy");
      expect(data.checks.database.status).toBe("fail");
      expect(data.checks.database.message).toBe("Connection refused");
    });

    it("should return unhealthy when database is slow", async () => {
      // Mock slow database response (>100ms)
      vi.mocked(db.$queryRaw).mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve([{ "?column?": 1 }]), 150);
          }),
      );

      const res = await health.request("/ready");
      const data = await res.json();

      expect(data.checks.database.status).toBe("fail");
      expect(data.checks.database.message).toBe("Slow response");
      expect(data.checks.database.responseTime).toBeGreaterThan(100);
    });

    it("should include database response time", async () => {
      vi.mocked(db.$queryRaw).mockResolvedValueOnce([{ "?column?": 1 }]);

      const res = await health.request("/ready");
      const data = await res.json();

      expect(data.checks.database.responseTime).toBeDefined();
      expect(typeof data.checks.database.responseTime).toBe("number");
      expect(data.checks.database.responseTime).toBeGreaterThanOrEqual(0);
    });

    it("should include memory usage details", async () => {
      vi.mocked(db.$queryRaw).mockResolvedValueOnce([{ "?column?": 1 }]);

      const res = await health.request("/ready");
      const data = await res.json();

      expect(data.checks.memory.status).toBe("pass");
      expect(data.checks.memory.details).toBeDefined();
      expect(data.checks.memory.details.rss).toBeGreaterThan(0);
      expect(data.checks.memory.details.heapTotal).toBeGreaterThan(0);
      expect(data.checks.memory.details.heapUsed).toBeGreaterThan(0);
    });

    it("should handle non-Error database failures", async () => {
      // Mock database throwing non-Error object
      vi.mocked(db.$queryRaw).mockRejectedValueOnce("String error");

      const res = await health.request("/ready");
      const data = await res.json();

      expect(data.checks.database.status).toBe("fail");
      expect(data.checks.database.message).toBe("Database connection failed");
    });

    it("should include uptime in response", async () => {
      vi.mocked(db.$queryRaw).mockResolvedValueOnce([{ "?column?": 1 }]);

      const res = await health.request("/ready");
      const data = await res.json();

      expect(data.uptime).toBeDefined();
      expect(typeof data.uptime).toBe("number");
      expect(data.uptime).toBeGreaterThan(0);
    });

    it("should include timestamp in ISO format", async () => {
      vi.mocked(db.$queryRaw).mockResolvedValueOnce([{ "?column?": 1 }]);

      const res = await health.request("/ready");
      const data = await res.json();

      expect(data.timestamp).toBeDefined();
      expect(() => new Date(data.timestamp)).not.toThrow();
    });
  });

  describe("GET /info", () => {
    it("should return service information", async () => {
      const res = await health.request("/info");
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data).toMatchObject({
        service: "brisa-cubana-api",
        version: "0.1.0",
      });
      expect(data.process).toBeDefined();
      expect(data.memory).toBeDefined();
      expect(data.timestamp).toBeDefined();
    });

    it("should include process information", async () => {
      const res = await health.request("/info");
      const data = await res.json();

      expect(data.process.uptime).toBeGreaterThanOrEqual(0);
      expect(data.process.uptimeFormatted).toBeDefined();
      expect(data.process.pid).toBe(process.pid);
      expect(data.process.nodeVersion).toBe(process.version);
      expect(data.process.platform).toBe(process.platform);
      expect(data.process.arch).toBe(process.arch);
    });

    it("should include memory information", async () => {
      const res = await health.request("/info");
      const data = await res.json();

      expect(data.memory.rss).toMatch(/^\d+MB$/);
      expect(data.memory.heapTotal).toMatch(/^\d+MB$/);
      expect(data.memory.heapUsed).toMatch(/^\d+MB$/);
      expect(data.memory.external).toMatch(/^\d+MB$/);
    });

    it("should format uptime correctly for seconds only", async () => {
      const res = await health.request("/info");
      const data = await res.json();

      // Uptime should be formatted (e.g., "5s", "1m 30s", "1h 5m 30s")
      expect(data.process.uptimeFormatted).toMatch(/^\d+[dhms](\s\d+[dhms])*$/);
    });

    it("should include environment", async () => {
      const originalEnv = process.env.NODE_ENV;

      // Test with NODE_ENV set
      process.env.NODE_ENV = "test";
      const res1 = await health.request("/info");
      const data1 = await res1.json();
      expect(data1.environment).toBe("test");

      // Test with NODE_ENV unset
      delete process.env.NODE_ENV;
      const res2 = await health.request("/info");
      const data2 = await res2.json();
      expect(data2.environment).toBe("development");

      // Restore original
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe("Uptime formatting", () => {
    it("should format uptime with days, hours, minutes, seconds", async () => {
      const res = await health.request("/info");
      const data = await res.json();

      const uptimeSeconds = data.process.uptime;
      const formatted = data.process.uptimeFormatted;

      // Should contain time units
      if (uptimeSeconds >= 86400) {
        expect(formatted).toMatch(/\d+d/);
      }
      if (uptimeSeconds >= 3600) {
        expect(formatted).toMatch(/\d+h/);
      }
      if (uptimeSeconds >= 60) {
        expect(formatted).toMatch(/\d+m/);
      }
      expect(formatted).toMatch(/\d+s/);
    });
  });

  describe("Error handling", () => {
    it("should handle missing database gracefully", async () => {
      vi.mocked(db.$queryRaw).mockRejectedValueOnce(
        new Error("Database not available"),
      );

      const res = await health.request("/ready");
      expect(res.status).toBe(503);

      const data = await res.json();
      expect(data.status).toBe("unhealthy");
      expect(data.checks.database.status).toBe("fail");
    });

    it("should return 503 for unhealthy status", async () => {
      vi.mocked(db.$queryRaw).mockRejectedValueOnce(new Error("DB Error"));

      const res = await health.request("/ready");
      expect(res.status).toBe(503);
    });
  });
});
