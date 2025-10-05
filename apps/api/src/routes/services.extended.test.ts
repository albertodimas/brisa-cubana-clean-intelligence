import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import services from "./services";
import { generateAccessToken } from "../lib/token";

// Mock dependencies
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

// Import mocked db after vi.mock
const { db } = await import("../lib/db");
const serviceMock = db.service;

// Helper to build app
function buildApp() {
  const app = new Hono();
  app.route("/api/services", services);
  return app;
}

// Helper to create auth header
const authHeader = (role: "ADMIN" | "STAFF" | "CLIENT", sub: string) => ({
  Authorization: `Bearer ${generateAccessToken({
    sub,
    email: `${sub}@example.com`,
    role,
  })}`,
});

describe("GET /api/services", () => {
  let app: Hono;

  beforeEach(() => {
    vi.clearAllMocks();
    app = buildApp();
  });

  it("should return all active services", async () => {
    serviceMock.findMany.mockResolvedValue([
      {
        id: "service-1",
        name: "Deep Clean",
        description: "Comprehensive deep cleaning service",
        basePrice: 150,
        duration: 180,
        active: true,
        createdAt: new Date("2025-01-01"),
      },
      {
        id: "service-2",
        name: "Standard Clean",
        description: "Regular cleaning service",
        basePrice: 100,
        duration: 120,
        active: true,
        createdAt: new Date("2025-01-02"),
      },
    ]);

    const response = await app.request("/api/services");

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveLength(2);
    expect(data[0].name).toBe("Deep Clean");
    expect(data[1].name).toBe("Standard Clean");
    expect(serviceMock.findMany).toHaveBeenCalledWith({
      where: { active: true },
      orderBy: { basePrice: "asc" },
    });
  });

  it("should return empty array when no active services", async () => {
    serviceMock.findMany.mockResolvedValue([]);

    const response = await app.request("/api/services");

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveLength(0);
  });

  it("should order services by basePrice ascending", async () => {
    serviceMock.findMany.mockResolvedValue([
      {
        id: "service-1",
        name: "Budget Clean",
        basePrice: 50,
        duration: 60,
        active: true,
      },
      {
        id: "service-2",
        name: "Standard Clean",
        basePrice: 100,
        duration: 120,
        active: true,
      },
      {
        id: "service-3",
        name: "Premium Clean",
        basePrice: 200,
        duration: 240,
        active: true,
      },
    ]);

    const response = await app.request("/api/services");

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data[0].basePrice).toBe(50);
    expect(data[1].basePrice).toBe(100);
    expect(data[2].basePrice).toBe(200);
  });
});

describe("GET /api/services/:id", () => {
  let app: Hono;

  beforeEach(() => {
    vi.clearAllMocks();
    app = buildApp();
  });

  it("should return service by ID", async () => {
    serviceMock.findUnique.mockResolvedValue({
      id: "service-1",
      name: "Deep Clean",
      description: "Comprehensive deep cleaning service",
      basePrice: 150,
      duration: 180,
      active: true,
      createdAt: new Date("2025-01-01"),
    });

    const response = await app.request("/api/services/service-1");

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.id).toBe("service-1");
    expect(data.name).toBe("Deep Clean");
    expect(serviceMock.findUnique).toHaveBeenCalledWith({
      where: { id: "service-1" },
    });
  });

  it("should return 404 if service not found", async () => {
    serviceMock.findUnique.mockResolvedValue(null);

    const response = await app.request("/api/services/nonexistent");

    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toBe("Service not found");
  });

  it("should return inactive service by ID", async () => {
    serviceMock.findUnique.mockResolvedValue({
      id: "service-1",
      name: "Discontinued Service",
      basePrice: 100,
      duration: 120,
      active: false,
      createdAt: new Date("2025-01-01"),
    });

    const response = await app.request("/api/services/service-1");

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.active).toBe(false);
  });
});

describe("POST /api/services", () => {
  let app: Hono;

  beforeEach(() => {
    vi.clearAllMocks();
    app = buildApp();
  });

  it("should create service for ADMIN", async () => {
    serviceMock.create.mockResolvedValue({
      id: "new-service",
      name: "New Service",
      description: "A new service",
      basePrice: 120,
      duration: 90,
      active: true,
      createdAt: new Date("2025-01-01"),
    });

    const response = await app.request("/api/services", {
      method: "POST",
      headers: {
        ...authHeader("ADMIN", "admin-1"),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "New Service",
        description: "A new service",
        basePrice: 120,
        duration: 90,
      }),
    });

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.id).toBe("new-service");
    expect(data.name).toBe("New Service");
    expect(serviceMock.create).toHaveBeenCalledWith({
      data: {
        name: "New Service",
        description: "A new service",
        basePrice: 120,
        duration: 90,
        active: true,
      },
    });
  });

  it("should create service with active=false when specified", async () => {
    serviceMock.create.mockResolvedValue({
      id: "new-service",
      name: "Inactive Service",
      basePrice: 100,
      duration: 60,
      active: false,
      createdAt: new Date("2025-01-01"),
    });

    const response = await app.request("/api/services", {
      method: "POST",
      headers: {
        ...authHeader("ADMIN", "admin-1"),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "Inactive Service",
        basePrice: 100,
        duration: 60,
        active: false,
      }),
    });

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.active).toBe(false);
  });

  it("should return 403 for STAFF", async () => {
    const response = await app.request("/api/services", {
      method: "POST",
      headers: {
        ...authHeader("STAFF", "staff-1"),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "New Service",
        basePrice: 100,
        duration: 60,
      }),
    });

    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.error).toBe("Forbidden");
    expect(serviceMock.create).not.toHaveBeenCalled();
  });

  it("should return 403 for CLIENT", async () => {
    const response = await app.request("/api/services", {
      method: "POST",
      headers: {
        ...authHeader("CLIENT", "client-1"),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "New Service",
        basePrice: 100,
        duration: 60,
      }),
    });

    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.error).toBe("Forbidden");
    expect(serviceMock.create).not.toHaveBeenCalled();
  });

  it("should return 401 for unauthenticated request", async () => {
    const response = await app.request("/api/services", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "New Service",
        basePrice: 100,
        duration: 60,
      }),
    });

    expect(response.status).toBe(401);
    expect(serviceMock.create).not.toHaveBeenCalled();
  });

  it("should return 400 for invalid payload", async () => {
    const response = await app.request("/api/services", {
      method: "POST",
      headers: {
        ...authHeader("ADMIN", "admin-1"),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "A", // Too short (min 2 chars)
        basePrice: 100,
        duration: 60,
      }),
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Invalid service payload");
    expect(data.details).toBeDefined();
    expect(serviceMock.create).not.toHaveBeenCalled();
  });

  it("should return 400 for missing required fields", async () => {
    const response = await app.request("/api/services", {
      method: "POST",
      headers: {
        ...authHeader("ADMIN", "admin-1"),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "Service Name",
        // Missing basePrice and duration
      }),
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Invalid service payload");
    expect(data.details).toBeDefined();
    expect(serviceMock.create).not.toHaveBeenCalled();
  });

  it("should return 400 for negative basePrice", async () => {
    const response = await app.request("/api/services", {
      method: "POST",
      headers: {
        ...authHeader("ADMIN", "admin-1"),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "Service Name",
        basePrice: -50,
        duration: 60,
      }),
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Invalid service payload");
    expect(data.details).toBeDefined();
  });

  it("should return 400 for duration less than 30 minutes", async () => {
    const response = await app.request("/api/services", {
      method: "POST",
      headers: {
        ...authHeader("ADMIN", "admin-1"),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "Service Name",
        basePrice: 100,
        duration: 15, // Less than 30
      }),
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Invalid service payload");
    expect(data.details).toBeDefined();
  });
});

describe("PATCH /api/services/:id", () => {
  let app: Hono;

  beforeEach(() => {
    vi.clearAllMocks();
    app = buildApp();
  });

  it("should update service for ADMIN", async () => {
    serviceMock.update.mockResolvedValue({
      id: "service-1",
      name: "Updated Service",
      description: "Updated description",
      basePrice: 150,
      duration: 120,
      active: true,
      createdAt: new Date("2025-01-01"),
    });

    const response = await app.request("/api/services/service-1", {
      method: "PATCH",
      headers: {
        ...authHeader("ADMIN", "admin-1"),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "Updated Service",
        description: "Updated description",
        basePrice: 150,
      }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.name).toBe("Updated Service");
    expect(data.basePrice).toBe(150);
    expect(serviceMock.update).toHaveBeenCalledWith({
      where: { id: "service-1" },
      data: {
        name: "Updated Service",
        description: "Updated description",
        basePrice: 150,
      },
    });
  });

  it("should update only name when only name is provided", async () => {
    serviceMock.update.mockResolvedValue({
      id: "service-1",
      name: "Only Name Updated",
      description: "Original description",
      basePrice: 100,
      duration: 60,
      active: true,
      createdAt: new Date("2025-01-01"),
    });

    const response = await app.request("/api/services/service-1", {
      method: "PATCH",
      headers: {
        ...authHeader("ADMIN", "admin-1"),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "Only Name Updated",
      }),
    });

    expect(response.status).toBe(200);
    expect(serviceMock.update).toHaveBeenCalledWith({
      where: { id: "service-1" },
      data: {
        name: "Only Name Updated",
      },
    });
  });

  it("should update active status to false", async () => {
    serviceMock.update.mockResolvedValue({
      id: "service-1",
      name: "Service",
      basePrice: 100,
      duration: 60,
      active: false,
      createdAt: new Date("2025-01-01"),
    });

    const response = await app.request("/api/services/service-1", {
      method: "PATCH",
      headers: {
        ...authHeader("ADMIN", "admin-1"),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        active: false,
      }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.active).toBe(false);
  });

  it("should update all fields at once", async () => {
    serviceMock.update.mockResolvedValue({
      id: "service-1",
      name: "Completely Updated",
      description: "New description",
      basePrice: 200,
      duration: 180,
      active: false,
      createdAt: new Date("2025-01-01"),
    });

    const response = await app.request("/api/services/service-1", {
      method: "PATCH",
      headers: {
        ...authHeader("ADMIN", "admin-1"),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "Completely Updated",
        description: "New description",
        basePrice: 200,
        duration: 180,
        active: false,
      }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.name).toBe("Completely Updated");
    expect(data.basePrice).toBe(200);
    expect(data.active).toBe(false);
  });

  it("should return 403 for STAFF", async () => {
    const response = await app.request("/api/services/service-1", {
      method: "PATCH",
      headers: {
        ...authHeader("STAFF", "staff-1"),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "Updated Name",
      }),
    });

    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.error).toBe("Forbidden");
    expect(serviceMock.update).not.toHaveBeenCalled();
  });

  it("should return 403 for CLIENT", async () => {
    const response = await app.request("/api/services/service-1", {
      method: "PATCH",
      headers: {
        ...authHeader("CLIENT", "client-1"),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "Updated Name",
      }),
    });

    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.error).toBe("Forbidden");
    expect(serviceMock.update).not.toHaveBeenCalled();
  });

  it("should return 401 for unauthenticated request", async () => {
    const response = await app.request("/api/services/service-1", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "Updated Name",
      }),
    });

    expect(response.status).toBe(401);
    expect(serviceMock.update).not.toHaveBeenCalled();
  });

  it("should return 400 for invalid update payload", async () => {
    const response = await app.request("/api/services/service-1", {
      method: "PATCH",
      headers: {
        ...authHeader("ADMIN", "admin-1"),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        basePrice: -100, // Invalid negative price
      }),
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Invalid service update payload");
    expect(data.details).toBeDefined();
    expect(serviceMock.update).not.toHaveBeenCalled();
  });

  it("should return 400 for empty update payload", async () => {
    const response = await app.request("/api/services/service-1", {
      method: "PATCH",
      headers: {
        ...authHeader("ADMIN", "admin-1"),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Invalid service update payload");
    expect(data.details).toBeDefined();
    expect(serviceMock.update).not.toHaveBeenCalled();
  });
});
