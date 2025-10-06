import { describe, expect, it, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import type { Context } from "hono";
import { generateAccessToken } from "../lib/token";
import { isAppError } from "../lib/errors";

// Set environment FIRST
process.env.JWT_SECRET = "test-secret";

// Mock with inline functions
vi.mock("../lib/db", () => ({
  db: {
    property: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
  },
}));

// Import after mocking
const { default: properties } = await import("./properties");

// Get mock references for assertions
const { db } = await import("../lib/db");
const propertyMock = db.property;
const userMock = db.user;

const buildApp = () => {
  const app = new Hono();
  app.route("/api/properties", properties);

  app.onError((err, c: Context) => {
    if (isAppError(err)) {
      return c.json(err.toJSON(), err.statusCode as never);
    }
    return c.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      500,
    );
  });

  return app;
};

const authHeader = (role: "ADMIN" | "STAFF" | "CLIENT", sub: string) => ({
  Authorization: `Bearer ${generateAccessToken({
    sub,
    email: `${sub}@example.com`,
    role,
  })}`,
});

describe("Properties Extended Tests - GET Operations", () => {
  let app: Hono;

  beforeEach(() => {
    vi.clearAllMocks();
    app = buildApp();
  });

  describe("GET / - List Properties", () => {
    it("should return all properties for ADMIN", async () => {
      propertyMock.findMany.mockResolvedValue([
        {
          id: "prop-1",
          name: "Property 1",
          userId: "user-1",
          user: { id: "user-1", email: "user1@example.com", name: "User 1" },
          _count: { bookings: 5 },
        },
        {
          id: "prop-2",
          name: "Property 2",
          userId: "user-2",
          user: { id: "user-2", email: "user2@example.com", name: "User 2" },
          _count: { bookings: 3 },
        },
      ]);

      const response = await app.request("/api/properties", {
        headers: authHeader("ADMIN", "admin-1"),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveLength(2);
      expect(propertyMock.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
        }),
      );
    });

    it("should return only user's properties for CLIENT", async () => {
      propertyMock.findMany.mockResolvedValue([
        {
          id: "prop-1",
          name: "My Property",
          userId: "user-1",
          user: { id: "user-1", email: "user1@example.com", name: "User 1" },
          _count: { bookings: 2 },
        },
      ]);

      const response = await app.request("/api/properties", {
        headers: authHeader("CLIENT", "user-1"),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveLength(1);
      expect(propertyMock.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: "user-1" },
        }),
      );
    });

    it("should include user and booking count in response", async () => {
      propertyMock.findMany.mockResolvedValue([
        {
          id: "prop-1",
          name: "Property 1",
          userId: "user-1",
          user: { id: "user-1", email: "user1@example.com", name: "User 1" },
          _count: { bookings: 10 },
        },
      ]);

      const response = await app.request("/api/properties", {
        headers: authHeader("CLIENT", "user-1"),
      });

      const data = await response.json();
      expect(data[0]).toHaveProperty("user");
      expect(data[0]).toHaveProperty("_count");
      expect(data[0]._count.bookings).toBe(10);
    });

    it("should order by createdAt desc", async () => {
      propertyMock.findMany.mockResolvedValue([]);

      await app.request("/api/properties", {
        headers: authHeader("CLIENT", "user-1"),
      });

      expect(propertyMock.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: "desc" },
        }),
      );
    });
  });

  describe("GET /:id - Get Property by ID", () => {
    it("should return property with details for owner", async () => {
      propertyMock.findUnique.mockResolvedValue({
        id: "prop-1",
        name: "My Property",
        userId: "user-1",
        user: { id: "user-1", email: "user1@example.com", name: "User 1" },
        bookings: [
          {
            id: "booking-1",
            scheduledAt: new Date(),
            service: { id: "svc-1", name: "Cleaning" },
          },
        ],
      });

      const response = await app.request("/api/properties/prop-1", {
        headers: authHeader("CLIENT", "user-1"),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.id).toBe("prop-1");
      expect(data.bookings).toBeDefined();
    });

    it("should return 404 if property not found", async () => {
      propertyMock.findUnique.mockResolvedValue(null);

      const response = await app.request("/api/properties/nonexistent", {
        headers: authHeader("CLIENT", "user-1"),
      });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe("Property not found");
    });

    it("should return 403 if user tries to access another user's property", async () => {
      propertyMock.findUnique.mockResolvedValue({
        id: "prop-1",
        name: "Other Property",
        userId: "user-2",
        user: { id: "user-2", email: "user2@example.com", name: "User 2" },
        bookings: [],
      });

      const response = await app.request("/api/properties/prop-1", {
        headers: authHeader("CLIENT", "user-1"),
      });

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toBe("Forbidden");
    });

    it("should allow ADMIN to view any property", async () => {
      propertyMock.findUnique.mockResolvedValue({
        id: "prop-1",
        name: "Property",
        userId: "user-2",
        user: { id: "user-2", email: "user2@example.com", name: "User 2" },
        bookings: [],
      });

      const response = await app.request("/api/properties/prop-1", {
        headers: authHeader("ADMIN", "admin-1"),
      });

      expect(response.status).toBe(200);
    });

    it("should include last 10 bookings ordered by scheduledAt desc", async () => {
      propertyMock.findUnique.mockResolvedValue({
        id: "prop-1",
        userId: "user-1",
        bookings: [],
      });

      await app.request("/api/properties/prop-1", {
        headers: authHeader("CLIENT", "user-1"),
      });

      expect(propertyMock.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            bookings: expect.objectContaining({
              orderBy: { scheduledAt: "desc" },
              take: 10,
            }),
          }),
        }),
      );
    });
  });
});

describe("Properties Extended Tests - CREATE Operations", () => {
  let app: Hono;

  beforeEach(() => {
    vi.clearAllMocks();
    app = buildApp();
  });

  describe("POST / - Create Property", () => {
    it("should create property with valid data", async () => {
      propertyMock.create.mockResolvedValue({
        id: "new-prop",
        name: "New Property",
        address: "123 Main St",
        city: "Miami",
        state: "FL",
        zipCode: "33101",
        type: "RESIDENTIAL",
        userId: "user-1",
        user: { id: "user-1", email: "user1@example.com", name: "User 1" },
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const response = await app.request("/api/properties", {
        method: "POST",
        headers: {
          ...authHeader("CLIENT", "user-1"),
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
      const data = await response.json();
      expect(data.id).toBe("new-prop");
      expect(data.name).toBe("New Property");
    });

    it("should create property with optional fields", async () => {
      propertyMock.create.mockResolvedValue({
        id: "new-prop",
        name: "House",
        size: 2000,
        bedrooms: 3,
        bathrooms: 2,
        notes: "Nice house",
        userId: "user-1",
        user: { id: "user-1", email: "user1@example.com", name: "User 1" },
      });

      const response = await app.request("/api/properties", {
        method: "POST",
        headers: {
          ...authHeader("CLIENT", "user-1"),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "House",
          address: "456 Oak Ave",
          city: "Tampa",
          state: "FL",
          zipCode: "33602",
          type: "RESIDENTIAL",
          size: 2000,
          bedrooms: 3,
          bathrooms: 2,
          notes: "Nice house",
        }),
      });

      expect(response.status).toBe(201);
      expect(propertyMock.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            size: 2000,
            bedrooms: 3,
            bathrooms: 2,
            notes: "Nice house",
          }),
        }),
      );
    });

    it("should assign property to authenticated user", async () => {
      propertyMock.create.mockResolvedValue({
        id: "new-prop",
        userId: "user-123",
        user: {
          id: "user-123",
          email: "user123@example.com",
          name: "User 123",
        },
      });

      const response = await app.request("/api/properties", {
        method: "POST",
        headers: {
          ...authHeader("CLIENT", "user-123"),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Property",
          address: "789 Pine St",
          city: "Orlando",
          state: "FL",
          zipCode: "32801",
          type: "RESIDENTIAL",
        }),
      });

      expect(response.status).toBe(201);
      expect(propertyMock.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: "user-123",
          }),
        }),
      );
    });

    it("should return 400 for invalid property data", async () => {
      const response = await app.request("/api/properties", {
        method: "POST",
        headers: {
          ...authHeader("CLIENT", "user-1"),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "", // Empty name should fail
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe("Invalid property data");
      expect(data.details).toBeDefined();
    });

    it("should return 400 for missing required fields", async () => {
      const response = await app.request("/api/properties", {
        method: "POST",
        headers: {
          ...authHeader("CLIENT", "user-1"),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Property",
          // Missing address, city, state, zipCode, type
        }),
      });

      expect(response.status).toBe(400);
    });

    it("should handle invalid property type", async () => {
      const response = await app.request("/api/properties", {
        method: "POST",
        headers: {
          ...authHeader("CLIENT", "user-1"),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Property",
          address: "123 Main St",
          city: "Miami",
          state: "FL",
          zipCode: "33101",
          type: "INVALID_TYPE",
        }),
      });

      expect(response.status).toBe(400);
    });
  });
});

describe("Properties Extended Tests - UPDATE Operations", () => {
  let app: Hono;

  beforeEach(() => {
    vi.clearAllMocks();
    app = buildApp();
  });

  describe("PATCH /:id - Update Property", () => {
    it("should update property for owner", async () => {
      propertyMock.findUnique.mockResolvedValue({
        id: "prop-1",
        userId: "user-1",
      });

      propertyMock.update.mockResolvedValue({
        id: "prop-1",
        name: "Updated Property",
        userId: "user-1",
        user: { id: "user-1", email: "user1@example.com", name: "User 1" },
      });

      const response = await app.request("/api/properties/prop-1", {
        method: "PATCH",
        headers: {
          ...authHeader("CLIENT", "user-1"),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Updated Property",
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.name).toBe("Updated Property");
    });

    it("should return 404 if property not found", async () => {
      propertyMock.findUnique.mockResolvedValue(null);

      const response = await app.request("/api/properties/nonexistent", {
        method: "PATCH",
        headers: {
          ...authHeader("CLIENT", "user-1"),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: "Updated" }),
      });

      expect(response.status).toBe(404);
    });

    it("should return 403 if user tries to update another user's property", async () => {
      propertyMock.findUnique.mockResolvedValue({
        id: "prop-1",
        userId: "user-2",
      });

      const response = await app.request("/api/properties/prop-1", {
        method: "PATCH",
        headers: {
          ...authHeader("CLIENT", "user-1"),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: "Updated" }),
      });

      expect(response.status).toBe(403);
    });

    it("should allow ADMIN to update any property", async () => {
      propertyMock.findUnique.mockResolvedValue({
        id: "prop-1",
        userId: "user-2",
      });

      propertyMock.update.mockResolvedValue({
        id: "prop-1",
        name: "Admin Updated",
        userId: "user-2",
      });

      const response = await app.request("/api/properties/prop-1", {
        method: "PATCH",
        headers: {
          ...authHeader("ADMIN", "admin-1"),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: "Admin Updated" }),
      });

      expect(response.status).toBe(200);
    });

    it("should update multiple fields", async () => {
      propertyMock.findUnique.mockResolvedValue({
        id: "prop-1",
        userId: "user-1",
      });

      propertyMock.update.mockResolvedValue({
        id: "prop-1",
        userId: "user-1",
      });

      await app.request("/api/properties/prop-1", {
        method: "PATCH",
        headers: {
          ...authHeader("CLIENT", "user-1"),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "New Name",
          address: "New Address",
          city: "New City",
          bedrooms: 4,
          bathrooms: 3,
          notes: "Updated notes",
        }),
      });

      expect(propertyMock.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: "New Name",
            address: "New Address",
            city: "New City",
            bedrooms: 4,
            bathrooms: 3,
            notes: "Updated notes",
          }),
        }),
      );
    });

    it("should handle partial updates", async () => {
      propertyMock.findUnique.mockResolvedValue({
        id: "prop-1",
        userId: "user-1",
      });

      propertyMock.update.mockResolvedValue({
        id: "prop-1",
        userId: "user-1",
      });

      await app.request("/api/properties/prop-1", {
        method: "PATCH",
        headers: {
          ...authHeader("CLIENT", "user-1"),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          notes: "Just updating notes",
        }),
      });

      expect(propertyMock.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            notes: "Just updating notes",
          }),
        }),
      );
    });

    it("should return 400 for invalid update data", async () => {
      propertyMock.findUnique.mockResolvedValue({
        id: "prop-1",
        userId: "user-1",
      });

      const response = await app.request("/api/properties/prop-1", {
        method: "PATCH",
        headers: {
          ...authHeader("CLIENT", "user-1"),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "INVALID_TYPE",
        }),
      });

      expect(response.status).toBe(400);
    });
  });
});

describe("Properties Extended Tests - DELETE Operations", () => {
  let app: Hono;

  beforeEach(() => {
    vi.clearAllMocks();
    app = buildApp();
  });

  describe("DELETE /:id - Delete Property", () => {
    it("should delete property without bookings", async () => {
      propertyMock.findUnique.mockResolvedValue({
        id: "prop-1",
        userId: "user-1",
        _count: { bookings: 0 },
      });

      propertyMock.delete.mockResolvedValue({
        id: "prop-1",
      });

      const response = await app.request("/api/properties/prop-1", {
        method: "DELETE",
        headers: authHeader("CLIENT", "user-1"),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(propertyMock.delete).toHaveBeenCalledWith({
        where: { id: "prop-1" },
      });
    });

    it("should return 404 if property not found", async () => {
      propertyMock.findUnique.mockResolvedValue(null);

      const response = await app.request("/api/properties/nonexistent", {
        method: "DELETE",
        headers: authHeader("CLIENT", "user-1"),
      });

      expect(response.status).toBe(404);
    });

    it("should return 403 if user tries to delete another user's property", async () => {
      propertyMock.findUnique.mockResolvedValue({
        id: "prop-1",
        userId: "user-2",
        _count: { bookings: 0 },
      });

      const response = await app.request("/api/properties/prop-1", {
        method: "DELETE",
        headers: authHeader("CLIENT", "user-1"),
      });

      expect(response.status).toBe(403);
    });

    it("should allow ADMIN to delete any property", async () => {
      propertyMock.findUnique.mockResolvedValue({
        id: "prop-1",
        userId: "user-2",
        _count: { bookings: 0 },
      });

      propertyMock.delete.mockResolvedValue({ id: "prop-1" });

      const response = await app.request("/api/properties/prop-1", {
        method: "DELETE",
        headers: authHeader("ADMIN", "admin-1"),
      });

      expect(response.status).toBe(200);
    });

    it("should return 409 if property has bookings", async () => {
      propertyMock.findUnique.mockResolvedValue({
        id: "prop-1",
        userId: "user-1",
        _count: { bookings: 5 },
      });

      const response = await app.request("/api/properties/prop-1", {
        method: "DELETE",
        headers: authHeader("CLIENT", "user-1"),
      });

      expect(response.status).toBe(409);
      const data = await response.json();
      expect(data.error).toBe("Cannot delete property with existing bookings");
      expect(data.bookingsCount).toBe(5);
      expect(propertyMock.delete).not.toHaveBeenCalled();
    });

    it("should not delete if property has even 1 booking", async () => {
      propertyMock.findUnique.mockResolvedValue({
        id: "prop-1",
        userId: "user-1",
        _count: { bookings: 1 },
      });

      const response = await app.request("/api/properties/prop-1", {
        method: "DELETE",
        headers: authHeader("CLIENT", "user-1"),
      });

      expect(response.status).toBe(409);
      expect(propertyMock.delete).not.toHaveBeenCalled();
    });
  });
});
