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

  const namespace = jwt as unknown as {
    sign?: typeof jwt.sign;
    default?: { sign?: typeof jwt.sign };
  };
  const signFn = namespace.sign ?? namespace.default?.sign;

  if (!signFn) {
    throw new Error("JWT sign function unavailable");
  }

  const options: SignOptions = { expiresIn };
  return signFn(payload, secret, options);
}

export function verifyAuthToken(token: string): AuthPayload | null {
  const secret = resolveSecret();
  if (!secret) {
    return null;
  }

  const namespace = jwt as unknown as {
    verify?: typeof jwt.verify;
    default?: { verify?: typeof jwt.verify };
  };
  const verifyFn = namespace.verify ?? namespace.default?.verify;

  if (!verifyFn) {
    return null;
  }

  try {
    return verifyFn(token, secret) as AuthPayload;
  } catch {
    return null;
  }
}
