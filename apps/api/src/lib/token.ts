import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import type { UserRole } from "../generated/prisma";
import { env } from "../config/env";
import { db } from "./db";
import { logger } from "./logger";

const secret = env.jwtSecret;

export interface AccessTokenPayload {
  sub: string;
  email: string;
  role: UserRole;
}

export interface RefreshTokenPayload {
  sub: string;
  tokenId: string;
}

// Updated to 15 minutes for better security
const ACCESS_TOKEN_EXPIRATION = "15m";
const REFRESH_TOKEN_EXPIRATION = "7d";
const FAKE_TOKEN_PREFIX = "fake.";

export function generateAccessToken(payload: AccessTokenPayload): string {
  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }
  return jwt.sign(payload, secret, { expiresIn: ACCESS_TOKEN_EXPIRATION });
}

export async function generateRefreshToken(userId: string): Promise<string> {
  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }

  // Generate cryptographically secure random token
  const tokenValue = crypto.randomBytes(32).toString("base64url");

  // Calculate expiration date (7 days from now)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  // Store in database
  const refreshToken = (await db.refreshToken.create({
    data: {
      token: tokenValue,
      userId,
      expiresAt,
    },
  })) as { id: string; token: string; userId: string; expiresAt: Date };

  // Create JWT with token ID for additional validation
  const payload: RefreshTokenPayload = {
    sub: userId,
    tokenId: refreshToken.id,
  };

  return jwt.sign(payload, secret, { expiresIn: REFRESH_TOKEN_EXPIRATION });
}

export async function verifyRefreshToken(
  token: string,
): Promise<RefreshTokenPayload | null> {
  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }

  try {
    // Verify JWT signature and expiration
    const payload = jwt.verify(token, secret) as RefreshTokenPayload;

    // Verify token exists in database and hasn't been revoked
    const storedToken = (await db.refreshToken.findFirst({
      where: {
        id: payload.tokenId,
        userId: payload.sub,
        isRevoked: false,
        expiresAt: {
          gt: new Date(),
        },
      },
    })) as { id: string; token: string } | null;

    if (!storedToken) {
      logger.warn(
        {
          tokenId: payload.tokenId,
        },
        "[token] Refresh token not found or revoked",
      );
      return null;
    }

    return payload;
  } catch (error) {
    logger.warn(
      { error: error instanceof Error ? error.message : "unknown" },
      "[token] Invalid refresh token",
    );
    return null;
  }
}

export async function revokeRefreshToken(tokenId: string): Promise<void> {
  await db.refreshToken.update({
    where: { id: tokenId },
    data: { isRevoked: true },
  });
}

export async function revokeAllRefreshTokens(userId: string): Promise<void> {
  await db.refreshToken.updateMany({
    where: { userId },
    data: { isRevoked: true },
  });
}

export async function cleanupExpiredTokens(): Promise<number> {
  const result = (await db.refreshToken.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: new Date() } },
        {
          isRevoked: true,
          // Delete revoked tokens older than 30 days
          createdAt: { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
      ],
    },
  })) as { count: number };
  return result.count;
}

export function verifyAccessToken(token: string): AccessTokenPayload | null {
  if (
    (process.env.USE_FAKE_API_DATA === "1" ||
      process.env.NEXT_PUBLIC_USE_FAKE_API_DATA === "1") &&
    token.startsWith(FAKE_TOKEN_PREFIX)
  ) {
    const payload = decodeFakeToken(token);
    if (payload) {
      return payload;
    }
  }

  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }
  try {
    return jwt.verify(token, secret) as AccessTokenPayload;
  } catch (error) {
    logger.warn(
      { error: error instanceof Error ? error.message : "unknown" },
      "Invalid access token",
    );
    return null;
  }
}

function decodeFakeToken(token: string): AccessTokenPayload | null {
  try {
    const encoded = token.slice(FAKE_TOKEN_PREFIX.length);
    const json = Buffer.from(encoded, "base64url").toString("utf8");
    const parsed = JSON.parse(json) as Partial<AccessTokenPayload>;

    if (
      typeof parsed?.sub === "string" &&
      typeof parsed?.email === "string" &&
      typeof parsed?.role === "string"
    ) {
      return {
        sub: parsed.sub,
        email: parsed.email,
        role: parsed.role,
      };
    }
    logger.warn({ payload: parsed }, "[auth] Invalid fake token payload");
    return null;
  } catch (error) {
    logger.warn(
      { error: error instanceof Error ? error.message : "unknown" },
      "[auth] Failed to decode fake token",
    );
    return null;
  }
}
