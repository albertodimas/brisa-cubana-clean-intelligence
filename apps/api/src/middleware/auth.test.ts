import { describe, it, expect } from "vitest";
import { Hono } from "hono";
import { requireAuth, getAuthUser, AUTH_USER_KEY } from "./auth";
import { generateAccessToken } from "../lib/token";
import type { AccessTokenPayload } from "../lib/token";

describe("Auth Middleware", () => {
  const mockClientPayload: AccessTokenPayload = {
    sub: "client-123",
    email: "client@example.com",
    role: "CLIENT",
  };

  const mockAdminPayload: AccessTokenPayload = {
    sub: "admin-123",
    email: "admin@example.com",
    role: "ADMIN",
  };

  const mockStaffPayload: AccessTokenPayload = {
    sub: "staff-123",
    email: "staff@example.com",
    role: "STAFF",
  };

  describe("requireAuth - Basic Authentication", () => {
    it("should allow valid token", async () => {
      const app = new Hono();
      app.get("/protected", requireAuth(), (c) => c.json({ success: true }));

      const token = generateAccessToken(mockClientPayload);
      const res = await app.request("/protected", {
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({ success: true });
    });

    it("should reject request without Authorization header", async () => {
      const app = new Hono();
      app.get("/protected", requireAuth(), (c) => c.json({ success: true }));

      const res = await app.request("/protected");
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body).toEqual({
        error: "Authentication required (cookie or header)",
      });
    });

    it("should reject request with empty Authorization header", async () => {
      const app = new Hono();
      app.get("/protected", requireAuth(), (c) => c.json({ success: true }));

      const res = await app.request("/protected", {
        headers: { Authorization: "" },
      });

      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body).toEqual({
        error: "Authentication required (cookie or header)",
      });
    });

    it("should reject request with invalid token format", async () => {
      const app = new Hono();
      app.get("/protected", requireAuth(), (c) => c.json({ success: true }));

      const res = await app.request("/protected", {
        headers: { Authorization: "Bearer invalid-token" },
      });

      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body).toEqual({ error: "Invalid or expired token" });
    });

    it("should reject request with malformed Bearer token", async () => {
      const app = new Hono();
      app.get("/protected", requireAuth(), (c) => c.json({ success: true }));

      const res = await app.request("/protected", {
        headers: { Authorization: "InvalidScheme token" },
      });

      expect(res.status).toBe(401);
    });

    it("should reject request with Bearer prefix but no token", async () => {
      const app = new Hono();
      app.get("/protected", requireAuth(), (c) => c.json({ success: true }));

      const res = await app.request("/protected", {
        headers: { Authorization: "Bearer " },
      });

      expect(res.status).toBe(401);
      const body = await res.json();
      // Empty string after trim is treated as missing
      expect(body).toEqual({
        error: "Authentication required (cookie or header)",
      });
    });
  });

  describe("requireAuth - Role-Based Access Control", () => {
    it("should allow CLIENT role when CLIENT is allowed", async () => {
      const app = new Hono();
      app.get("/protected", requireAuth(["CLIENT"]), (c) =>
        c.json({ success: true }),
      );

      const token = generateAccessToken(mockClientPayload);
      const res = await app.request("/protected", {
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(res.status).toBe(200);
    });

    it("should allow ADMIN role when ADMIN is allowed", async () => {
      const app = new Hono();
      app.get("/admin", requireAuth(["ADMIN"]), (c) =>
        c.json({ success: true }),
      );

      const token = generateAccessToken(mockAdminPayload);
      const res = await app.request("/admin", {
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(res.status).toBe(200);
    });

    it("should allow STAFF role when STAFF is allowed", async () => {
      const app = new Hono();
      app.get("/staff", requireAuth(["STAFF"]), (c) =>
        c.json({ success: true }),
      );

      const token = generateAccessToken(mockStaffPayload);
      const res = await app.request("/staff", {
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(res.status).toBe(200);
    });

    it("should reject CLIENT when only ADMIN is allowed", async () => {
      const app = new Hono();
      app.get("/admin-only", requireAuth(["ADMIN"]), (c) =>
        c.json({ success: true }),
      );

      const token = generateAccessToken(mockClientPayload);
      const res = await app.request("/admin-only", {
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body).toEqual({ error: "Forbidden" });
    });

    it("should reject STAFF when only ADMIN is allowed", async () => {
      const app = new Hono();
      app.get("/admin-only", requireAuth(["ADMIN"]), (c) =>
        c.json({ success: true }),
      );

      const token = generateAccessToken(mockStaffPayload);
      const res = await app.request("/admin-only", {
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(res.status).toBe(403);
    });

    it("should allow multiple roles", async () => {
      const app = new Hono();
      app.get("/multi-role", requireAuth(["ADMIN", "STAFF"]), (c) =>
        c.json({ success: true }),
      );

      const adminToken = generateAccessToken(mockAdminPayload);
      const staffToken = generateAccessToken(mockStaffPayload);
      const clientToken = generateAccessToken(mockClientPayload);

      const adminRes = await app.request("/multi-role", {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const staffRes = await app.request("/multi-role", {
        headers: { Authorization: `Bearer ${staffToken}` },
      });
      const clientRes = await app.request("/multi-role", {
        headers: { Authorization: `Bearer ${clientToken}` },
      });

      expect(adminRes.status).toBe(200);
      expect(staffRes.status).toBe(200);
      expect(clientRes.status).toBe(403);
    });

    it("should allow any authenticated user when no roles specified", async () => {
      const app = new Hono();
      app.get("/any-user", requireAuth(), (c) => c.json({ success: true }));

      const userToken = generateAccessToken(mockClientPayload);
      const adminToken = generateAccessToken(mockAdminPayload);
      const staffToken = generateAccessToken(mockStaffPayload);

      const userRes = await app.request("/any-user", {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      const adminRes = await app.request("/any-user", {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const staffRes = await app.request("/any-user", {
        headers: { Authorization: `Bearer ${staffToken}` },
      });

      expect(userRes.status).toBe(200);
      expect(adminRes.status).toBe(200);
      expect(staffRes.status).toBe(200);
    });
  });

  describe("getAuthUser", () => {
    it("should return user payload from context", async () => {
      const app = new Hono();
      app.get("/me", requireAuth(), (c) => {
        const user = getAuthUser(c);
        return c.json({ user });
      });

      const token = generateAccessToken(mockClientPayload);
      const res = await app.request("/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.user).toMatchObject({
        sub: mockClientPayload.sub,
        email: mockClientPayload.email,
        role: mockClientPayload.role,
      });
    });

    it("should return null when no auth user in context", async () => {
      const app = new Hono();
      app.get("/no-auth", (c) => {
        const user = getAuthUser(c);
        return c.json({ user });
      });

      const res = await app.request("/no-auth");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.user).toBeNull();
    });

    it("should preserve user data through request lifecycle", async () => {
      const app = new Hono();
      app.get("/check", requireAuth(), (c) => {
        const user1 = getAuthUser(c);
        const user2 = getAuthUser(c);
        return c.json({
          same: user1?.sub === user2?.sub,
          email: user1?.email,
        });
      });

      const token = generateAccessToken(mockClientPayload);
      const res = await app.request("/check", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const body = await res.json();
      expect(body.same).toBe(true);
      expect(body.email).toBe(mockClientPayload.email);
    });
  });

  describe("AUTH_USER_KEY", () => {
    it("should export AUTH_USER_KEY constant", () => {
      expect(AUTH_USER_KEY).toBe("authUser");
    });
  });

  describe("Token edge cases", () => {
    it("should handle token with extra whitespace", async () => {
      const app = new Hono();
      app.get("/protected", requireAuth(), (c) => c.json({ success: true }));

      const token = generateAccessToken(mockClientPayload);
      const res = await app.request("/protected", {
        headers: { Authorization: `Bearer  ${token}  ` },
      });

      expect(res.status).toBe(200);
    });

    it("should handle case-sensitive Bearer prefix", async () => {
      const app = new Hono();
      app.get("/protected", requireAuth(), (c) => c.json({ success: true }));

      const token = generateAccessToken(mockClientPayload);
      const res = await app.request("/protected", {
        headers: { Authorization: `bearer ${token}` },
      });

      expect(res.status).toBe(401);
    });
  });
});
