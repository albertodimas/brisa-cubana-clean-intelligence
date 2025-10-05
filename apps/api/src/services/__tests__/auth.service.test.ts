import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthService } from "../auth.service";
import {
  NotFoundError,
  UnauthorizedError,
  ValidationError,
  ConflictError,
} from "../../lib/errors";
import type { User, UserRole } from "../../generated/prisma";

// Global mock for db
vi.mock("../../lib/db", () => ({
  db: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

// Global mock for password utilities
vi.mock("../../lib/password", () => ({
  hashPassword: vi.fn(),
  verifyPassword: vi.fn(),
}));

// Global mock for token utilities
vi.mock("../../lib/token", () => ({
  generateAccessToken: vi.fn(),
  generateRefreshToken: vi.fn(),
  verifyRefreshToken: vi.fn(),
  revokeRefreshToken: vi.fn(),
  revokeAllUserRefreshTokens: vi.fn(),
}));

// Global mock for logger
vi.mock("../../lib/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

const { db } = await import("../../lib/db");
const { hashPassword, verifyPassword } = await import("../../lib/password");
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  revokeRefreshToken,
  revokeAllUserRefreshTokens,
} = await import("../../lib/token");

describe("AuthService", () => {
  let service: AuthService;

  // Helper function to create mock user
  const mockUser = (overrides?: Partial<User>): User => ({
    id: "user-1",
    email: "test@example.com",
    name: "Test User",
    phone: null,
    role: "CLIENT" as UserRole,
    passwordHash: "$2b$10$hashedpassword",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    ...overrides,
  });

  beforeEach(() => {
    service = new AuthService();
    vi.clearAllMocks();
  });

  describe("register", () => {
    it("should register a new user successfully", async () => {
      const newUser = mockUser();
      vi.mocked(db.user.findUnique)
        .mockResolvedValueOnce(null) // No existing user
        .mockResolvedValueOnce(newUser); // For generateTokensForUser
      vi.mocked(hashPassword).mockResolvedValueOnce("$2b$10$hashedpassword");
      vi.mocked(db.user.create).mockResolvedValueOnce(newUser);
      vi.mocked(generateAccessToken).mockReturnValueOnce("access-token");
      vi.mocked(generateRefreshToken).mockResolvedValueOnce("refresh-token");

      const result = await service.register({
        email: "test@example.com",
        password: "password123",
        name: "Test User",
      });

      expect(result.user).toEqual({
        id: "user-1",
        email: "test@example.com",
        name: "Test User",
        role: "CLIENT",
      });
      expect(result.tokens.accessToken).toBe("access-token");
      expect(result.tokens.refreshToken).toBe("refresh-token");
      expect(result.tokens.token).toBe("access-token"); // Legacy field
    });

    it("should throw ValidationError for invalid email format", async () => {
      await expect(
        service.register({
          email: "invalid-email",
          password: "password123",
        }),
      ).rejects.toThrow(ValidationError);
      await expect(
        service.register({
          email: "invalid-email",
          password: "password123",
        }),
      ).rejects.toThrow("Invalid email format");
    });

    it("should throw ConflictError when email already exists", async () => {
      vi.mocked(db.user.findUnique).mockResolvedValue(mockUser());

      await expect(
        service.register({
          email: "test@example.com",
          password: "password123",
        }),
      ).rejects.toThrow(ConflictError);
      await expect(
        service.register({
          email: "test@example.com",
          password: "password123",
        }),
      ).rejects.toThrow("User with this email already exists");
    });

    it("should throw ValidationError for password less than 8 characters", async () => {
      vi.mocked(db.user.findUnique).mockResolvedValue(null);

      await expect(
        service.register({
          email: "test@example.com",
          password: "short",
        }),
      ).rejects.toThrow(ValidationError);
      await expect(
        service.register({
          email: "test@example.com",
          password: "short",
        }),
      ).rejects.toThrow("Password must be at least 8 characters long");
    });

    it("should normalize email to lowercase", async () => {
      const newUser = mockUser({ email: "test@example.com" });
      vi.mocked(db.user.findUnique)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(newUser);
      vi.mocked(hashPassword).mockResolvedValueOnce("$2b$10$hashedpassword");
      vi.mocked(db.user.create).mockResolvedValueOnce(newUser);
      vi.mocked(generateAccessToken).mockReturnValueOnce("access-token");
      vi.mocked(generateRefreshToken).mockResolvedValueOnce("refresh-token");

      await service.register({
        email: "TEST@EXAMPLE.COM",
        password: "password123",
      });

      expect(db.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: "test@example.com",
        }),
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      });
    });

    it("should hash password before storing", async () => {
      const newUser = mockUser();
      vi.mocked(db.user.findUnique)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(newUser);
      vi.mocked(hashPassword).mockResolvedValueOnce("$2b$10$hashedpassword");
      vi.mocked(db.user.create).mockResolvedValueOnce(newUser);
      vi.mocked(generateAccessToken).mockReturnValueOnce("access-token");
      vi.mocked(generateRefreshToken).mockResolvedValueOnce("refresh-token");

      await service.register({
        email: "test@example.com",
        password: "password123",
      });

      expect(hashPassword).toHaveBeenCalledWith("password123");
      expect(db.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          passwordHash: "$2b$10$hashedpassword",
        }),
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      });
    });
  });

  describe("login", () => {
    it("should login successfully with valid credentials", async () => {
      const user = mockUser();
      vi.mocked(db.user.findUnique)
        .mockResolvedValueOnce(user)
        .mockResolvedValueOnce(user);
      vi.mocked(verifyPassword).mockResolvedValueOnce(true);
      vi.mocked(generateAccessToken).mockReturnValueOnce("access-token");
      vi.mocked(generateRefreshToken).mockResolvedValueOnce("refresh-token");

      const result = await service.login({
        email: "test@example.com",
        password: "password123",
      });

      expect(result.user).toEqual({
        id: "user-1",
        email: "test@example.com",
        name: "Test User",
        role: "CLIENT",
      });
      expect(result.tokens.accessToken).toBe("access-token");
    });

    it("should throw UnauthorizedError when user does not exist", async () => {
      vi.mocked(db.user.findUnique).mockResolvedValue(null);

      await expect(
        service.login({
          email: "nonexistent@example.com",
          password: "password123",
        }),
      ).rejects.toThrow(UnauthorizedError);
      await expect(
        service.login({
          email: "nonexistent@example.com",
          password: "password123",
        }),
      ).rejects.toThrow("Invalid credentials");
    });

    it("should throw UnauthorizedError when password is incorrect", async () => {
      const user = mockUser();
      vi.mocked(db.user.findUnique).mockResolvedValue(user);
      vi.mocked(verifyPassword).mockResolvedValue(false);

      await expect(
        service.login({
          email: "test@example.com",
          password: "wrongpassword",
        }),
      ).rejects.toThrow(UnauthorizedError);
      await expect(
        service.login({
          email: "test@example.com",
          password: "wrongpassword",
        }),
      ).rejects.toThrow("Invalid credentials");
    });

    it("should normalize email to lowercase in login", async () => {
      const user = mockUser();
      vi.mocked(db.user.findUnique).mockResolvedValueOnce(user);
      vi.mocked(verifyPassword).mockResolvedValueOnce(true);
      vi.mocked(generateAccessToken).mockReturnValueOnce("access-token");
      vi.mocked(generateRefreshToken).mockResolvedValueOnce("refresh-token");

      await service.login({
        email: "TEST@EXAMPLE.COM",
        password: "password123",
      });

      expect(db.user.findUnique).toHaveBeenCalledWith({
        where: { email: "test@example.com" },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          passwordHash: true,
        },
      });
    });
  });

  describe("refreshToken", () => {
    it("should refresh tokens successfully", async () => {
      const user = mockUser();
      vi.mocked(verifyRefreshToken).mockResolvedValueOnce({
        sub: "user-1",
        tokenId: "token-id-1",
      });
      vi.mocked(db.user.findUnique)
        .mockResolvedValueOnce(user) // First check
        .mockResolvedValueOnce(user); // For generateTokensForUser
      vi.mocked(revokeRefreshToken).mockResolvedValueOnce(undefined);
      vi.mocked(generateAccessToken).mockReturnValue("new-access-token");
      vi.mocked(generateRefreshToken).mockResolvedValue("new-refresh-token");

      const result = await service.refreshToken("old-refresh-token");

      expect(result.accessToken).toBe("new-access-token");
      expect(result.refreshToken).toBe("new-refresh-token");
      expect(revokeRefreshToken).toHaveBeenCalledWith("token-id-1");
    });

    it("should throw UnauthorizedError for invalid refresh token", async () => {
      vi.mocked(verifyRefreshToken).mockResolvedValueOnce(null);

      await expect(service.refreshToken("invalid-token")).rejects.toThrow(
        UnauthorizedError,
      );
      await expect(service.refreshToken("invalid-token")).rejects.toThrow(
        "Invalid or expired refresh token",
      );
    });

    it("should throw NotFoundError when user no longer exists", async () => {
      vi.mocked(verifyRefreshToken).mockResolvedValue({
        sub: "user-1",
        tokenId: "token-id-1",
      });
      vi.mocked(db.user.findUnique).mockResolvedValue(null);

      await expect(service.refreshToken("refresh-token")).rejects.toThrow(
        NotFoundError,
      );
      await expect(service.refreshToken("refresh-token")).rejects.toThrow(
        "User not found",
      );
    });
  });

  describe("logout", () => {
    it("should revoke all user refresh tokens", async () => {
      vi.mocked(revokeAllUserRefreshTokens).mockResolvedValueOnce(undefined);

      await service.logout("user-1");

      expect(revokeAllUserRefreshTokens).toHaveBeenCalledWith("user-1");
    });
  });

  describe("getUserById", () => {
    it("should return user when found", async () => {
      const user = mockUser();
      vi.mocked(db.user.findUnique).mockResolvedValueOnce(user);

      const result = await service.getUserById("user-1");

      expect(result).toEqual(user);
    });

    it("should throw NotFoundError when user does not exist", async () => {
      vi.mocked(db.user.findUnique).mockResolvedValue(null);

      await expect(service.getUserById("nonexistent")).rejects.toThrow(
        NotFoundError,
      );
      await expect(service.getUserById("nonexistent")).rejects.toThrow(
        "User with ID nonexistent not found",
      );
    });
  });
});
