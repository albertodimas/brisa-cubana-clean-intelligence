// @ts-nocheck
/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/unbound-method */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import { requestLogger, getRequestLogger } from "./logger";
import { logger } from "../lib/logger";

// Mock the logger
vi.mock("../lib/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    child: vi.fn(() => ({
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
    })),
  },
}));

describe("Request Logger Middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("requestLogger", () => {
    it("should log incoming request", async () => {
      const app = new Hono();
      app.use("*", requestLogger);
      app.get("/test", (c) => c.json({ ok: true }));

      await app.request("/test", {
        headers: {
          "user-agent": "test-agent",
          "x-forwarded-for": "192.168.1.1",
        },
      });

      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          method: "GET",
          url: expect.stringContaining("/test"),
          userAgent: "test-agent",
          ip: "192.168.1.1",
          requestId: expect.stringMatching(/^req_/),
        }),
        "Incoming request",
      );
    });

    it("should log successful response", async () => {
      const app = new Hono();
      app.use("*", requestLogger);
      app.get("/test", (c) => c.json({ ok: true }));

      await app.request("/test");

      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          method: "GET",
          url: expect.stringContaining("/test"),
          status: 200,
          duration: expect.stringMatching(/^\d+ms$/),
        }),
        "Request completed",
      );
    });

    it("should handle error response", async () => {
      const app = new Hono();
      app.use("*", requestLogger);
      app.get("/error", () => {
        throw new Error("Test error");
      });
      app.onError((err, c) => c.json({ error: err.message }, 500));

      const res = await app.request("/error");
      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body).toEqual({ error: "Test error" });
    });

    it("should generate request ID", async () => {
      const app = new Hono();
      app.use("*", requestLogger);
      app.get("/test", (c) => {
        const requestId = c.get("requestId");
        return c.json({ requestId });
      });

      const res = await app.request("/test");
      const body = await res.json();

      expect(body.requestId).toMatch(/^req_/);
    });

    it("should use provided x-request-id header", async () => {
      const app = new Hono();
      app.use("*", requestLogger);
      app.get("/test", (c) => {
        const requestId = c.get("requestId");
        return c.json({ requestId });
      });

      const customRequestId = "custom-req-123";
      const res = await app.request("/test", {
        headers: { "x-request-id": customRequestId },
      });
      const body = await res.json();

      expect(body.requestId).toBe(customRequestId);
    });

    it("should handle x-real-ip header", async () => {
      const app = new Hono();
      app.use("*", requestLogger);
      app.get("/test", (c) => c.json({ ok: true }));

      await app.request("/test", {
        headers: { "x-real-ip": "10.0.0.1" },
      });

      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          ip: "10.0.0.1",
        }),
        "Incoming request",
      );
    });

    it("should prefer x-forwarded-for over x-real-ip", async () => {
      const app = new Hono();
      app.use("*", requestLogger);
      app.get("/test", (c) => c.json({ ok: true }));

      await app.request("/test", {
        headers: {
          "x-forwarded-for": "192.168.1.1",
          "x-real-ip": "10.0.0.1",
        },
      });

      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          ip: "192.168.1.1",
        }),
        "Incoming request",
      );
    });

    it("should use 'unknown' when no IP headers present", async () => {
      const app = new Hono();
      app.use("*", requestLogger);
      app.get("/test", (c) => c.json({ ok: true }));

      await app.request("/test");

      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          ip: "unknown",
        }),
        "Incoming request",
      );
    });

    it("should measure request duration", async () => {
      const app = new Hono();
      app.use("*", requestLogger);
      app.get("/slow", async (c) => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return c.json({ ok: true });
      });

      await app.request("/slow");

      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          duration: expect.stringMatching(/^\d+ms$/),
        }),
        "Request completed",
      );
    });

    it("should handle different HTTP methods", async () => {
      const app = new Hono();
      app.use("*", requestLogger);
      app.post("/test", (c) => c.json({ ok: true }));
      app.put("/test", (c) => c.json({ ok: true }));
      app.delete("/test", (c) => c.json({ ok: true }));

      await app.request("/test", { method: "POST" });
      await app.request("/test", { method: "PUT" });
      await app.request("/test", { method: "DELETE" });

      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({ method: "POST" }),
        "Incoming request",
      );
      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({ method: "PUT" }),
        "Incoming request",
      );
      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({ method: "DELETE" }),
        "Incoming request",
      );
    });

    it("should handle different status codes", async () => {
      const app = new Hono();
      app.use("*", requestLogger);
      app.get("/ok", (c) => c.json({ ok: true }, 200));
      app.get("/created", (c) => c.json({ ok: true }, 201));
      app.get("/not-found", (c) => c.json({ error: "Not found" }, 404));

      await app.request("/ok");
      await app.request("/created");
      await app.request("/not-found");

      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({ status: 200 }),
        "Request completed",
      );
      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({ status: 201 }),
        "Request completed",
      );
      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({ status: 404 }),
        "Request completed",
      );
    });
  });

  describe("getRequestLogger", () => {
    it("should return logger with request context", async () => {
      const app = new Hono();
      app.use("*", requestLogger);
      app.get("/test", (c) => {
        const reqLogger = getRequestLogger(c);
        return c.json({ hasLogger: !!reqLogger });
      });

      const res = await app.request("/test");
      const body = await res.json();

      expect(body.hasLogger).toBe(true);
      expect(logger.child).toHaveBeenCalledWith(
        expect.objectContaining({
          requestId: expect.stringMatching(/^req_/),
          path: "/test",
          method: "GET",
        }),
      );
    });

    it("should include custom request ID in child logger", async () => {
      const app = new Hono();
      app.use("*", requestLogger);
      app.get("/test", (c) => {
        getRequestLogger(c);
        return c.json({ ok: true });
      });

      await app.request("/test", {
        headers: { "x-request-id": "custom-123" },
      });

      expect(logger.child).toHaveBeenCalledWith(
        expect.objectContaining({
          requestId: "custom-123",
        }),
      );
    });

    it("should work without request logger middleware", async () => {
      const app = new Hono();
      app.get("/test", (c) => {
        const reqLogger = getRequestLogger(c);
        return c.json({ hasLogger: !!reqLogger });
      });

      const res = await app.request("/test");
      const body = await res.json();

      expect(body.hasLogger).toBe(true);
      expect(logger.child).toHaveBeenCalledWith(
        expect.objectContaining({
          requestId: undefined,
          path: "/test",
          method: "GET",
        }),
      );
    });
  });

  describe("Error handling", () => {
    it("should handle errors and return 500", async () => {
      const app = new Hono();
      app.use("*", requestLogger);
      app.get("/error", () => {
        throw new Error("Test error");
      });
      app.onError((err, c) => {
        return c.json({ error: err.message }, 500);
      });

      const res = await app.request("/error");
      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body).toEqual({ error: "Test error" });
    });

    it("should handle non-Error thrown objects", async () => {
      const app = new Hono();
      app.use("*", requestLogger);
      app.get("/error", () => {
        throw new Error("String-like error");
      });
      app.onError((err, c) => {
        return c.json({ error: err.message }, 500);
      });

      const res = await app.request("/error");
      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body).toEqual({ error: "String-like error" });
    });
  });
});
