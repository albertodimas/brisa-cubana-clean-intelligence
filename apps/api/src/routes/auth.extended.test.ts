import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Hono } from "hono";

// Mock password verification
const verifyPasswordMock = vi.fn();

// Mock database
const userMock = {
  findUnique: vi.fn(),
};

vi.mock("../lib/db", () => ({
  db: {
    user: userMock,
  },
}));

vi.mock("../lib/password", () => ({
  verifyPassword: verifyPasswordMock,
}));

process.env.JWT_SECRET = "test-secret-extended";

// Import after mocking
const auth = (await import("./auth")).default;

function buildApp() {
  const app = new Hono();
  app.route("/api/auth", auth);
  return app;
}

describe("Auth Routes - Extended Tests", () => {
  let app: Hono;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    app = buildApp();
    originalEnv = { ...process.env };
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("POST /login - Validation", () => {
    it("should return 400 for missing email", async () => {
      const response = await app.request("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password: "password123",
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe("Invalid credentials payload");
      expect(data.details).toBeDefined();
    });

    it("should return 400 for missing password", async () => {
      const response = await app.request("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "test@example.com",
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe("Invalid credentials payload");
    });

    it("should return 400 for invalid email format", async () => {
      const response = await app.request("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "not-an-email",
          password: "password123",
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe("Invalid credentials payload");
      expect(data.details?.email).toBeDefined();
    });

    it("should return 400 for empty password", async () => {
      const response = await app.request("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "test@example.com",
          password: "",
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe("Invalid credentials payload");
    });

    it("should return 400 for malformed JSON", async () => {
      const response = await app.request("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{ invalid json",
      });

      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it("should return 400 for non-object payload", async () => {
      const response = await app.request("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify("string payload"),
      });

      expect(response.status).toBe(400);
    });
  });

  describe("POST /login - Authentication", () => {
    it("should return 401 for non-existent user", async () => {
      userMock.findUnique.mockResolvedValueOnce(null);

      const response = await app.request("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "nonexistent@example.com",
          password: "password123",
        }),
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe("Invalid email or password");
      expect(verifyPasswordMock).not.toHaveBeenCalled();
    });

    it("should return 401 for user without password hash", async () => {
      userMock.findUnique.mockResolvedValueOnce({
        id: "user-1",
        email: "test@example.com",
        name: "Test User",
        role: "CLIENT",
        passwordHash: null,
      });

      const response = await app.request("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "test@example.com",
          password: "password123",
        }),
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe("Invalid email or password");
    });

    it("should return 401 for incorrect password", async () => {
      userMock.findUnique.mockResolvedValueOnce({
        id: "user-1",
        email: "test@example.com",
        name: "Test User",
        role: "CLIENT",
        passwordHash: "hashed-password",
      });

      verifyPasswordMock.mockResolvedValueOnce(false);

      const response = await app.request("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "test@example.com",
          password: "wrongpassword",
        }),
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe("Invalid email or password");
      expect(verifyPasswordMock).toHaveBeenCalledWith(
        "wrongpassword",
        "hashed-password",
      );
    });

    it("should return 200 and token for valid credentials - CLIENT", async () => {
      userMock.findUnique.mockResolvedValueOnce({
        id: "client-1",
        email: "client@example.com",
        name: "Client User",
        phone: "1234567890",
        role: "CLIENT",
        passwordHash: "hashed-password",
      });

      verifyPasswordMock.mockResolvedValueOnce(true);

      const response = await app.request("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "client@example.com",
          password: "correctpassword",
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.id).toBe("client-1");
      expect(data.email).toBe("client@example.com");
      expect(data.name).toBe("Client User");
      expect(data.role).toBe("CLIENT");
      expect(data.token).toBeDefined();
      expect(typeof data.token).toBe("string");
      expect(data.token.length).toBeGreaterThan(0);
    });

    it("should return 200 and token for valid credentials - ADMIN", async () => {
      userMock.findUnique.mockResolvedValueOnce({
        id: "admin-1",
        email: "admin@example.com",
        name: "Admin User",
        role: "ADMIN",
        passwordHash: "hashed-password",
      });

      verifyPasswordMock.mockResolvedValueOnce(true);

      const response = await app.request("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "admin@example.com",
          password: "correctpassword",
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.role).toBe("ADMIN");
      expect(data.token).toBeDefined();
    });

    it("should return 200 and token for valid credentials - STAFF", async () => {
      userMock.findUnique.mockResolvedValueOnce({
        id: "staff-1",
        email: "staff@example.com",
        name: "Staff User",
        role: "STAFF",
        passwordHash: "hashed-password",
      });

      verifyPasswordMock.mockResolvedValueOnce(true);

      const response = await app.request("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "staff@example.com",
          password: "correctpassword",
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.role).toBe("STAFF");
      expect(data.token).toBeDefined();
    });

    it("should not expose password hash in response", async () => {
      userMock.findUnique.mockResolvedValueOnce({
        id: "user-1",
        email: "test@example.com",
        name: "Test User",
        role: "CLIENT",
        passwordHash: "hashed-password",
      });

      verifyPasswordMock.mockResolvedValueOnce(true);

      const response = await app.request("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "test@example.com",
          password: "password123",
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.passwordHash).toBeUndefined();
      expect(data).not.toHaveProperty("passwordHash");
    });
  });

  describe("POST /login - Token Generation", () => {
    it("should generate JWT token with correct payload", async () => {
      userMock.findUnique.mockResolvedValueOnce({
        id: "user-123",
        email: "user@example.com",
        name: "User Name",
        role: "CLIENT",
        passwordHash: "hashed-password",
      });

      verifyPasswordMock.mockResolvedValueOnce(true);

      const response = await app.request("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "user@example.com",
          password: "password123",
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      // JWT should have 3 parts (header.payload.signature)
      const tokenParts = data.token.split(".");
      expect(tokenParts).toHaveLength(3);

      // Decode payload (not verifying signature here, just checking structure)
      const payload = JSON.parse(
        Buffer.from(tokenParts[1], "base64url").toString(),
      );
      expect(payload.sub).toBe("user-123");
      expect(payload.email).toBe("user@example.com");
      expect(payload.role).toBe("CLIENT");
      expect(payload.iat).toBeDefined();
      expect(payload.exp).toBeDefined();
    });

    it("should return all user fields except password in response", async () => {
      userMock.findUnique.mockResolvedValueOnce({
        id: "user-1",
        email: "test@example.com",
        name: "Test User",
        role: "CLIENT",
        passwordHash: "hashed-password",
      });

      verifyPasswordMock.mockResolvedValueOnce(true);

      const response = await app.request("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "test@example.com",
          password: "password123",
        }),
      });

      const data = await response.json();
      expect(data).toMatchObject({
        id: "user-1",
        email: "test@example.com",
        name: "Test User",
        role: "CLIENT",
        token: expect.any(String),
      });
    });
  });

  describe("POST /login - Email Normalization", () => {
    it("should handle email case-sensitivity", async () => {
      userMock.findUnique.mockResolvedValueOnce({
        id: "user-1",
        email: "test@example.com",
        name: "Test User",
        role: "CLIENT",
        passwordHash: "hashed-password",
      });

      verifyPasswordMock.mockResolvedValueOnce(true);

      const response = await app.request("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "Test@Example.com",
          password: "password123",
        }),
      });

      // The database query uses the exact email provided
      expect(userMock.findUnique).toHaveBeenCalledWith({
        where: { email: "Test@Example.com" },
      });
    });

    it("should handle whitespace in email", async () => {
      const response = await app.request("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: " test@example.com ",
          password: "password123",
        }),
      });

      // Whitespace should make email invalid
      expect(response.status).toBe(400);
    });
  });

  describe("POST /login - Security", () => {
    it("should use same error message for invalid user and wrong password", async () => {
      // Test 1: Non-existent user
      userMock.findUnique.mockResolvedValueOnce(null);

      const response1 = await app.request("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "nonexistent@example.com",
          password: "password123",
        }),
      });

      const data1 = await response1.json();

      // Test 2: Wrong password
      userMock.findUnique.mockResolvedValueOnce({
        id: "user-1",
        email: "test@example.com",
        passwordHash: "hashed",
      });
      verifyPasswordMock.mockResolvedValueOnce(false);

      const response2 = await app.request("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "test@example.com",
          password: "wrongpassword",
        }),
      });

      const data2 = await response2.json();

      // Both should return same error to prevent user enumeration
      expect(response1.status).toBe(401);
      expect(response2.status).toBe(401);
      expect(data1.error).toBe(data2.error);
      expect(data1.error).toBe("Invalid email or password");
    });

    it("should not leak user existence through error messages", async () => {
      userMock.findUnique.mockResolvedValueOnce(null);

      const response = await app.request("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "unknown@example.com",
          password: "password123",
        }),
      });

      const data = await response.json();
      expect(data.error).not.toContain("user");
      expect(data.error).not.toContain("not found");
      expect(data.error).toBe("Invalid email or password");
    });
  });

  describe("POST /login - Database Interaction", () => {
    it("should query database with correct email", async () => {
      userMock.findUnique.mockResolvedValueOnce({
        id: "user-1",
        email: "specific@example.com",
        passwordHash: "hash",
      });

      verifyPasswordMock.mockResolvedValueOnce(true);

      await app.request("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "specific@example.com",
          password: "password123",
        }),
      });

      expect(userMock.findUnique).toHaveBeenCalledWith({
        where: { email: "specific@example.com" },
      });
    });

    it("should only call verifyPassword if user exists", async () => {
      userMock.findUnique.mockResolvedValueOnce(null);

      await app.request("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "nonexistent@example.com",
          password: "password123",
        }),
      });

      expect(verifyPasswordMock).not.toHaveBeenCalled();
    });

    it("should call verifyPassword with correct arguments", async () => {
      userMock.findUnique.mockResolvedValueOnce({
        id: "user-1",
        email: "test@example.com",
        passwordHash: "stored-hash-123",
      });

      verifyPasswordMock.mockResolvedValueOnce(true);

      await app.request("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "test@example.com",
          password: "plain-password",
        }),
      });

      expect(verifyPasswordMock).toHaveBeenCalledWith(
        "plain-password",
        "stored-hash-123",
      );
    });
  });
});
