import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Hono } from "hono";
import {
  rateLimiter,
  clearRateLimitStore,
  RateLimits,
  userKeyGenerator,
} from "../../middleware/rate-limit";

// Mock Redis client
vi.mock("../../lib/redis", () => ({
  getRedisClient: vi.fn(() => null), // Force memory-based rate limiting
}));

// Mock logger to avoid console spam
vi.mock("../../lib/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

describe("Rate Limiter", () => {
  let app: Hono;

  beforeEach(() => {
    app = new Hono();
    clearRateLimitStore();
    // Enable rate limiting for tests
    process.env.ENABLE_RATE_LIMITING = "true";
  });

  afterEach(() => {
    clearRateLimitStore();
    delete process.env.ENABLE_RATE_LIMITING;
  });

  describe("Basic rate limiting", () => {
    it("should allow requests within limit", async () => {
      app.use("*", rateLimiter({ windowMs: 60000, max: 3 }));
      app.get("/test", (c) => c.json({ success: true }));

      const res1 = await app.request("/test");
      const res2 = await app.request("/test");
      const res3 = await app.request("/test");

      expect(res1.status).toBe(200);
      expect(res2.status).toBe(200);
      expect(res3.status).toBe(200);
    });

    it("should block requests exceeding limit", async () => {
      app.use("*", rateLimiter({ windowMs: 60000, max: 3 }));
      app.get("/test", (c) => c.json({ success: true }));

      await app.request("/test");
      await app.request("/test");
      await app.request("/test");
      const res4 = await app.request("/test");

      expect(res4.status).toBe(429);
      const body = await res4.json();
      expect(body.error).toContain("Too many requests");
      expect(body.retryAfter).toBeGreaterThan(0);
    });

    it("should include rate limit headers", async () => {
      app.use("*", rateLimiter({ windowMs: 60000, max: 5 }));
      app.get("/test", (c) => c.json({ success: true }));

      const res = await app.request("/test");

      expect(res.headers.get("X-RateLimit-Limit")).toBe("5");
      expect(res.headers.get("X-RateLimit-Remaining")).toBe("4");
      expect(res.headers.get("X-RateLimit-Reset")).toBeTruthy();
    });

    it("should include Retry-After header when limit exceeded", async () => {
      app.use("*", rateLimiter({ windowMs: 60000, max: 2 }));
      app.get("/test", (c) => c.json({ success: true }));

      await app.request("/test");
      await app.request("/test");
      const res3 = await app.request("/test");

      expect(res3.status).toBe(429);
      expect(res3.headers.get("Retry-After")).toBeTruthy();
      const retryAfter = parseInt(res3.headers.get("Retry-After") || "0");
      expect(retryAfter).toBeGreaterThan(0);
    });
  });

  describe("Custom messages and options", () => {
    it("should use custom error message", async () => {
      app.use(
        "*",
        rateLimiter({
          windowMs: 60000,
          max: 1,
          message: "Custom rate limit message",
        }),
      );
      app.get("/test", (c) => c.json({ success: true }));

      await app.request("/test");
      const res = await app.request("/test");

      expect(res.status).toBe(429);
      const body = await res.json();
      expect(body.error).toBe("Custom rate limit message");
    });

    it("should support custom key generator", async () => {
      const customKeyGen = (c: any) => c.req.header("X-User-ID") || "default";

      app.use(
        "*",
        rateLimiter({
          windowMs: 60000,
          max: 2,
          keyGenerator: customKeyGen,
        }),
      );
      app.get("/test", (c) => c.json({ success: true }));

      // User 1 can make 2 requests
      await app.request("/test", {
        headers: { "X-User-ID": "user-1" },
      });
      await app.request("/test", {
        headers: { "X-User-ID": "user-1" },
      });
      const res1 = await app.request("/test", {
        headers: { "X-User-ID": "user-1" },
      });

      // User 2 can also make 2 requests (independent limit)
      await app.request("/test", {
        headers: { "X-User-ID": "user-2" },
      });
      const res2 = await app.request("/test", {
        headers: { "X-User-ID": "user-2" },
      });

      expect(res1.status).toBe(429); // User 1 exceeded
      expect(res2.status).toBe(200); // User 2 still within limit
    });
  });

  describe("Predefined rate limits", () => {
    it("should apply auth rate limit (strict)", async () => {
      app.use("/auth/login", rateLimiter(RateLimits.auth));
      app.post("/auth/login", (c) => c.json({ error: "Unauthorized" }, 401));

      // Auth limit is 3 requests per 15 minutes
      // skipSuccessfulRequests: true means only failed requests count
      const res1 = await app.request("/auth/login", { method: "POST" });
      const res2 = await app.request("/auth/login", { method: "POST" });
      const res3 = await app.request("/auth/login", { method: "POST" });
      const res4 = await app.request("/auth/login", { method: "POST" });

      expect(res1.status).toBe(401);
      expect(res2.status).toBe(401);
      expect(res3.status).toBe(401);
      expect(res4.status).toBe(429); // Rate limit exceeded
    });

    it("should apply write rate limit", async () => {
      app.use("/api/write", rateLimiter(RateLimits.write));
      app.post("/api/write", (c) => c.json({ success: true }));

      // Write limit is 20 requests per 15 minutes
      let lastRes;
      for (let i = 0; i < 21; i++) {
        lastRes = await app.request("/api/write", { method: "POST" });
      }

      expect(lastRes?.status).toBe(429);
    });
  });

  describe("User key generator", () => {
    it("should use user ID from context when available", () => {
      const mockContext: any = {
        get: vi.fn((key: string) => {
          if (key === "user") return { sub: "user-123" };
          return undefined;
        }),
        req: {
          header: vi.fn(() => null),
        },
      };

      const key = userKeyGenerator(mockContext);

      expect(key).toBe("user:user-123");
    });

    it("should fallback to IP when user not available", () => {
      const mockContext: any = {
        get: vi.fn(() => undefined),
        req: {
          header: vi.fn((name: string) => {
            if (name === "x-forwarded-for") return "192.168.1.1";
            return null;
          }),
        },
      };

      const key = userKeyGenerator(mockContext);

      expect(key).toBe("192.168.1.1");
    });
  });

  describe("Rate limiter bypass", () => {
    it("should bypass rate limiting when disabled", async () => {
      process.env.ENABLE_RATE_LIMITING = "false";

      app.use("*", rateLimiter({ windowMs: 60000, max: 1 }));
      app.get("/test", (c) => c.json({ success: true }));

      // Should allow unlimited requests when disabled
      const res1 = await app.request("/test");
      const res2 = await app.request("/test");
      const res3 = await app.request("/test");

      expect(res1.status).toBe(200);
      expect(res2.status).toBe(200);
      expect(res3.status).toBe(200);
    });
  });
});
