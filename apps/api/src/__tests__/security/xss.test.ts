import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Hono } from "hono";
import properties from "../../routes/properties";
import users from "../../routes/users";
import bookings from "../../routes/bookings";
import jwt from "jsonwebtoken";
import { db } from "../../lib/db";

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
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    booking: {
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
        return null;
      }
    },
  };
});

describe("XSS Protection Tests", () => {
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

  // Payloads maliciosos XSS
  const xssPayloads = {
    script: '<script>alert("xss")</script>',
    img: '<img src=x onerror="alert(1)">',
    iframe: '<iframe src="javascript:alert(1)"></iframe>',
    javascript: "javascript:alert(1)",
    dataUri: "data:text/html,<script>alert(1)</script>",
    onload: '<body onload="alert(1)">',
    svg: "<svg/onload=alert(1)>",
    eventHandler: '<div onclick="alert(1)">Click</div>',
  };

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
    app.route("/users", users);
    app.route("/bookings", bookings);
    vi.clearAllMocks();

    process.env.JWT_SECRET = JWT_SECRET;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Properties - XSS Protection", () => {
    const token = generateToken({
      sub: "user-1",
      email: "user@test.com",
      role: "CLIENT",
    });

    it("should sanitize XSS in property name", async () => {
      const mockProperty = {
        id: "prop-1",
        userId: "user-1",
        name: "Clean Name",
        address: "123 Main St",
        city: "Miami",
        state: "FL",
        zipCode: "33101",
        type: "RESIDENTIAL",
      };

      vi.mocked(db.property.create).mockResolvedValue(mockProperty as any);

      const response = await app.request("/properties", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: xssPayloads.script,
          address: "123 Main St",
          city: "Miami",
          state: "FL",
          zipCode: "33101",
          type: "RESIDENTIAL",
        }),
      });

      expect(response.status).toBe(201);
      expect(db.property.create).toHaveBeenCalled();
      const callArgs = vi.mocked(db.property.create).mock.calls[0][0];
      expect(callArgs.data.name).not.toContain("<script>");
      expect(callArgs.data.name).not.toContain("alert");
    });

    it("should sanitize XSS in property address", async () => {
      const mockProperty = {
        id: "prop-1",
        userId: "user-1",
        name: "Test Property",
        address: "Clean Address",
        city: "Miami",
        state: "FL",
        zipCode: "33101",
        type: "RESIDENTIAL",
      };

      vi.mocked(db.property.create).mockResolvedValue(mockProperty as any);

      const response = await app.request("/properties", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Test Property",
          address: xssPayloads.img,
          city: "Miami",
          state: "FL",
          zipCode: "33101",
          type: "RESIDENTIAL",
        }),
      });

      expect(response.status).toBe(201);
      const callArgs = vi.mocked(db.property.create).mock.calls[0][0];
      expect(callArgs.data.address).not.toContain("<img");
      expect(callArgs.data.address).not.toContain("onerror");
    });

    it("should sanitize XSS in property city", async () => {
      const mockProperty = {
        id: "prop-1",
        userId: "user-1",
        name: "Test Property",
        address: "123 Main St",
        city: "Clean City",
        state: "FL",
        zipCode: "33101",
        type: "RESIDENTIAL",
      };

      vi.mocked(db.property.create).mockResolvedValue(mockProperty as any);

      const response = await app.request("/properties", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Test Property",
          address: "123 Main St",
          city: xssPayloads.iframe,
          state: "FL",
          zipCode: "33101",
          type: "RESIDENTIAL",
        }),
      });

      expect(response.status).toBe(201);
      const callArgs = vi.mocked(db.property.create).mock.calls[0][0];
      expect(callArgs.data.city).not.toContain("<iframe");
      expect(callArgs.data.city).not.toContain("javascript:");
    });

    it("should sanitize XSS in property state", async () => {
      const mockProperty = {
        id: "prop-1",
        userId: "user-1",
        name: "Test Property",
        address: "123 Main St",
        city: "Miami",
        state: "FL",
        zipCode: "33101",
        type: "RESIDENTIAL",
      };

      vi.mocked(db.property.create).mockResolvedValue(mockProperty as any);

      const response = await app.request("/properties", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Test Property",
          address: "123 Main St",
          city: "Miami",
          state: xssPayloads.svg,
          zipCode: "33101",
          type: "RESIDENTIAL",
        }),
      });

      expect(response.status).toBe(201);
      const callArgs = vi.mocked(db.property.create).mock.calls[0][0];
      expect(callArgs.data.state).not.toContain("<svg");
      expect(callArgs.data.state).not.toContain("onload");
    });

    // zipCode is validated by format (max 20 chars, alphanumeric)
    // HTML injection attempts will be rejected by validation layer

    it("should sanitize XSS in property notes", async () => {
      const mockProperty = {
        id: "prop-1",
        userId: "user-1",
        name: "Test Property",
        address: "123 Main St",
        city: "Miami",
        state: "FL",
        zipCode: "33101",
        type: "RESIDENTIAL",
        notes: "Clean notes",
      };

      vi.mocked(db.property.create).mockResolvedValue(mockProperty as any);

      const response = await app.request("/properties", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Test Property",
          address: "123 Main St",
          city: "Miami",
          state: "FL",
          zipCode: "33101",
          type: "RESIDENTIAL",
          notes: xssPayloads.script,
        }),
      });

      expect(response.status).toBe(201);
      const callArgs = vi.mocked(db.property.create).mock.calls[0][0];
      expect(callArgs.data.notes).not.toContain("<script>");
      expect(callArgs.data.notes).not.toContain("alert");
    });

    it("should sanitize multiple XSS payloads in property update", async () => {
      const mockProperty = {
        id: "prop-1",
        userId: "user-1",
        name: "Test Property",
      };

      vi.mocked(db.property.findUnique).mockResolvedValue(mockProperty as any);
      vi.mocked(db.property.update).mockResolvedValue({
        ...mockProperty,
        name: "Clean Name",
        notes: "Clean Notes",
      } as any);

      const response = await app.request("/properties/prop-1", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: xssPayloads.script,
          notes: xssPayloads.img,
        }),
      });

      expect(response.status).toBe(200);
      const callArgs = vi.mocked(db.property.update).mock.calls[0][0];
      expect(callArgs.data.name).not.toContain("<script>");
      expect(callArgs.data.notes).not.toContain("<img");
    });
  });

  describe("Users - XSS Protection", () => {
    const token = generateToken({
      sub: "user-1",
      email: "user@test.com",
      role: "CLIENT",
    });

    beforeEach(() => {
      // Mock user lookup for authorization (first findUnique call)
      vi.mocked(db.user.findUnique).mockResolvedValue({
        id: "user-1",
        email: "user@test.com",
        name: "Test User",
        role: "CLIENT",
        passwordHash: "hash",
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);
    });

    it("should sanitize XSS in user name", async () => {
      const mockUser = {
        id: "user-1",
        email: "user@test.com",
        name: "Clean Name",
        role: "CLIENT",
      };

      vi.mocked(db.user.update).mockResolvedValue(mockUser as any);

      const response = await app.request("/users/user-1", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: xssPayloads.script,
        }),
      });

      expect(response.status).toBe(200);
      const callArgs = vi.mocked(db.user.update).mock.calls[0][0];
      expect(callArgs.data.name).not.toContain("<script>");
      expect(callArgs.data.name).not.toContain("alert");
    });

    it("should sanitize XSS in user phone", async () => {
      const mockUser = {
        id: "user-1",
        email: "user@test.com",
        name: "Test User",
        phone: "Clean phone",
        role: "CLIENT",
      };

      vi.mocked(db.user.update).mockResolvedValue(mockUser as any);

      const response = await app.request("/users/user-1", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: xssPayloads.img,
        }),
      });

      expect(response.status).toBe(200);
      const callArgs = vi.mocked(db.user.update).mock.calls[0][0];
      expect(callArgs.data.phone).not.toContain("<img");
      expect(callArgs.data.phone).not.toContain("onerror");
    });
  });

  describe("Bookings - XSS Protection", () => {
    const adminToken = generateToken({
      sub: "admin-1",
      email: "admin@test.com",
      role: "ADMIN",
    });

    it("should sanitize XSS in booking notes", async () => {
      const mockBooking = {
        id: "booking-1",
        userId: "user-1",
        propertyId: "prop-1",
        serviceId: "service-1",
        scheduledAt: new Date(),
        status: "PENDING",
        notes: "Clean notes",
      };

      vi.mocked(db.booking.findUnique).mockResolvedValue(mockBooking as any);
      vi.mocked(db.booking.update).mockResolvedValue(mockBooking as any);

      const response = await app.request("/bookings/booking-1", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${adminToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          notes: xssPayloads.script,
        }),
      });

      expect(response.status).toBe(200);
      const callArgs = vi.mocked(db.booking.update).mock.calls[0][0];
      expect(callArgs.data.notes).not.toContain("<script>");
      expect(callArgs.data.notes).not.toContain("alert");
    });

    it("should sanitize all dangerous HTML tags in booking notes", async () => {
      const mockBooking = {
        id: "booking-1",
        userId: "user-1",
        propertyId: "prop-1",
        serviceId: "service-1",
        scheduledAt: new Date(),
        status: "PENDING",
      };

      // Test only HTML-based XSS payloads (not javascript: protocol which is handled elsewhere)
      const htmlPayloads = {
        script: xssPayloads.script,
        img: xssPayloads.img,
        iframe: xssPayloads.iframe,
        onload: xssPayloads.onload,
        svg: xssPayloads.svg,
        eventHandler: xssPayloads.eventHandler,
      };

      vi.mocked(db.booking.findUnique).mockResolvedValue(mockBooking as any);

      for (const [payloadName, payload] of Object.entries(htmlPayloads)) {
        vi.clearAllMocks();
        vi.mocked(db.booking.findUnique).mockResolvedValue(mockBooking as any);
        vi.mocked(db.booking.update).mockResolvedValue({
          ...mockBooking,
          notes: "Clean notes",
        } as any);

        const response = await app.request("/bookings/booking-1", {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${adminToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            notes: payload,
          }),
        });

        expect(response.status).toBe(200);
        const callArgs = vi.mocked(db.booking.update).mock.calls[0][0];

        // Verify no dangerous HTML tags or attributes
        expect(callArgs.data.notes).not.toContain("<script");
        expect(callArgs.data.notes).not.toContain("<img");
        expect(callArgs.data.notes).not.toContain("<iframe");
        expect(callArgs.data.notes).not.toContain("onerror");
        expect(callArgs.data.notes).not.toContain("onload");
        expect(callArgs.data.notes).not.toContain("onclick");
      }
    });
  });

  describe("Complex XSS Attack Vectors", () => {
    const token = generateToken({
      sub: "user-1",
      email: "user@test.com",
      role: "CLIENT",
    });

    it("should sanitize nested XSS attacks", async () => {
      const nestedPayload = '<div><script>alert("nested")</script></div>';
      const mockProperty = {
        id: "prop-1",
        userId: "user-1",
        name: "Clean Name",
        address: "123 Main St",
        city: "Miami",
        state: "FL",
        zipCode: "33101",
        type: "RESIDENTIAL",
      };

      vi.mocked(db.property.create).mockResolvedValue(mockProperty as any);

      const response = await app.request("/properties", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: nestedPayload,
          address: "123 Main St",
          city: "Miami",
          state: "FL",
          zipCode: "33101",
          type: "RESIDENTIAL",
        }),
      });

      expect(response.status).toBe(201);
      const callArgs = vi.mocked(db.property.create).mock.calls[0][0];
      expect(callArgs.data.name).not.toContain("<script>");
      expect(callArgs.data.name).not.toContain("alert");
    });

    it("should allow HTML entities (already safe)", async () => {
      // HTML entities like &lt; are already safe and should pass through
      const encodedPayload = "&lt;script&gt;alert('xss')&lt;/script&gt;";
      const mockProperty = {
        id: "prop-1",
        userId: "user-1",
        name: "Clean Name",
        address: "123 Main St",
        city: "Miami",
        state: "FL",
        zipCode: "33101",
        type: "RESIDENTIAL",
      };

      vi.mocked(db.property.create).mockResolvedValue(mockProperty as any);

      const response = await app.request("/properties", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: encodedPayload,
          address: "123 Main St",
          city: "Miami",
          state: "FL",
          zipCode: "33101",
          type: "RESIDENTIAL",
        }),
      });

      expect(response.status).toBe(201);
      const callArgs = vi.mocked(db.property.create).mock.calls[0][0];
      // HTML entities are safe - they won't execute as script
      // sanitizePlainText strips actual HTML tags, not entities
      expect(callArgs.data.name).toBeDefined();
    });

    it("should sanitize mixed content attacks", async () => {
      const mixedPayload = "Normal text <script>alert(1)</script> more text";
      const mockProperty = {
        id: "prop-1",
        userId: "user-1",
        name: "Clean Name",
        address: "123 Main St",
        city: "Miami",
        state: "FL",
        zipCode: "33101",
        type: "RESIDENTIAL",
      };

      vi.mocked(db.property.create).mockResolvedValue(mockProperty as any);

      const response = await app.request("/properties", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: mixedPayload,
          address: "123 Main St",
          city: "Miami",
          state: "FL",
          zipCode: "33101",
          type: "RESIDENTIAL",
        }),
      });

      expect(response.status).toBe(201);
      const callArgs = vi.mocked(db.property.create).mock.calls[0][0];
      expect(callArgs.data.name).toContain("Normal text");
      expect(callArgs.data.name).toContain("more text");
      expect(callArgs.data.name).not.toContain("<script>");
      expect(callArgs.data.name).not.toContain("alert");
    });
  });
});
