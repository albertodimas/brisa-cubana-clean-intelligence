import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { Hono } from "hono";
import {
  rateLimiter,
  userKeyGenerator,
  clearRateLimitStore,
  cleanupRateLimitStore,
} from "./rate-limit";

describe("Rate Limiting Extended Tests", () => {
  beforeEach(() => {
    process.env.ENABLE_RATE_LIMITING = "true";
    clearRateLimitStore();
  });

  afterEach(() => {
    clearRateLimitStore();
    delete process.env.ENABLE_RATE_LIMITING;
  });

  describe("Custom Key Generators", () => {
    it("should use x-forwarded-for header when available", async () => {
      const app = new Hono();
      app.use("/test", rateLimiter({ windowMs: 1000, max: 2 }));
      app.get("/test", (c) => c.json({ success: true }));

      const res1 = await app.request("/test", {
        headers: { "x-forwarded-for": "192.168.1.1, 10.0.0.1" },
      });
      const res2 = await app.request("/test", {
        headers: { "x-forwarded-for": "192.168.1.1, 10.0.0.1" },
      });
      const res3 = await app.request("/test", {
        headers: { "x-forwarded-for": "192.168.1.1, 10.0.0.1" },
      });

      expect(res1.status).toBe(200);
      expect(res2.status).toBe(200);
      expect(res3.status).toBe(429); // Rate limited for same IP
    });

    it("should use x-real-ip header when x-forwarded-for is not available", async () => {
      const app = new Hono();
      app.use("/test", rateLimiter({ windowMs: 1000, max: 2 }));
      app.get("/test", (c) => c.json({ success: true }));

      const res1 = await app.request("/test", {
        headers: { "x-real-ip": "192.168.1.2" },
      });
      const res2 = await app.request("/test", {
        headers: { "x-real-ip": "192.168.1.2" },
      });
      const res3 = await app.request("/test", {
        headers: { "x-real-ip": "192.168.1.2" },
      });

      expect(res1.status).toBe(200);
      expect(res2.status).toBe(200);
      expect(res3.status).toBe(429);
    });

    it("should use custom keyGenerator", async () => {
      const customKeyGen = vi.fn((c) => {
        const apiKey = c.req.header("x-api-key");
        return apiKey || "default";
      });

      const app = new Hono();
      app.use(
        "/test",
        rateLimiter({ windowMs: 1000, max: 2, keyGenerator: customKeyGen }),
      );
      app.get("/test", (c) => c.json({ success: true }));

      await app.request("/test", {
        headers: { "x-api-key": "key-123" },
      });
      await app.request("/test", {
        headers: { "x-api-key": "key-123" },
      });
      const res3 = await app.request("/test", {
        headers: { "x-api-key": "key-123" },
      });

      expect(customKeyGen).toHaveBeenCalled();
      expect(res3.status).toBe(429);
    });

    it("should use userKeyGenerator for authenticated users", async () => {
      const app = new Hono();

      // Simulate auth middleware
      app.use("/test", async (c, next) => {
        c.set("user", { sub: "user-123" });
        await next();
      });

      app.use(
        "/test",
        rateLimiter({ windowMs: 1000, max: 2, keyGenerator: userKeyGenerator }),
      );
      app.get("/test", (c) => c.json({ success: true }));

      const res1 = await app.request("/test");
      const res2 = await app.request("/test");
      const res3 = await app.request("/test");

      expect(res1.status).toBe(200);
      expect(res2.status).toBe(200);
      expect(res3.status).toBe(429);
    });

    it("should fallback to IP when user is not authenticated", async () => {
      const app = new Hono();

      app.use(
        "/test",
        rateLimiter({ windowMs: 1000, max: 2, keyGenerator: userKeyGenerator }),
      );
      app.get("/test", (c) => c.json({ success: true }));

      const res1 = await app.request("/test");
      const res2 = await app.request("/test");
      const res3 = await app.request("/test");

      expect(res1.status).toBe(200);
      expect(res2.status).toBe(200);
      expect(res3.status).toBe(429);
    });
  });

  describe("Skip Options", () => {
    it("should skip successful requests when configured", async () => {
      const app = new Hono();
      app.use(
        "/test",
        rateLimiter({ windowMs: 1000, max: 2, skipSuccessfulRequests: true }),
      );
      app.get("/test", (c) => {
        const fail = c.req.query("fail");
        if (fail) {
          return c.json({ error: "Failed" }, 500);
        }
        return c.json({ success: true });
      });

      // Successful requests don't count
      await app.request("/test");
      await app.request("/test");
      await app.request("/test");

      // Failed requests do count
      const res1 = await app.request("/test?fail=1");
      const res2 = await app.request("/test?fail=1");
      const res3 = await app.request("/test?fail=1");

      expect(res1.status).toBe(500);
      expect(res2.status).toBe(500);
      expect(res3.status).toBe(429); // Rate limited
    });

    it("should skip failed requests when configured", async () => {
      const app = new Hono();
      app.use(
        "/test",
        rateLimiter({ windowMs: 1000, max: 2, skipFailedRequests: true }),
      );
      app.get("/test", (c) => {
        const fail = c.req.query("fail");
        if (fail) {
          return c.json({ error: "Failed" }, 500);
        }
        return c.json({ success: true });
      });

      // Failed requests don't count
      await app.request("/test?fail=1");
      await app.request("/test?fail=1");
      await app.request("/test?fail=1");

      // Successful requests do count
      const res1 = await app.request("/test");
      const res2 = await app.request("/test");
      const res3 = await app.request("/test");

      expect(res1.status).toBe(200);
      expect(res2.status).toBe(200);
      expect(res3.status).toBe(429); // Rate limited
    });
  });

  describe("Cleanup and Maintenance", () => {
    it("should cleanup expired records", async () => {
      const app = new Hono();
      app.use("/test", rateLimiter({ windowMs: 100, max: 2 }));
      app.get("/test", (c) => c.json({ success: true }));

      // Make requests to populate store
      await app.request("/test");
      await app.request("/test");

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Cleanup
      cleanupRateLimitStore();

      // Should allow new requests (store was cleaned)
      const res = await app.request("/test");
      expect(res.status).toBe(200);
    });
  });

  describe("Environment Configuration", () => {
    it("should disable rate limiting when ENABLE_RATE_LIMITING is false", async () => {
      process.env.ENABLE_RATE_LIMITING = "false";

      const app = new Hono();
      app.use("/test", rateLimiter({ windowMs: 1000, max: 1 }));
      app.get("/test", (c) => c.json({ success: true }));

      const res1 = await app.request("/test");
      const res2 = await app.request("/test");
      const res3 = await app.request("/test");

      expect(res1.status).toBe(200);
      expect(res2.status).toBe(200);
      expect(res3.status).toBe(200); // Not rate limited
    });

    it("should disable rate limiting in test env by default", async () => {
      delete process.env.ENABLE_RATE_LIMITING;
      process.env.NODE_ENV = "test";

      const app = new Hono();
      app.use("/test", rateLimiter({ windowMs: 1000, max: 1 }));
      app.get("/test", (c) => c.json({ success: true }));

      const res1 = await app.request("/test");
      const res2 = await app.request("/test");

      expect(res1.status).toBe(200);
      expect(res2.status).toBe(200); // Not rate limited
    });
  });

  describe("Custom Messages", () => {
    it("should use custom error message", async () => {
      const app = new Hono();
      app.use(
        "/test",
        rateLimiter({
          windowMs: 1000,
          max: 1,
          message: "Custom rate limit message",
        }),
      );
      app.get("/test", (c) => c.json({ success: true }));

      await app.request("/test");
      const rateLimitedResponse = await app.request("/test");

      expect(rateLimitedResponse.status).toBe(429);
      const body = (await rateLimitedResponse.json()) as { error: string };
      expect(body.error).toBe("Custom rate limit message");
    });
  });

  describe("Header Management", () => {
    it("should update X-RateLimit-Remaining on each request", async () => {
      const app = new Hono();
      app.use("/test", rateLimiter({ windowMs: 1000, max: 3 }));
      app.get("/test", (c) => c.json({ success: true }));

      const res1 = await app.request("/test");
      const res2 = await app.request("/test");
      const res3 = await app.request("/test");

      expect(res1.headers.get("X-RateLimit-Remaining")).toBe("2");
      expect(res2.headers.get("X-RateLimit-Remaining")).toBe("1");
      expect(res3.headers.get("X-RateLimit-Remaining")).toBe("0");
    });

    it("should include X-RateLimit-Reset header", async () => {
      const app = new Hono();
      app.use("/test", rateLimiter({ windowMs: 1000, max: 3 }));
      app.get("/test", (c) => c.json({ success: true }));

      const res = await app.request("/test");
      const resetHeader = res.headers.get("X-RateLimit-Reset");

      expect(resetHeader).toBeTruthy();
      expect(new Date(resetHeader!).getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe("Edge Cases", () => {
    it("should handle concurrent requests correctly", async () => {
      const app = new Hono();
      app.use("/test", rateLimiter({ windowMs: 1000, max: 3 }));
      app.get("/test", (c) => c.json({ success: true }));

      const requests = [
        app.request("/test"),
        app.request("/test"),
        app.request("/test"),
        app.request("/test"),
      ];

      const responses = await Promise.all(requests);
      const statusCodes = responses.map((r) => r.status);

      // Exactly 3 should succeed, 1 should be rate limited
      const successCount = statusCodes.filter((s) => s === 200).length;
      const rateLimitedCount = statusCodes.filter((s) => s === 429).length;

      expect(successCount).toBe(3);
      expect(rateLimitedCount).toBe(1);
    });

    it("should handle zero max limit", async () => {
      const app = new Hono();
      app.use("/test", rateLimiter({ windowMs: 1000, max: 0 }));
      app.get("/test", (c) => c.json({ success: true }));

      const res = await app.request("/test");
      expect(res.status).toBe(429); // Immediately rate limited
    });
  });
});
