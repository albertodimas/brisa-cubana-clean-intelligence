import { db } from "../lib/db";
import { logger } from "../lib/logger";
import type { User } from "../generated/prisma";
import { hashPassword, verifyPassword } from "../lib/password";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  revokeRefreshToken,
  revokeAllUserRefreshTokens,
} from "../lib/token";
import {
  NotFoundError,
  UnauthorizedError,
  ValidationError,
  ConflictError,
} from "../lib/errors";

export interface RegisterData {
  email: string;
  password: string;
  name?: string;
  phone?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  token: string; // Legacy field (alias for accessToken)
}

export interface UserResponse {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

/**
 * Authentication Service
 * 
 * Handles all authentication logic:
 * - User registration and login
 * - Token generation and verification
 * - Password hashing and validation
 * - Refresh token rotation
 */
export class AuthService {
  /**
   * Register a new user
   * 
   * Validates email uniqueness, password strength, hashes password
   */
  async register(data: RegisterData): Promise<{
    user: UserResponse;
    tokens: AuthTokens;
  }> {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      throw new ValidationError("Invalid email format");
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictError("User with this email already exists");
    }

    // Validate password strength
    if (data.password.length < 8) {
      throw new ValidationError(
        "Password must be at least 8 characters long",
      );
    }

    // Hash password
    const passwordHash = await hashPassword(data.password);

    // Create user
    const user = await db.user.create({
      data: {
        email: data.email.toLowerCase(),
        passwordHash,
        name: data.name,
        phone: data.phone,
        role: "CLIENT", // Default role
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    // Generate tokens
    const tokens = await this.generateTokensForUser(user.id);

    logger.info(`User registered: ${user.id} (${user.email})`);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      tokens,
    };
  }

  /**
   * Login a user
   * 
   * Validates credentials and returns tokens
   */
  async login(data: LoginData): Promise<{
    user: UserResponse;
    tokens: AuthTokens;
  }> {
    // Find user by email
    const user = await db.user.findUnique({
      where: { email: data.email.toLowerCase() },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        passwordHash: true,
      },
    });

    if (!user) {
      throw new UnauthorizedError("Invalid credentials");
    }

    // Verify password
    const isValidPassword = await verifyPassword(
      data.password,
      user.passwordHash,
    );

    if (!isValidPassword) {
      throw new UnauthorizedError("Invalid credentials");
    }

    // Generate tokens
    const tokens = await this.generateTokensForUser(user.id);

    logger.info(`User logged in: ${user.id} (${user.email})`);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      tokens,
    };
  }

  /**
   * Refresh access token using refresh token
   * 
   * Implements token rotation: old token is revoked, new tokens issued
   */
  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    // Verify refresh token
    const payload = await verifyRefreshToken(refreshToken);

    if (!payload) {
      throw new UnauthorizedError("Invalid or expired refresh token");
    }

    // Verify user still exists
    const user = await db.user.findUnique({
      where: { id: payload.sub },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    // Revoke old refresh token
    await revokeRefreshToken(payload.tokenId);

    // Generate new tokens
    const tokens = await this.generateTokensForUser(user.id);

    logger.info(`Tokens refreshed for user: ${user.id}`);

    return tokens;
  }

  /**
   * Logout a user
   * 
   * Revokes all refresh tokens for the user
   */
  async logout(userId: string): Promise<void> {
    await revokeAllUserRefreshTokens(userId);
    logger.info(`User logged out: ${userId}`);
  }

  /**
   * Get user by ID
   */
  async getUserById(id: string): Promise<User> {
    const user = await db.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundError(`User with ID ${id} not found`);
    }

    return user;
  }

  /**
   * Generate access and refresh tokens for a user
   */
  private async generateTokensForUser(userId: string): Promise<AuthTokens> {
    // Fetch user data for token
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true },
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    const accessToken = generateAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
    const refreshToken = await generateRefreshToken(userId);

    return {
      accessToken,
      refreshToken,
      token: accessToken, // Legacy field for backwards compatibility
    };
  }
}

// Export singleton instance
export const authService = new AuthService();
