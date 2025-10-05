import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import users from "./users";
import { generateAccessToken } from "../lib/token";

// Mock dependencies
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

vi.mock("../lib/password", () => ({
  hashPassword: vi.fn((password: string) =>
    Promise.resolve(`hashed_${password}`),
  ),
}));

// Import mocked db after vi.mock
const { db } = await import("../lib/db");
const userMock = db.user;

// Helper to build app
function buildApp() {
  const app = new Hono();
  app.route("/api/users", users);
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

describe("GET /api/users", () => {
  let app: Hono;

  beforeEach(() => {
    vi.clearAllMocks();
    app = buildApp();
  });

  it("should return all users for ADMIN", async () => {
    userMock.findMany.mockResolvedValue([
      {
        id: "user-1",
        email: "user1@example.com",
        name: "User 1",
        phone: "+1234567890",
        role: "CLIENT",
        createdAt: new Date("2025-01-01"),
        _count: { bookings: 5, properties: 2 },
      },
      {
        id: "user-2",
        email: "user2@example.com",
        name: "User 2",
        phone: "+1234567891",
        role: "STAFF",
        createdAt: new Date("2025-01-02"),
        _count: { bookings: 0, properties: 0 },
      },
    ]);

    const response = await app.request("/api/users", {
      headers: authHeader("ADMIN", "admin-1"),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveLength(2);
    expect(data[0].id).toBe("user-1");
    expect(data[0].email).toBe("user1@example.com");
    expect(data[0]._count.bookings).toBe(5);
    expect(userMock.findMany).toHaveBeenCalledWith({
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            bookings: true,
            properties: true,
          },
        },
      },
    });
  });

  it("should return all users for STAFF", async () => {
    userMock.findMany.mockResolvedValue([
      {
        id: "user-1",
        email: "user1@example.com",
        name: "User 1",
        phone: "+1234567890",
        role: "CLIENT",
        createdAt: new Date("2025-01-01"),
        _count: { bookings: 3, properties: 1 },
      },
    ]);

    const response = await app.request("/api/users", {
      headers: authHeader("STAFF", "staff-1"),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveLength(1);
    expect(userMock.findMany).toHaveBeenCalled();
  });

  it("should return 403 for CLIENT", async () => {
    const response = await app.request("/api/users", {
      headers: authHeader("CLIENT", "client-1"),
    });

    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.error).toBe("Forbidden");
    expect(userMock.findMany).not.toHaveBeenCalled();
  });

  it("should return 401 for unauthenticated request", async () => {
    const response = await app.request("/api/users");

    expect(response.status).toBe(401);
    expect(userMock.findMany).not.toHaveBeenCalled();
  });
});

describe("GET /api/users/:id", () => {
  let app: Hono;

  beforeEach(() => {
    vi.clearAllMocks();
    app = buildApp();
  });

  it("should return user by ID for ADMIN", async () => {
    userMock.findUnique.mockResolvedValue({
      id: "user-1",
      email: "user1@example.com",
      name: "User 1",
      phone: "+1234567890",
      role: "CLIENT",
      createdAt: new Date("2025-01-01"),
      passwordHash: "hashed_password",
      properties: [
        { id: "prop-1", name: "Property 1", address: "123 Main St" },
      ],
      bookings: [
        {
          id: "booking-1",
          scheduledAt: new Date("2025-02-01"),
          service: { id: "service-1", name: "Deep Clean" },
          property: { id: "prop-1", name: "Property 1" },
        },
      ],
    });

    const response = await app.request("/api/users/user-1", {
      headers: authHeader("ADMIN", "admin-1"),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.id).toBe("user-1");
    expect(data.email).toBe("user1@example.com");
    expect(data.properties).toHaveLength(1);
    expect(data.bookings).toHaveLength(1);
    expect(data.passwordHash).toBeUndefined(); // Should be sanitized
    expect(userMock.findUnique).toHaveBeenCalledWith({
      where: { id: "user-1" },
      include: {
        properties: true,
        bookings: {
          include: {
            service: true,
            property: true,
          },
          orderBy: { scheduledAt: "desc" },
          take: 10,
        },
      },
    });
  });

  it("should return user by ID for STAFF", async () => {
    userMock.findUnique.mockResolvedValue({
      id: "user-1",
      email: "user1@example.com",
      name: "User 1",
      phone: "+1234567890",
      role: "CLIENT",
      createdAt: new Date("2025-01-01"),
      passwordHash: "hashed_password",
      properties: [],
      bookings: [],
    });

    const response = await app.request("/api/users/user-1", {
      headers: authHeader("STAFF", "staff-1"),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.id).toBe("user-1");
    expect(data.passwordHash).toBeUndefined();
  });

  it("should allow CLIENT to view own profile", async () => {
    userMock.findUnique.mockResolvedValue({
      id: "client-1",
      email: "client@example.com",
      name: "Client User",
      phone: "+1234567890",
      role: "CLIENT",
      createdAt: new Date("2025-01-01"),
      passwordHash: "hashed_password",
      properties: [],
      bookings: [],
    });

    const response = await app.request("/api/users/client-1", {
      headers: authHeader("CLIENT", "client-1"),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.id).toBe("client-1");
    expect(data.passwordHash).toBeUndefined();
  });

  it("should return 403 for CLIENT viewing other user", async () => {
    const response = await app.request("/api/users/other-user", {
      headers: authHeader("CLIENT", "client-1"),
    });

    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.error).toBe("Forbidden");
    expect(userMock.findUnique).not.toHaveBeenCalled();
  });

  it("should return 404 if user not found", async () => {
    userMock.findUnique.mockResolvedValue(null);

    const response = await app.request("/api/users/nonexistent", {
      headers: authHeader("ADMIN", "admin-1"),
    });

    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toBe("User not found");
  });

  it("should return 401 for unauthenticated request", async () => {
    const response = await app.request("/api/users/user-1");

    expect(response.status).toBe(401);
    expect(userMock.findUnique).not.toHaveBeenCalled();
  });
});

describe("POST /api/users", () => {
  let app: Hono;

  beforeEach(() => {
    vi.clearAllMocks();
    app = buildApp();
  });

  it("should create user for ADMIN", async () => {
    userMock.findUnique.mockResolvedValue(null);
    userMock.create.mockResolvedValue({
      id: "new-user",
      email: "newuser@example.com",
      name: "New User",
      phone: "+1234567890",
      role: "CLIENT",
      createdAt: new Date("2025-01-01"),
      passwordHash: "hashed_password123",
    });

    const response = await app.request("/api/users", {
      method: "POST",
      headers: {
        ...authHeader("ADMIN", "admin-1"),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "newuser@example.com",
        name: "New User",
        phone: "+1234567890",
        password: "password123",
        role: "CLIENT",
      }),
    });

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.id).toBe("new-user");
    expect(data.email).toBe("newuser@example.com");
    expect(data.passwordHash).toBeUndefined(); // Should be sanitized
    expect(userMock.create).toHaveBeenCalledWith({
      data: {
        email: "newuser@example.com",
        name: "New User",
        phone: "+1234567890",
        role: "CLIENT",
        passwordHash: "hashed_password123",
      },
    });
  });

  it("should create user with default CLIENT role if not provided", async () => {
    userMock.findUnique.mockResolvedValue(null);
    userMock.create.mockResolvedValue({
      id: "new-user",
      email: "newuser@example.com",
      name: "New User",
      phone: "+1234567890",
      role: "CLIENT",
      createdAt: new Date("2025-01-01"),
      passwordHash: "hashed_password123",
    });

    const response = await app.request("/api/users", {
      method: "POST",
      headers: {
        ...authHeader("ADMIN", "admin-1"),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "newuser@example.com",
        name: "New User",
        phone: "+1234567890",
        password: "password123",
      }),
    });

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.role).toBe("CLIENT");
  });

  it("should return 403 for STAFF", async () => {
    const response = await app.request("/api/users", {
      method: "POST",
      headers: {
        ...authHeader("STAFF", "staff-1"),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "newuser@example.com",
        name: "New User",
        phone: "+1234567890",
        password: "password123",
      }),
    });

    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.error).toBe("Forbidden");
    expect(userMock.create).not.toHaveBeenCalled();
  });

  it("should return 403 for CLIENT", async () => {
    const response = await app.request("/api/users", {
      method: "POST",
      headers: {
        ...authHeader("CLIENT", "client-1"),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "newuser@example.com",
        name: "New User",
        phone: "+1234567890",
        password: "password123",
      }),
    });

    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.error).toBe("Forbidden");
    expect(userMock.create).not.toHaveBeenCalled();
  });

  it("should return 400 if email already exists", async () => {
    userMock.findUnique.mockResolvedValue({
      id: "existing-user",
      email: "existing@example.com",
      name: "Existing User",
      phone: "+1234567890",
      role: "CLIENT",
      createdAt: new Date("2025-01-01"),
      passwordHash: "hashed_password",
    });

    const response = await app.request("/api/users", {
      method: "POST",
      headers: {
        ...authHeader("ADMIN", "admin-1"),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "existing@example.com",
        name: "New User",
        phone: "+1234567890",
        password: "password123",
      }),
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Email already exists");
    expect(userMock.create).not.toHaveBeenCalled();
  });

  it("should return 400 for invalid email", async () => {
    const response = await app.request("/api/users", {
      method: "POST",
      headers: {
        ...authHeader("ADMIN", "admin-1"),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "invalid-email",
        name: "New User",
        phone: "+1234567890",
        password: "password123",
      }),
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Invalid user payload");
    expect(data.details).toBeDefined();
    expect(userMock.create).not.toHaveBeenCalled();
  });

  it("should return 400 for missing required fields", async () => {
    const response = await app.request("/api/users", {
      method: "POST",
      headers: {
        ...authHeader("ADMIN", "admin-1"),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "test@example.com",
      }),
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Invalid user payload");
    expect(data.details).toBeDefined();
    expect(userMock.create).not.toHaveBeenCalled();
  });
});

describe("PATCH /api/users/:id", () => {
  let app: Hono;

  beforeEach(() => {
    vi.clearAllMocks();
    app = buildApp();
  });

  it("should allow ADMIN to update any user", async () => {
    userMock.update.mockResolvedValue({
      id: "user-1",
      email: "user1@example.com",
      name: "Updated Name",
      phone: "+9876543210",
      role: "STAFF",
      createdAt: new Date("2025-01-01"),
      passwordHash: "hashed_password",
    });

    const response = await app.request("/api/users/user-1", {
      method: "PATCH",
      headers: {
        ...authHeader("ADMIN", "admin-1"),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "Updated Name",
        phone: "+9876543210",
        role: "STAFF",
      }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.name).toBe("Updated Name");
    expect(data.phone).toBe("+9876543210");
    expect(data.role).toBe("STAFF");
    expect(data.passwordHash).toBeUndefined();
    expect(userMock.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: {
        name: "Updated Name",
        phone: "+9876543210",
        role: "STAFF",
      },
    });
  });

  it("should allow CLIENT to update own profile (name and phone only)", async () => {
    userMock.update.mockResolvedValue({
      id: "client-1",
      email: "client@example.com",
      name: "Updated Client Name",
      phone: "+9876543210",
      role: "CLIENT",
      createdAt: new Date("2025-01-01"),
      passwordHash: "hashed_password",
    });

    const response = await app.request("/api/users/client-1", {
      method: "PATCH",
      headers: {
        ...authHeader("CLIENT", "client-1"),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "Updated Client Name",
        phone: "+9876543210",
      }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.name).toBe("Updated Client Name");
    expect(data.phone).toBe("+9876543210");
    expect(data.role).toBe("CLIENT");
  });

  it("should return 403 for CLIENT updating other user", async () => {
    const response = await app.request("/api/users/other-user", {
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
    expect(userMock.update).not.toHaveBeenCalled();
  });

  it("should return 400 for empty update payload", async () => {
    const response = await app.request("/api/users/user-1", {
      method: "PATCH",
      headers: {
        ...authHeader("ADMIN", "admin-1"),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Invalid user update payload");
    expect(data.details).toBeDefined();
    expect(userMock.update).not.toHaveBeenCalled();
  });

  it("should return 400 for invalid update payload", async () => {
    const response = await app.request("/api/users/user-1", {
      method: "PATCH",
      headers: {
        ...authHeader("ADMIN", "admin-1"),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        role: "INVALID_ROLE",
      }),
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Invalid user update payload");
    expect(data.details).toBeDefined();
    expect(userMock.update).not.toHaveBeenCalled();
  });

  it("should update only name when only name is provided", async () => {
    userMock.update.mockResolvedValue({
      id: "user-1",
      email: "user1@example.com",
      name: "Only Name Updated",
      phone: "+1234567890",
      role: "CLIENT",
      createdAt: new Date("2025-01-01"),
      passwordHash: "hashed_password",
    });

    const response = await app.request("/api/users/user-1", {
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
    expect(userMock.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: {
        name: "Only Name Updated",
      },
    });
  });

  it("should return 401 for unauthenticated request", async () => {
    const response = await app.request("/api/users/user-1", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "Updated Name",
      }),
    });

    expect(response.status).toBe(401);
    expect(userMock.update).not.toHaveBeenCalled();
  });
});

describe("PATCH /api/users/:id/password", () => {
  let app: Hono;

  beforeEach(() => {
    vi.clearAllMocks();
    app = buildApp();
  });

  it("should allow ADMIN to change any user password", async () => {
    userMock.update.mockResolvedValue({
      id: "user-1",
      email: "user1@example.com",
      name: "User 1",
      phone: "+1234567890",
      role: "CLIENT",
      createdAt: new Date("2025-01-01"),
      passwordHash: "hashed_newpassword",
    });

    const response = await app.request("/api/users/user-1/password", {
      method: "PATCH",
      headers: {
        ...authHeader("ADMIN", "admin-1"),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        password: "newpassword",
      }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.ok).toBe(true);
    expect(userMock.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { passwordHash: "hashed_newpassword" },
    });
  });

  it("should allow CLIENT to change own password", async () => {
    userMock.update.mockResolvedValue({
      id: "client-1",
      email: "client@example.com",
      name: "Client User",
      phone: "+1234567890",
      role: "CLIENT",
      createdAt: new Date("2025-01-01"),
      passwordHash: "hashed_newpassword",
    });

    const response = await app.request("/api/users/client-1/password", {
      method: "PATCH",
      headers: {
        ...authHeader("CLIENT", "client-1"),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        password: "newpassword",
      }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.ok).toBe(true);
  });

  it("should return 403 for CLIENT changing other user password", async () => {
    const response = await app.request("/api/users/other-user/password", {
      method: "PATCH",
      headers: {
        ...authHeader("CLIENT", "client-1"),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        password: "newpassword",
      }),
    });

    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.error).toBe("Forbidden");
    expect(userMock.update).not.toHaveBeenCalled();
  });

  it("should return 400 for invalid password payload", async () => {
    const response = await app.request("/api/users/user-1/password", {
      method: "PATCH",
      headers: {
        ...authHeader("ADMIN", "admin-1"),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        wrongField: "value",
      }),
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Invalid user password payload");
    expect(data.details).toBeDefined();
    expect(userMock.update).not.toHaveBeenCalled();
  });

  it("should return 401 for unauthenticated request", async () => {
    const response = await app.request("/api/users/user-1/password", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        password: "newpassword",
      }),
    });

    expect(response.status).toBe(401);
    expect(userMock.update).not.toHaveBeenCalled();
  });
});
