import * as jwt from "jsonwebtoken";
import type { Secret, SignOptions } from "jsonwebtoken";
import type { UserRole } from "@prisma/client";

let cachedSecret: Secret | null = null;

function resolveSecret(): Secret | null {
  if (cachedSecret) {
    return cachedSecret;
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.warn(
      "[auth] JWT_SECRET is not defined. Auth endpoints will reject requests.",
    );
    return null;
  }

  cachedSecret = secret as Secret;
  return cachedSecret;
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
  const secret = resolveSecret();
  if (!secret) {
    throw new Error("JWT secret not configured");
  }

  const options: SignOptions = { expiresIn };
  return jwt.sign(payload, secret, options);
}

export function verifyAuthToken(token: string): AuthPayload | null {
  const secret = resolveSecret();
  if (!secret) {
    return null;
  }

  try {
    return jwt.verify(token, secret) as AuthPayload;
  } catch {
    return null;
  }
}
