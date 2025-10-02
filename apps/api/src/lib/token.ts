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
const FAKE_TOKEN_PREFIX = "fake.";

export function generateAccessToken(payload: AccessTokenPayload): string {
  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }
  return jwt.sign(payload, secret, { expiresIn: TOKEN_EXPIRATION });
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
    console.warn("Invalid access token", error);
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
    console.warn("[auth] Invalid fake token payload", parsed);
    return null;
  } catch (error) {
    console.warn("[auth] Failed to decode fake token", error);
    return null;
  }
}
