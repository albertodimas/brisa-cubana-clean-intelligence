import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "./password";

describe("Password Management", () => {
  describe("hashPassword", () => {
    it("should hash a password", async () => {
      const plain = "password123";
      const hashed = await hashPassword(plain);
      expect(hashed).toBeDefined();
      expect(typeof hashed).toBe("string");
      expect(hashed).not.toBe(plain);
    });

    it("should produce different hashes for same password (salt)", async () => {
      const plain = "samePassword";
      const hash1 = await hashPassword(plain);
      const hash2 = await hashPassword(plain);
      expect(hash1).not.toBe(hash2);
    });

    it("should hash empty string", async () => {
      const hashed = await hashPassword("");
      expect(hashed).toBeDefined();
      expect(hashed.length).toBeGreaterThan(0);
    });

    it("should hash long password", async () => {
      const longPassword = "a".repeat(200);
      const hashed = await hashPassword(longPassword);
      expect(hashed).toBeDefined();
    });

    it("should hash password with special characters", async () => {
      const specialPassword = "P@ssw0rd!#$%^&*()";
      const hashed = await hashPassword(specialPassword);
      expect(hashed).toBeDefined();
      expect(await verifyPassword(specialPassword, hashed)).toBe(true);
    });

    it("should hash password with unicode characters", async () => {
      const unicodePassword = "пароль密码🔐";
      const hashed = await hashPassword(unicodePassword);
      expect(hashed).toBeDefined();
      expect(await verifyPassword(unicodePassword, hashed)).toBe(true);
    });

    it("should produce bcrypt-compatible hash format", async () => {
      const hashed = await hashPassword("test");
      // bcrypt hashes start with $2a$, $2b$, or $2y$
      expect(hashed).toMatch(/^\$2[aby]\$/);
    });
  });

  describe("verifyPassword", () => {
    it("should verify correct password", async () => {
      const plain = "correctPassword";
      const hashed = await hashPassword(plain);
      const isValid = await verifyPassword(plain, hashed);
      expect(isValid).toBe(true);
    });

    it("should reject incorrect password", async () => {
      const plain = "correctPassword";
      const hashed = await hashPassword(plain);
      const isValid = await verifyPassword("wrongPassword", hashed);
      expect(isValid).toBe(false);
    });

    it("should return false for empty hash", async () => {
      const isValid = await verifyPassword("password", "");
      expect(isValid).toBe(false);
    });

    it("should reject password with different case", async () => {
      const plain = "Password123";
      const hashed = await hashPassword(plain);
      const isValid = await verifyPassword("password123", hashed);
      expect(isValid).toBe(false);
    });

    it("should handle whitespace differences", async () => {
      const plain = "password";
      const hashed = await hashPassword(plain);
      const isValidWithSpace = await verifyPassword("password ", hashed);
      const isValidWithoutSpace = await verifyPassword("password", hashed);
      expect(isValidWithSpace).toBe(false);
      expect(isValidWithoutSpace).toBe(true);
    });

    it("should reject invalid hash format", async () => {
      const isValid = await verifyPassword("password", "not-a-valid-hash");
      expect(isValid).toBe(false);
    });
  });

  describe("Password roundtrip", () => {
    it("should hash and verify multiple times", async () => {
      const passwords = ["test1", "test2", "test3"];
      for (const password of passwords) {
        const hashed = await hashPassword(password);
        expect(await verifyPassword(password, hashed)).toBe(true);
        expect(await verifyPassword("wrong", hashed)).toBe(false);
      }
    });

    it("should handle complex password requirements", async () => {
      const complexPassword = "MyP@ssw0rd!2024#Secure";
      const hashed = await hashPassword(complexPassword);
      expect(await verifyPassword(complexPassword, hashed)).toBe(true);
      expect(await verifyPassword("MyP@ssw0rd!2024#Securee", hashed)).toBe(
        false,
      );
    });

    it("should be consistent across multiple verifications", async () => {
      const plain = "consistentPassword";
      const hashed = await hashPassword(plain);
      // Verify multiple times - should always return true
      expect(await verifyPassword(plain, hashed)).toBe(true);
      expect(await verifyPassword(plain, hashed)).toBe(true);
      expect(await verifyPassword(plain, hashed)).toBe(true);
    });
  });

  describe("Security properties", () => {
    it("should not allow reverse engineering from hash", async () => {
      const plain = "secretPassword";
      const hashed = await hashPassword(plain);
      // Hash should not contain the original password
      expect(hashed).not.toContain(plain);
      expect(hashed.toLowerCase()).not.toContain(plain.toLowerCase());
    });

    it("should produce sufficiently long hashes", async () => {
      const hashed = await hashPassword("test");
      // bcrypt hashes are 60 characters
      expect(hashed.length).toBe(60);
    });

    it("should handle minimum and maximum password lengths", async () => {
      const minPassword = "a";
      const maxPassword = "a".repeat(72); // bcrypt max
      const hashedMin = await hashPassword(minPassword);
      const hashedMax = await hashPassword(maxPassword);
      expect(await verifyPassword(minPassword, hashedMin)).toBe(true);
      expect(await verifyPassword(maxPassword, hashedMax)).toBe(true);
    });
  });
});
