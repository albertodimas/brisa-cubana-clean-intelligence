import jwt, { type Secret, type SignOptions } from "jsonwebtoken";
import type { UserRole } from "@prisma/client";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  // Fail fast during server startup; tests can override via env
  console.warn("[auth] JWT_SECRET is not defined. Auth endpoints will reject requests.");
}

export type AuthPayload = {
  sub: string;
  email: string;
  role: UserRole;
};

export function signAuthToken(
  payload: AuthPayload,
  expiresIn: SignOptions["expiresIn"] = "1d",
): string {
  if (!JWT_SECRET) {
    throw new Error("JWT secret not configured");
  }

  const secret = JWT_SECRET as Secret;
  const options: SignOptions = { expiresIn };
  return jwt.sign(payload, secret, options);
}

export function verifyAuthToken(token: string): AuthPayload | null {
  if (!JWT_SECRET) {
    return null;
  }

  try {
    const secret = JWT_SECRET as Secret;
    return jwt.verify(token, secret) as AuthPayload;
  } catch {
    return null;
  }
}
