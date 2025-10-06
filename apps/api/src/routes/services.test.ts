import { beforeEach, describe, expect, it, vi } from "vitest";
import { Hono } from "hono";
import { generateAccessToken } from "../lib/token";

// Set environment FIRST
process.env.JWT_SECRET = "test-secret";

// Mock with inline functions
vi.mock("../lib/db", () => ({
  db: {
    service: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

// Import after mocking
const { default: services } = await import("./services");

// Get mock references for assertions
const { db } = await import("../lib/db");
const serviceMock = db.service;

const buildApp = () => {
  const app = new Hono();
  app.route("/api/services", services);
  return app;
};

describe("services route authorization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects creation without token", async () => {
    const app = buildApp();
    const response = await app.request("/api/services", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({}),
    });

    expect(response.status).toBe(401);
    expect(serviceMock.create).not.toHaveBeenCalled();
  });

  it("rejects creation when role is not admin", async () => {
    const app = buildApp();
    const response = await app.request("/api/services", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${generateAccessToken({
          sub: "user-1",
          email: "user@example.com",
          role: "CLIENT",
        })}`,
      },
      body: JSON.stringify({
        name: "Test",
        basePrice: 10,
        duration: 60,
      }),
    });

    expect(response.status).toBe(403);
    expect(serviceMock.create).not.toHaveBeenCalled();
  });

  it("creates service when admin token present", async () => {
    const app = buildApp();
    serviceMock.create.mockResolvedValueOnce({
      id: "service-1",
      name: "Limpieza Premium",
      basePrice: 10,
      duration: 60,
      active: true,
    });

    const response = await app.request("/api/services", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${generateAccessToken({
          sub: "admin-1",
          email: "admin@example.com",
          role: "ADMIN",
        })}`,
      },
      body: JSON.stringify({
        name: "Limpieza Premium",
        description: "Test",
        basePrice: 120,
        duration: 120,
        active: true,
      }),
    });

    expect(response.status).toBe(201);
    expect(serviceMock.create).toHaveBeenCalled();
    const json = (await response.json()) as { name: string };
    expect(json.name).toBe("Limpieza Premium");
  });
});
