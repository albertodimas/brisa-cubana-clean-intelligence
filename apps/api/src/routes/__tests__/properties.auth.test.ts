import { Hono } from "hono";
import jwt from "jsonwebtoken";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "../../lib/db";
import properties from "../properties";

// Mock de db
vi.mock("../../lib/db", () => ({
  db: {
    property: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

// Mock de logger
vi.mock("../../lib/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

const JWT_SECRET = "test-secret";

// Mock token module to use our test secret
vi.mock("../../lib/token", async () => {
  const actual =
    await vi.importActual<typeof import("../../lib/token")>("../../lib/token");
  return {
    ...actual,
    verifyAccessToken: (token: string) => {
      try {
        return jwt.verify(token, JWT_SECRET) as any;
      } catch (error) {
        console.warn("Invalid access token", error);
        return null;
      }
    },
  };
});

describe("Properties Routes - Authorization Tests", () => {
  let app: Hono;

  // Helper para generar tokens JWT
  function generateToken(payload: {
    sub: string;
    email: string;
    role: "CLIENT" | "STAFF" | "ADMIN";
  }): string {
    return jwt.sign(
      {
        sub: payload.sub,
        email: payload.email,
        role: payload.role,
      },
      JWT_SECRET,
      { expiresIn: "1h" },
    );
  }

  beforeEach(() => {
    app = new Hono();

    // Add error handler
    app.onError((err: any, c) => {
      if (err.statusCode) {
        return c.json(
          {
            message: err.message,
            code: err.code,
            details: err.details,
          },
          err.statusCode as any,
        );
      }
      return c.json({ message: "Internal Server Error" }, 500);
    });

    app.route("/properties", properties);
    vi.clearAllMocks();

    // Set JWT secret for tests
    process.env.JWT_SECRET = JWT_SECRET;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("GET /properties - Authorization", () => {
    it("should allow CLIENT to list own properties", async () => {
      const mockProperties = [
        {
          id: "prop-1",
          userId: "user-1",
          name: "My Property",
          address: "123 Main St",
        },
      ];

      vi.mocked(db.property.findMany).mockResolvedValue(mockProperties as any);

      const token = generateToken({
        sub: "user-1",
        email: "user@test.com",
        role: "CLIENT",
      });

      const response = await app.request("/properties", {
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(response.status).toBe(200);
      expect(db.property.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: "user-1" },
        }),
      );
    });

    it("should allow ADMIN to list all properties", async () => {
      const mockProperties = [
        { id: "prop-1", userId: "user-1", name: "Property 1" },
        { id: "prop-2", userId: "user-2", name: "Property 2" },
      ];

      vi.mocked(db.property.findMany).mockResolvedValue(mockProperties as any);

      const token = generateToken({
        sub: "admin-1",
        email: "admin@test.com",
        role: "ADMIN",
      });

      const response = await app.request("/properties", {
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(response.status).toBe(200);
      expect(db.property.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
        }),
      );
    });

    it("should reject unauthenticated requests", async () => {
      const response = await app.request("/properties");

      expect(response.status).toBe(401);
    });
  });

  describe("GET /properties/:id - Authorization", () => {
    const mockProperty = {
      id: "prop-1",
      userId: "user-1",
      name: "My Property",
      address: "123 Main St",
      user: {
        id: "user-1",
        email: "user@test.com",
        name: "User",
      },
      bookings: [],
    };

    it("should allow user to view own property", async () => {
      vi.mocked(db.property.findUnique).mockResolvedValue(mockProperty as any);

      const token = generateToken({
        sub: "user-1",
        email: "user@test.com",
        role: "CLIENT",
      });

      const response = await app.request("/properties/prop-1", {
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.id).toBe("prop-1");
    });

    it("should reject user viewing another user's property", async () => {
      vi.mocked(db.property.findUnique).mockResolvedValue(mockProperty as any);

      const token = generateToken({
        sub: "user-2",
        email: "user2@test.com",
        role: "CLIENT",
      });

      const response = await app.request("/properties/prop-1", {
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toContain("Forbidden");
    });

    it("should allow ADMIN to view any property", async () => {
      vi.mocked(db.property.findUnique).mockResolvedValue(mockProperty as any);

      const token = generateToken({
        sub: "admin-1",
        email: "admin@test.com",
        role: "ADMIN",
      });

      const response = await app.request("/properties/prop-1", {
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.id).toBe("prop-1");
    });

    it("should reject unauthenticated requests", async () => {
      const response = await app.request("/properties/prop-1");

      expect(response.status).toBe(401);
    });
  });

  describe("POST /properties - Authorization", () => {
    it("should allow authenticated user to create property", async () => {
      const mockProperty = {
        id: "prop-1",
        userId: "user-1",
        name: "New Property",
        address: "123 Main St",
        city: "Miami",
        state: "FL",
        zipCode: "33101",
        type: "RESIDENTIAL",
        user: {
          id: "user-1",
          email: "user@test.com",
          name: "User",
        },
      };

      vi.mocked(db.property.create).mockResolvedValue(mockProperty as any);

      const token = generateToken({
        sub: "user-1",
        email: "user@test.com",
        role: "CLIENT",
      });

      const response = await app.request("/properties", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "New Property",
          address: "123 Main St",
          city: "Miami",
          state: "FL",
          zipCode: "33101",
          type: "RESIDENTIAL",
        }),
      });

      expect(response.status).toBe(201);
      expect(db.property.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: "user-1",
          }),
        }),
      );
    });

    it("should reject unauthenticated requests", async () => {
      const response = await app.request("/properties", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "New Property",
          address: "123 Main St",
          city: "Miami",
          state: "FL",
          zipCode: "33101",
          type: "HOUSE",
        }),
      });

      expect(response.status).toBe(401);
    });
  });

  describe("PATCH /properties/:id - Authorization", () => {
    const mockProperty = {
      id: "prop-1",
      userId: "user-1",
      name: "My Property",
    };

    it("should allow user to update own property", async () => {
      vi.mocked(db.property.findUnique).mockResolvedValue(mockProperty as any);
      vi.mocked(db.property.update).mockResolvedValue({
        ...mockProperty,
        name: "Updated Property",
      } as any);

      const token = generateToken({
        sub: "user-1",
        email: "user@test.com",
        role: "CLIENT",
      });

      const response = await app.request("/properties/prop-1", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Updated Property",
        }),
      });

      expect(response.status).toBe(200);
    });

    it("should reject user updating another user's property", async () => {
      vi.mocked(db.property.findUnique).mockResolvedValue(mockProperty as any);

      const token = generateToken({
        sub: "user-2",
        email: "user2@test.com",
        role: "CLIENT",
      });

      const response = await app.request("/properties/prop-1", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Updated Property",
        }),
      });

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toContain("Forbidden");
    });

    it("should allow ADMIN to update any property", async () => {
      vi.mocked(db.property.findUnique).mockResolvedValue(mockProperty as any);
      vi.mocked(db.property.update).mockResolvedValue({
        ...mockProperty,
        name: "Updated Property",
      } as any);

      const token = generateToken({
        sub: "admin-1",
        email: "admin@test.com",
        role: "ADMIN",
      });

      const response = await app.request("/properties/prop-1", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Updated Property",
        }),
      });

      expect(response.status).toBe(200);
    });

    it("should reject unauthenticated requests", async () => {
      const response = await app.request("/properties/prop-1", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Updated Property",
        }),
      });

      expect(response.status).toBe(401);
    });
  });

  describe("DELETE /properties/:id - Authorization", () => {
    const mockProperty = {
      id: "prop-1",
      userId: "user-1",
      name: "My Property",
      _count: {
        bookings: 0,
      },
    };

    it("should allow user to delete own property (no bookings)", async () => {
      vi.mocked(db.property.findUnique).mockResolvedValue(mockProperty as any);
      vi.mocked(db.property.delete).mockResolvedValue(mockProperty as any);

      const token = generateToken({
        sub: "user-1",
        email: "user@test.com",
        role: "CLIENT",
      });

      const response = await app.request("/properties/prop-1", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(response.status).toBe(200);
    });

    it("should reject user deleting another user's property", async () => {
      vi.mocked(db.property.findUnique).mockResolvedValue(mockProperty as any);

      const token = generateToken({
        sub: "user-2",
        email: "user2@test.com",
        role: "CLIENT",
      });

      const response = await app.request("/properties/prop-1", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toContain("Forbidden");
    });

    it("should allow ADMIN to delete any property", async () => {
      vi.mocked(db.property.findUnique).mockResolvedValue(mockProperty as any);
      vi.mocked(db.property.delete).mockResolvedValue(mockProperty as any);

      const token = generateToken({
        sub: "admin-1",
        email: "admin@test.com",
        role: "ADMIN",
      });

      const response = await app.request("/properties/prop-1", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(response.status).toBe(200);
    });

    it("should reject deletion of property with bookings", async () => {
      vi.mocked(db.property.findUnique).mockResolvedValue({
        ...mockProperty,
        _count: { bookings: 5 },
      } as any);

      const token = generateToken({
        sub: "user-1",
        email: "user@test.com",
        role: "CLIENT",
      });

      const response = await app.request("/properties/prop-1", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(response.status).toBe(409);
      const data = await response.json();
      expect(data.error).toContain(
        "Cannot delete property with existing bookings",
      );
    });

    it("should reject unauthenticated requests", async () => {
      const response = await app.request("/properties/prop-1", {
        method: "DELETE",
      });

      expect(response.status).toBe(401);
    });
  });
});
