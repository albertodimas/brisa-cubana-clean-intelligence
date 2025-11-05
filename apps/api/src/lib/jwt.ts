import * as jwt from "jsonwebtoken";
import type { Secret, SignOptions } from "jsonwebtoken";
import type { UserRole } from "@prisma/client";
import { env } from "./env.js";

let cachedSecret: Secret | null = null;

function resolveSecret(): Secret {
  if (cachedSecret) {
    return cachedSecret;
  }

  cachedSecret = env.JWT_SECRET as Secret;
  return cachedSecret;
}

export type AuthPayload = {
  sub: string;
  email: string;
  role: UserRole;
};

export type PortalAuthPayload = {
  sub: string;
  scope: string;
  exp?: number;
  aud?: string | string[];
  iss?: string;
};

export function signAuthToken(
  payload: AuthPayload,
  expiresIn: SignOptions["expiresIn"] = "1d",
): string {
  const secret = resolveSecret();

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

export function verifyPortalToken(token: string): PortalAuthPayload | null {
  const secret = resolveSecret();

  const namespace = jwt as unknown as {
    verify?: typeof jwt.verify;
    default?: { verify?: typeof jwt.verify };
  };
  const verifyFn = namespace.verify ?? namespace.default?.verify;

  if (!verifyFn) {
    return null;
  }

  try {
    const decoded = verifyFn(token, secret);
    if (typeof decoded !== "object" || decoded === null) {
      return null;
    }

    const payload = decoded as jwt.JwtPayload;

    if (typeof payload.sub !== "string" || typeof payload.scope !== "string") {
      return null;
    }

    return {
      sub: payload.sub,
      scope: payload.scope,
      exp: payload.exp,
      aud: payload.aud,
      iss: payload.iss,
    };
  } catch {
    return null;
  }
}
