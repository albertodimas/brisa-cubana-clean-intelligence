import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { Hono } from "hono";
import { rateLimiter, RateLimits, clearRateLimitStore } from "./rate-limit";

describe("Rate Limiting Middleware", () => {
  let app: Hono;

  beforeEach(() => {
    process.env.ENABLE_RATE_LIMITING = "true";
    // Clear rate limit store before each test
    clearRateLimitStore();

    app = new Hono();
    app.use("/test", rateLimiter({ windowMs: 1000, max: 3 }));
    app.get("/test", (c) => c.json({ success: true }));
  });

  afterEach(() => {
    // Clean up after each test
    clearRateLimitStore();
    delete process.env.ENABLE_RATE_LIMITING;
  });

  it("should allow requests within rate limit", async () => {
    const req1 = new Request("http://localhost/test");
    const req2 = new Request("http://localhost/test");
    const req3 = new Request("http://localhost/test");

    const res1 = await app.request(req1);
    const res2 = await app.request(req2);
    const res3 = await app.request(req3);

    expect(res1.status).toBe(200);
    expect(res2.status).toBe(200);
    expect(res3.status).toBe(200);
  });

  it("should block requests exceeding rate limit", async () => {
    // Make requests sequentially to avoid race conditions
    const res1 = await app.request(new Request("http://localhost/test"));
    const res2 = await app.request(new Request("http://localhost/test"));
    const res3 = await app.request(new Request("http://localhost/test"));
    const res4 = await app.request(new Request("http://localhost/test"));

    expect(res1.status).toBe(200);
    expect(res2.status).toBe(200);
    expect(res3.status).toBe(200);
    expect(res4.status).toBe(429); // Too Many Requests
  });

  it("should include rate limit headers", async () => {
    const req = new Request("http://localhost/test");
    const res = await app.request(req);

    expect(res.headers.get("X-RateLimit-Limit")).toBe("3");
    expect(res.headers.get("X-RateLimit-Remaining")).toBeTruthy();
    expect(res.headers.get("X-RateLimit-Reset")).toBeTruthy();
  });

  it("should return Retry-After header when rate limited", async () => {
    // Make requests sequentially to avoid race conditions
    await app.request(new Request("http://localhost/test"));
    await app.request(new Request("http://localhost/test"));
    await app.request(new Request("http://localhost/test"));
    const rateLimitedResponse = await app.request(
      new Request("http://localhost/test"),
    );

    expect(rateLimitedResponse.status).toBe(429);
    expect(rateLimitedResponse.headers.get("Retry-After")).toBeTruthy();

    const body = (await rateLimitedResponse.json()) as {
      error: string;
      retryAfter: number;
    };
    expect(body).toHaveProperty("error");
    expect(body).toHaveProperty("retryAfter");
  });

  it("should reset limit after window expires", async () => {
    const app2 = new Hono();
    app2.use("/test", rateLimiter({ windowMs: 100, max: 2 }));
    app2.get("/test", (c) => c.json({ success: true }));

    // Make 2 requests (hits limit)
    await app2.request(new Request("http://localhost/test"));
    await app2.request(new Request("http://localhost/test"));

    // Third request should fail
    const res1 = await app2.request(new Request("http://localhost/test"));
    expect(res1.status).toBe(429);

    // Wait for window to expire
    await new Promise((resolve) => setTimeout(resolve, 150));

    // Should succeed again
    const res2 = await app2.request(new Request("http://localhost/test"));
    expect(res2.status).toBe(200);
  });

  describe("Predefined Rate Limits", () => {
    it("should have auth rate limit configured", () => {
      const auth: Record<string, unknown> = RateLimits.auth;
      expect(auth).toMatchObject({
        windowMs: 15 * 60 * 1000,
        max: 5,
        message: expect.stringContaining("login"),
        skipSuccessfulRequests: true,
      });
    });

    it("should have API rate limit configured", () => {
      const api: Record<string, unknown> = RateLimits.api;
      expect(api).toMatchObject({
        windowMs: 15 * 60 * 1000,
        max: 100,
      });
    });

    it("should have write rate limit configured", () => {
      const write: Record<string, unknown> = RateLimits.write;
      expect(write).toMatchObject({
        windowMs: 15 * 60 * 1000,
        max: 20,
        message: expect.stringContaining("write"),
      });
    });

    it("should have read rate limit configured", () => {
      const read: Record<string, unknown> = RateLimits.read;
      expect(read).toMatchObject({
        windowMs: 15 * 60 * 1000,
        max: 300,
      });
    });
  });
});
