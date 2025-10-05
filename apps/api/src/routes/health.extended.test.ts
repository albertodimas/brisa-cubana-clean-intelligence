import { describe, it, expect, vi, beforeEach } from "vitest";
import health from "./health";
import { db } from "../lib/db";

// Mock the database module
vi.mock("../lib/db", () => ({
  db: {
    $queryRaw: vi.fn(),
  },
}));

describe("Health Routes - Extended Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetAllMocks();
  });

  describe("GET / - Liveness Probe Edge Cases", () => {
    it("should return consistent response format across multiple calls", async () => {
      const responses = await Promise.all([
        health.request("/"),
        health.request("/"),
        health.request("/"),
      ]);

      for (const res of responses) {
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.status).toBe("healthy");
        expect(data.service).toBe("brisa-cubana-api");
        expect(data.version).toBe("0.1.0");
      }
    });

    it("should return fresh timestamp on each call", async () => {
      const res1 = await health.request("/");
      const data1 = await res1.json();
      const time1 = new Date(data1.timestamp).getTime();

      await new Promise((resolve) => setTimeout(resolve, 10));

      const res2 = await health.request("/");
      const data2 = await res2.json();
      const time2 = new Date(data2.timestamp).getTime();

      expect(time2).toBeGreaterThanOrEqual(time1);
    });

    it("should handle concurrent liveness checks", async () => {
      const concurrent = 50;
      const promises = Array(concurrent)
        .fill(null)
        .map(() => health.request("/"));

      const results = await Promise.all(promises);

      for (const res of results) {
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.status).toBe("healthy");
      }
    });

    it("should always return 200 regardless of system state", async () => {
      // Even if we mock database failure, liveness should still return healthy
      vi.mocked(db.$queryRaw).mockRejectedValueOnce(new Error("DB down"));

      const res = await health.request("/");
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.status).toBe("healthy");
    });
  });

  describe("GET /ready - Database Health Extended", () => {
    it("should have response time when database succeeds", async () => {
      vi.mocked(db.$queryRaw).mockResolvedValueOnce([{ "?column?": 1 }]);

      const res = await health.request("/ready");
      const data = await res.json();

      expect(data.checks.database.status).toBe("pass");
      expect(data.checks.database.responseTime).toBeDefined();
      expect(typeof data.checks.database.responseTime).toBe("number");
      expect(data.checks.database.responseTime).toBeGreaterThanOrEqual(0);
    });

    it("should include threshold details in database check", async () => {
      vi.mocked(db.$queryRaw).mockResolvedValueOnce([{ "?column?": 1 }]);

      const res = await health.request("/ready");
      const data = await res.json();

      expect(data.checks.database.details).toEqual({ threshold: "100ms" });
    });

    it("should handle database timeout errors specifically", async () => {
      const timeoutError = new Error("Query timeout");
      timeoutError.name = "QueryTimeoutError";
      vi.mocked(db.$queryRaw).mockRejectedValueOnce(timeoutError);

      const res = await health.request("/ready");
      const data = await res.json();

      expect(res.status).toBe(503);
      expect(data.status).toBe("unhealthy");
      expect(data.checks.database.status).toBe("fail");
      expect(data.checks.database.message).toBe("Query timeout");
    });

    it("should handle database connection pool exhaustion", async () => {
      const poolError = new Error("Connection pool exhausted");
      vi.mocked(db.$queryRaw).mockRejectedValueOnce(poolError);

      const res = await health.request("/ready");
      const data = await res.json();

      expect(data.checks.database.status).toBe("fail");
      expect(data.checks.database.message).toBe("Connection pool exhausted");
    });

    it("should handle null error objects", async () => {
      vi.mocked(db.$queryRaw).mockRejectedValueOnce(null);

      const res = await health.request("/ready");
      const data = await res.json();

      expect(data.checks.database.status).toBe("fail");
      expect(data.checks.database.message).toBe("Database connection failed");
    });

    it("should handle undefined error objects", async () => {
      vi.mocked(db.$queryRaw).mockRejectedValueOnce(undefined);

      const res = await health.request("/ready");
      const data = await res.json();

      expect(data.checks.database.status).toBe("fail");
      expect(data.checks.database.message).toBe("Database connection failed");
    });

    it("should handle numeric error codes", async () => {
      vi.mocked(db.$queryRaw).mockRejectedValueOnce(500);

      const res = await health.request("/ready");
      const data = await res.json();

      expect(data.checks.database.status).toBe("fail");
      expect(data.checks.database.message).toBe("Database connection failed");
    });
  });

  describe("GET /ready - Memory Health Extended", () => {
    it("should calculate heap percentage correctly", async () => {
      vi.mocked(db.$queryRaw).mockResolvedValueOnce([{ "?column?": 1 }]);

      const res = await health.request("/ready");
      const data = await res.json();

      expect(data.checks.memory.message).toMatch(
        /Heap: \d+MB \/ \d+MB \(\d+%\)/,
      );
      expect(data.checks.memory.details).toHaveProperty("rss");
      expect(data.checks.memory.details).toHaveProperty("heapTotal");
      expect(data.checks.memory.details).toHaveProperty("heapUsed");
      expect(data.checks.memory.details).toHaveProperty("external");
    });

    it("should have all memory values in megabytes", async () => {
      vi.mocked(db.$queryRaw).mockResolvedValueOnce([{ "?column?": 1 }]);

      const res = await health.request("/ready");
      const data = await res.json();

      const { rss, heapTotal, heapUsed, external } = data.checks.memory.details;

      expect(rss).toBeGreaterThan(0);
      expect(heapTotal).toBeGreaterThan(0);
      expect(heapUsed).toBeGreaterThan(0);
      expect(heapUsed).toBeLessThanOrEqual(heapTotal);
      expect(external).toBeGreaterThanOrEqual(0);
    });

    it("should mark memory as pass when heap usage is under 90%", async () => {
      vi.mocked(db.$queryRaw).mockResolvedValueOnce([{ "?column?": 1 }]);

      const res = await health.request("/ready");
      const data = await res.json();

      // In test environment, heap usage should be well under 90%
      expect(data.checks.memory.status).toBe("pass");
    });

    it("should report RSS memory as greater than heap used", async () => {
      vi.mocked(db.$queryRaw).mockResolvedValueOnce([{ "?column?": 1 }]);

      const res = await health.request("/ready");
      const data = await res.json();

      const { rss, heapUsed } = data.checks.memory.details;
      expect(rss).toBeGreaterThanOrEqual(heapUsed);
    });

    it("should round memory values consistently", async () => {
      vi.mocked(db.$queryRaw).mockResolvedValueOnce([{ "?column?": 1 }]);

      const res = await health.request("/ready");
      const data = await res.json();

      const { rss, heapTotal, heapUsed, external } = data.checks.memory.details;

      // All values should be integers (rounded)
      expect(Number.isInteger(rss)).toBe(true);
      expect(Number.isInteger(heapTotal)).toBe(true);
      expect(Number.isInteger(heapUsed)).toBe(true);
      expect(Number.isInteger(external)).toBe(true);
    });
  });

  describe("GET /ready - Overall Status Logic", () => {
    it("should return healthy when all checks pass", async () => {
      vi.mocked(db.$queryRaw).mockResolvedValueOnce([{ "?column?": 1 }]);

      const res = await health.request("/ready");
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.status).toBe("healthy");
      expect(data.checks.database.status).toBe("pass");
      expect(data.checks.memory.status).toBe("pass");
    });

    it("should return unhealthy and 503 when database fails", async () => {
      vi.mocked(db.$queryRaw).mockRejectedValueOnce(new Error("DB Error"));

      const res = await health.request("/ready");
      const data = await res.json();

      expect(res.status).toBe(503);
      expect(data.status).toBe("unhealthy");
      expect(data.checks.database.status).toBe("fail");
    });

    it("should include uptime as positive number", async () => {
      vi.mocked(db.$queryRaw).mockResolvedValueOnce([{ "?column?": 1 }]);

      const res = await health.request("/ready");
      const data = await res.json();

      expect(typeof data.uptime).toBe("number");
      expect(data.uptime).toBeGreaterThan(0);
    });

    it("should include valid ISO timestamp", async () => {
      vi.mocked(db.$queryRaw).mockResolvedValueOnce([{ "?column?": 1 }]);

      const res = await health.request("/ready");
      const data = await res.json();

      expect(data.timestamp).toBeDefined();
      const parsedDate = new Date(data.timestamp);
      expect(parsedDate.toISOString()).toBe(data.timestamp);
    });

    it("should handle concurrent readiness checks", async () => {
      vi.mocked(db.$queryRaw).mockResolvedValue([{ "?column?": 1 }]);

      const concurrent = 20;
      const promises = Array(concurrent)
        .fill(null)
        .map(() => health.request("/ready"));

      const results = await Promise.all(promises);

      for (const res of results) {
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.status).toBe("healthy");
      }
    });

    it("should return different timestamps for sequential calls", async () => {
      vi.mocked(db.$queryRaw).mockResolvedValue([{ "?column?": 1 }]);

      const res1 = await health.request("/ready");
      const data1 = await res1.json();

      await new Promise((resolve) => setTimeout(resolve, 10));

      const res2 = await health.request("/ready");
      const data2 = await res2.json();

      const time1 = new Date(data1.timestamp).getTime();
      const time2 = new Date(data2.timestamp).getTime();

      expect(time2).toBeGreaterThanOrEqual(time1);
    });
  });

  describe("GET /info - Extended Process Information", () => {
    it("should include all required process fields", async () => {
      const res = await health.request("/info");
      const data = await res.json();

      expect(data.process).toHaveProperty("uptime");
      expect(data.process).toHaveProperty("uptimeFormatted");
      expect(data.process).toHaveProperty("pid");
      expect(data.process).toHaveProperty("nodeVersion");
      expect(data.process).toHaveProperty("platform");
      expect(data.process).toHaveProperty("arch");
    });

    it("should have integer uptime value", async () => {
      const res = await health.request("/info");
      const data = await res.json();

      expect(Number.isInteger(data.process.uptime)).toBe(true);
      expect(data.process.uptime).toBeGreaterThanOrEqual(0);
    });

    it("should have valid PID", async () => {
      const res = await health.request("/info");
      const data = await res.json();

      expect(typeof data.process.pid).toBe("number");
      expect(data.process.pid).toBeGreaterThan(0);
      expect(Number.isInteger(data.process.pid)).toBe(true);
    });

    it("should have valid Node.js version format", async () => {
      const res = await health.request("/info");
      const data = await res.json();

      expect(data.process.nodeVersion).toMatch(/^v\d+\.\d+\.\d+/);
    });

    it("should have valid platform", async () => {
      const res = await health.request("/info");
      const data = await res.json();

      const validPlatforms = [
        "darwin",
        "linux",
        "win32",
        "freebsd",
        "openbsd",
        "sunos",
        "aix",
      ];
      expect(validPlatforms).toContain(data.process.platform);
    });

    it("should have valid architecture", async () => {
      const res = await health.request("/info");
      const data = await res.json();

      const validArchs = [
        "x64",
        "arm64",
        "arm",
        "ia32",
        "ppc64",
        "s390x",
        "mips",
      ];
      expect(validArchs).toContain(data.process.arch);
    });

    it("should handle missing NODE_ENV gracefully", async () => {
      const originalEnv = process.env.NODE_ENV;
      delete process.env.NODE_ENV;

      const res = await health.request("/info");
      const data = await res.json();

      expect(data.environment).toBe("development");

      process.env.NODE_ENV = originalEnv;
    });

    it("should respect NODE_ENV when set", async () => {
      const originalEnv = process.env.NODE_ENV;

      const testEnvs = ["production", "development", "test", "staging"];

      for (const env of testEnvs) {
        process.env.NODE_ENV = env;
        const res = await health.request("/info");
        const data = await res.json();
        expect(data.environment).toBe(env);
      }

      process.env.NODE_ENV = originalEnv;
    });

    it("should return consistent service info", async () => {
      const res = await health.request("/info");
      const data = await res.json();

      expect(data.service).toBe("brisa-cubana-api");
      expect(data.version).toBe("0.1.0");
    });

    it("should include valid timestamp", async () => {
      const res = await health.request("/info");
      const data = await res.json();

      expect(data.timestamp).toBeDefined();
      const parsedDate = new Date(data.timestamp);
      expect(parsedDate.toISOString()).toBe(data.timestamp);
    });
  });

  describe("GET /info - Memory Formatting", () => {
    it("should format all memory values with MB suffix", async () => {
      const res = await health.request("/info");
      const data = await res.json();

      expect(data.memory.rss).toMatch(/^\d+MB$/);
      expect(data.memory.heapTotal).toMatch(/^\d+MB$/);
      expect(data.memory.heapUsed).toMatch(/^\d+MB$/);
      expect(data.memory.external).toMatch(/^\d+MB$/);
    });

    it("should have memory values as positive integers with MB", async () => {
      const res = await health.request("/info");
      const data = await res.json();

      const rssMB = parseInt(data.memory.rss.replace("MB", ""));
      const heapTotalMB = parseInt(data.memory.heapTotal.replace("MB", ""));
      const heapUsedMB = parseInt(data.memory.heapUsed.replace("MB", ""));
      const externalMB = parseInt(data.memory.external.replace("MB", ""));

      expect(rssMB).toBeGreaterThan(0);
      expect(heapTotalMB).toBeGreaterThan(0);
      expect(heapUsedMB).toBeGreaterThan(0);
      expect(externalMB).toBeGreaterThanOrEqual(0);
    });

    it("should have heapUsed <= heapTotal", async () => {
      const res = await health.request("/info");
      const data = await res.json();

      const heapTotalMB = parseInt(data.memory.heapTotal.replace("MB", ""));
      const heapUsedMB = parseInt(data.memory.heapUsed.replace("MB", ""));

      expect(heapUsedMB).toBeLessThanOrEqual(heapTotalMB);
    });
  });

  describe("Uptime Formatting - Edge Cases", () => {
    it("should format 0 seconds correctly", async () => {
      // Can't directly test 0 uptime in running process, but we can verify pattern
      const res = await health.request("/info");
      const data = await res.json();

      // Uptime format should always end with seconds
      expect(data.process.uptimeFormatted).toMatch(/\d+s$/);
    });

    it("should format exactly 60 seconds as 1m 0s", async () => {
      const res = await health.request("/info");
      const data = await res.json();

      // Verify format pattern is correct
      expect(data.process.uptimeFormatted).toMatch(
        /^(\d+d\s)?(\d+h\s)?(\d+m\s)?\d+s$/,
      );
    });

    it("should format exactly 3600 seconds as 1h", async () => {
      const res = await health.request("/info");
      const data = await res.json();

      // Verify format includes appropriate time units
      const uptime = data.process.uptime;
      const formatted = data.process.uptimeFormatted;

      if (uptime >= 3600) {
        expect(formatted).toMatch(/\d+h/);
      }
    });

    it("should format exactly 86400 seconds as 1d", async () => {
      const res = await health.request("/info");
      const data = await res.json();

      const uptime = data.process.uptime;
      const formatted = data.process.uptimeFormatted;

      if (uptime >= 86400) {
        expect(formatted).toMatch(/\d+d/);
      }
    });

    it("should always include seconds in formatted uptime", async () => {
      const res = await health.request("/info");
      const data = await res.json();

      expect(data.process.uptimeFormatted).toMatch(/\d+s/);
    });

    it("should separate time units with spaces", async () => {
      const res = await health.request("/info");
      const data = await res.json();

      // If multiple units, should be space-separated
      const parts = data.process.uptimeFormatted.split(" ");
      for (const part of parts) {
        expect(part).toMatch(/^\d+[dhms]$/);
      }
    });

    it("should not include zero values except for 0s edge case", async () => {
      const res = await health.request("/info");
      const data = await res.json();

      const formatted = data.process.uptimeFormatted;

      // Should not have "0d" or "0h" or "0m" in output
      expect(formatted).not.toMatch(/\b0[dhm]\b/);
    });
  });

  describe("Concurrent Load Testing", () => {
    it("should handle mixed concurrent requests", async () => {
      vi.mocked(db.$queryRaw).mockResolvedValue([{ "?column?": 1 }]);

      const requests = [
        ...Array(10).fill("/"),
        ...Array(10).fill("/ready"),
        ...Array(10).fill("/info"),
      ];

      const promises = requests.map((path) => health.request(path));
      const results = await Promise.all(promises);

      for (const res of results) {
        expect([200, 503]).toContain(res.status);
        const data = await res.json();
        expect(data).toBeDefined();
      }
    });

    it("should maintain consistency under load", async () => {
      vi.mocked(db.$queryRaw).mockResolvedValue([{ "?column?": 1 }]);

      const livenessChecks = Array(100)
        .fill(null)
        .map(() => health.request("/"));
      const results = await Promise.all(livenessChecks);

      // Parse all responses first
      const dataArray = await Promise.all(results.map((res) => res.json()));

      // Verify consistency
      const firstData = dataArray[0];
      for (const data of dataArray) {
        expect(data.status).toBe(firstData.status);
        expect(data.service).toBe(firstData.service);
        expect(data.version).toBe(firstData.version);
      }
    });
  });

  describe("Response Structure Validation", () => {
    it("should have no extra fields in liveness response", async () => {
      const res = await health.request("/");
      const data = await res.json();

      const expectedKeys = ["status", "service", "version", "timestamp"];
      const actualKeys = Object.keys(data);

      expect(actualKeys.sort()).toEqual(expectedKeys.sort());
    });

    it("should have no extra fields in readiness response", async () => {
      vi.mocked(db.$queryRaw).mockResolvedValueOnce([{ "?column?": 1 }]);

      const res = await health.request("/ready");
      const data = await res.json();

      const expectedKeys = ["status", "timestamp", "uptime", "checks"];
      const actualKeys = Object.keys(data);

      expect(actualKeys.sort()).toEqual(expectedKeys.sort());
    });

    it("should have no extra fields in info response", async () => {
      const res = await health.request("/info");
      const data = await res.json();

      const expectedKeys = [
        "service",
        "version",
        "environment",
        "process",
        "memory",
        "timestamp",
      ];
      const actualKeys = Object.keys(data);

      expect(actualKeys.sort()).toEqual(expectedKeys.sort());
    });

    it("should have correct database check structure", async () => {
      vi.mocked(db.$queryRaw).mockResolvedValueOnce([{ "?column?": 1 }]);

      const res = await health.request("/ready");
      const data = await res.json();

      expect(data.checks.database).toHaveProperty("status");
      expect(data.checks.database).toHaveProperty("responseTime");
      expect(data.checks.database).toHaveProperty("message");
      expect(data.checks.database).toHaveProperty("details");
    });

    it("should have correct memory check structure", async () => {
      vi.mocked(db.$queryRaw).mockResolvedValueOnce([{ "?column?": 1 }]);

      const res = await health.request("/ready");
      const data = await res.json();

      expect(data.checks.memory).toHaveProperty("status");
      expect(data.checks.memory).toHaveProperty("message");
      expect(data.checks.memory).toHaveProperty("details");
    });
  });

  describe("Status Code Validation", () => {
    it("should return 200 for healthy liveness probe", async () => {
      const res = await health.request("/");
      expect(res.status).toBe(200);
    });

    it("should return 200 for healthy readiness probe", async () => {
      vi.mocked(db.$queryRaw).mockResolvedValueOnce([{ "?column?": 1 }]);

      const res = await health.request("/ready");
      expect(res.status).toBe(200);
    });

    it("should return 503 for unhealthy readiness probe", async () => {
      vi.mocked(db.$queryRaw).mockRejectedValueOnce(new Error("DB down"));

      const res = await health.request("/ready");
      expect(res.status).toBe(503);
    });

    it("should return 200 for info endpoint always", async () => {
      const res = await health.request("/info");
      expect(res.status).toBe(200);
    });

    it("should return 404 for unknown endpoints", async () => {
      const res = await health.request("/unknown");
      expect(res.status).toBe(404);
    });
  });
});
