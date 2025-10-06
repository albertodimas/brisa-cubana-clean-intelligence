import { beforeEach, describe, expect, it, vi } from "vitest";
import { Hono } from "hono";
import { generateAccessToken } from "../lib/token";

// Set environment FIRST
process.env.JWT_SECRET = "test-secret";

// Mock with inline functions
vi.mock("../lib/db", () => ({
  db: {
    user: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

// Import after mocking
const { default: users } = await import("./users");

// Get mock references for assertions
const { db } = await import("../lib/db");
const userMock = db.user;

const buildApp = () => {
  const app = new Hono();
  app.route("/api/users", users);
  return app;
};

describe("users route authorization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    userMock.findUnique.mockResolvedValue({
      id: "user-1",
      email: "demo@example.com",
      name: "Demo",
      role: "CLIENT",
      phone: null,
      passwordHash: "hash",
      properties: [],
      bookings: [],
    });
  });

  it("requires auth header", async () => {
    const app = buildApp();
    const response = await app.request("/api/users/user-1");
    expect(response.status).toBe(401);
  });

  it("allows user to fetch own profile", async () => {
    const app = buildApp();
    const response = await app.request("/api/users/user-1", {
      headers: {
        Authorization: `Bearer ${generateAccessToken({
          sub: "user-1",
          email: "demo@example.com",
          role: "CLIENT",
        })}`,
      },
    });

    expect(response.status).toBe(200);
    const json = (await response.json()) as { email: string };
    expect(json.email).toBe("demo@example.com");
  });

  it("blocks access when requester is not admin nor owner", async () => {
    const app = buildApp();
    const response = await app.request("/api/users/user-1", {
      headers: {
        Authorization: `Bearer ${generateAccessToken({
          sub: "user-2",
          email: "other@example.com",
          role: "CLIENT",
        })}`,
      },
    });

    expect(response.status).toBe(403);
  });
});
