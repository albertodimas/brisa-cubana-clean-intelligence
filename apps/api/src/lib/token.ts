import jwt from "jsonwebtoken";
import type { UserRole } from "../generated/prisma";

const secret =
  process.env.JWT_SECRET ??
  (process.env.NODE_ENV === "test" ? "test-secret" : undefined);

if (!secret) {
  // Fail fast in development to prevent silent misconfiguration
  throw new Error("JWT_SECRET environment variable is required");
}

export interface AccessTokenPayload {
  sub: string;
  email: string;
  role: UserRole;
}

const TOKEN_EXPIRATION = "8h";

export function generateAccessToken(payload: AccessTokenPayload): string {
  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }
  return jwt.sign(payload, secret, { expiresIn: TOKEN_EXPIRATION });
}

export function verifyAccessToken(token: string): AccessTokenPayload | null {
  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }
  try {
    return jwt.verify(token, secret) as AccessTokenPayload;
  } catch (error) {
    console.warn("Invalid access token", error);
    return null;
  }
}
