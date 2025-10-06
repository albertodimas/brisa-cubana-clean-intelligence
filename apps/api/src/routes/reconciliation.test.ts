import { beforeEach, describe, expect, it, vi } from "vitest";
import { Hono } from "hono";
import { generateAccessToken } from "../lib/token";

// Set environment FIRST
process.env.JWT_SECRET = "test-secret";

// Mock with inline functions
vi.mock("../lib/db", () => ({
  db: {
    reconciliationNote: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

// Import after mocking
const { default: notes } = await import("./reconciliation");

// Get mock references for assertions
const { db } = await import("../lib/db");
const noteMock = db.reconciliationNote;

const buildApp = () => {
  const app = new Hono();
  app.route("/api/reconciliation", notes);
  return app;
};

const authHeader = (role: "ADMIN" | "STAFF", sub: string) => ({
  Authorization: `Bearer ${generateAccessToken({
    sub,
    email: `${sub}@example.com`,
    role,
  })}`,
});

describe("reconciliation notes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects list without auth", async () => {
    const app = buildApp();
    const response = await app.request("/api/reconciliation/booking/booking-1");
    expect(response.status).toBe(401);
  });

  it("returns notes for staff", async () => {
    const app = buildApp();
    noteMock.findMany.mockResolvedValueOnce([]);
    const response = await app.request(
      "/api/reconciliation/booking/booking-1",
      {
        headers: authHeader("STAFF", "staff-1"),
      },
    );
    expect(response.status).toBe(200);
    expect(noteMock.findMany).toHaveBeenCalled();
  });

  it("creates note", async () => {
    const app = buildApp();
    noteMock.create.mockResolvedValueOnce({
      id: "note-1",
      message: "Revisar transferencia",
      author: { id: "staff-1", email: "staff@example.com", name: "Staff" },
    });

    const response = await app.request(
      "/api/reconciliation/booking/booking-1",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...authHeader("ADMIN", "admin-1"),
        },
        body: JSON.stringify({ message: "Revisar transferencia" }),
      },
    );

    expect(response.status).toBe(201);
    const json = (await response.json()) as { message: string };
    expect(json.message).toBe("Revisar transferencia");
  });

  it("updates note status", async () => {
    const app = buildApp();
    noteMock.update.mockResolvedValueOnce({
      id: "note-1",
      status: "RESOLVED",
      message: "Resuelta",
      author: { id: "staff-1", email: "staff@example.com", name: "Staff" },
      resolvedBy: { id: "staff-1", email: "staff@example.com", name: "Staff" },
    });

    const response = await app.request("/api/reconciliation/note/note-1", {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
        ...authHeader("ADMIN", "admin-1"),
      },
      body: JSON.stringify({ status: "RESOLVED" }),
    });

    expect(response.status).toBe(200);
    const json = (await response.json()) as { status: string };
    expect(json.status).toBe("RESOLVED");
  });

  it("fetches resolved history with filters", async () => {
    const app = buildApp();
    noteMock.findMany.mockResolvedValueOnce([]);
    const response = await app.request(
      "/api/reconciliation/history/resolved?startDate=2025-01-01",
      {
        headers: authHeader("ADMIN", "admin-1"),
      },
    );

    expect(response.status).toBe(200);
    expect(noteMock.findMany).toHaveBeenCalled();
  });

  it("fetches open history", async () => {
    const app = buildApp();
    noteMock.findMany.mockResolvedValueOnce([]);
    const response = await app.request(
      "/api/reconciliation/history/open?authorEmail=test@example.com",
      {
        headers: authHeader("STAFF", "staff-1"),
      },
    );

    expect(response.status).toBe(200);
    expect(noteMock.findMany).toHaveBeenCalled();
  });
});
