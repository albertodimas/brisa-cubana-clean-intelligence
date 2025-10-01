// @ts-nocheck
/* eslint-disable @typescript-eslint/ban-ts-comment */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { generateAccessToken, verifyAccessToken } from "./token";
import type { AccessTokenPayload } from "./token";

describe("Token Management", () => {
  const mockPayload: AccessTokenPayload = {
    sub: "user-123",
    email: "test@example.com",
    role: "USER" as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("generateAccessToken", () => {
    it("should generate a valid JWT token", () => {
      const token = generateAccessToken(mockPayload);
      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
      expect(token.split(".").length).toBe(3); // JWT has 3 parts
    });

    it("should generate different tokens for different payloads", () => {
      const token1 = generateAccessToken(mockPayload);
      const token2 = generateAccessToken({
        ...mockPayload,
        sub: "user-456",
      });
      expect(token1).not.toBe(token2);
    });

    it("should include all payload fields", () => {
      const token = generateAccessToken(mockPayload);
      const decoded = verifyAccessToken(token);
      expect(decoded).not.toBeNull();
      expect(decoded?.sub).toBe(mockPayload.sub);
      expect(decoded?.email).toBe(mockPayload.email);
      expect(decoded?.role).toBe(mockPayload.role);
    });

    it("should generate tokens for ADMIN role", () => {
      const adminPayload: AccessTokenPayload = {
        sub: "admin-123",
        email: "admin@example.com",
        role: "ADMIN" as const,
      };
      const token = generateAccessToken(adminPayload);
      const decoded = verifyAccessToken(token);
      expect(decoded?.role).toBe("ADMIN");
    });

    it("should generate tokens for CLEANER role", () => {
      const cleanerPayload: AccessTokenPayload = {
        sub: "cleaner-123",
        email: "cleaner@example.com",
        role: "CLEANER" as const,
      };
      const token = generateAccessToken(cleanerPayload);
      const decoded = verifyAccessToken(token);
      expect(decoded?.role).toBe("CLEANER");
    });
  });

  describe("verifyAccessToken", () => {
    it("should verify valid token", () => {
      const token = generateAccessToken(mockPayload);
      const decoded = verifyAccessToken(token);
      expect(decoded).not.toBeNull();
      expect(decoded).toMatchObject({
        sub: mockPayload.sub,
        email: mockPayload.email,
        role: mockPayload.role,
      });
    });

    it("should return null for invalid token", () => {
      const decoded = verifyAccessToken("invalid.token.here");
      expect(decoded).toBeNull();
    });

    it("should return null for malformed token", () => {
      const decoded = verifyAccessToken("not-a-jwt");
      expect(decoded).toBeNull();
    });

    it("should return null for empty string", () => {
      const decoded = verifyAccessToken("");
      expect(decoded).toBeNull();
    });

    it("should return null for token with wrong signature", () => {
      const token = generateAccessToken(mockPayload);
      const parts = token.split(".");
      const tamperedToken = `${parts[0]}.${parts[1]}.wrongsignature`;
      const decoded = verifyAccessToken(tamperedToken);
      expect(decoded).toBeNull();
    });

    it("should verify token with extra JWT fields (iat, exp)", () => {
      const token = generateAccessToken(mockPayload);
      const decoded = verifyAccessToken(token);
      expect(decoded).not.toBeNull();
      // JWT automatically adds iat (issued at) and exp (expiration)
      expect(decoded).toHaveProperty("sub");
      expect(decoded).toHaveProperty("email");
      expect(decoded).toHaveProperty("role");
    });
  });

  describe("Token lifecycle", () => {
    it("should generate and verify token roundtrip", () => {
      const payload: AccessTokenPayload = {
        sub: "test-user",
        email: "roundtrip@test.com",
        role: "USER" as const,
      };
      const token = generateAccessToken(payload);
      const decoded = verifyAccessToken(token);
      expect(decoded).toMatchObject(payload);
    });

    it("should handle special characters in email", () => {
      const payload: AccessTokenPayload = {
        sub: "user-special",
        email: "test+special@example.com",
        role: "USER" as const,
      };
      const token = generateAccessToken(payload);
      const decoded = verifyAccessToken(token);
      expect(decoded?.email).toBe(payload.email);
    });

    it("should handle UUID format user IDs", () => {
      const payload: AccessTokenPayload = {
        sub: "550e8400-e29b-41d4-a716-446655440000",
        email: "uuid@test.com",
        role: "USER" as const,
      };
      const token = generateAccessToken(payload);
      const decoded = verifyAccessToken(token);
      expect(decoded?.sub).toBe(payload.sub);
    });
  });
});
