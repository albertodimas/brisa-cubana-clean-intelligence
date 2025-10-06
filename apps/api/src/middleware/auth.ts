import type { Context, MiddlewareHandler } from "hono";
import type { UserRole } from "../generated/prisma";
import { verifyAccessToken, type AccessTokenPayload } from "../lib/token";
import { getAccessTokenCookie } from "../lib/cookies";

const AUTH_USER_KEY = "authUser";

export function getAuthUser(c: Context): AccessTokenPayload | null {
  const payload = c.get(AUTH_USER_KEY) as AccessTokenPayload | undefined | null;
  return payload ?? null;
}

export function requireAuth(allowedRoles?: UserRole[]): MiddlewareHandler {
  return async (c, next) => {
    // Try HttpOnly cookie first (new secure method)
    let token = getAccessTokenCookie(c);

    // Fallback to Authorization header for backward compatibility
    if (!token) {
      const header = c.req.header("authorization") ?? "";
      token = header.startsWith("Bearer ")
        ? header.slice(7).trim() || undefined
        : undefined;
    }

    if (!token) {
      return c.json(
        { error: "Authentication required (cookie or header)" },
        401,
      );
    }

    const payload = verifyAccessToken(token);
    if (!payload) {
      return c.json({ error: "Invalid or expired token" }, 401);
    }

    if (allowedRoles && !allowedRoles.includes(payload.role)) {
      return c.json({ error: "Forbidden" }, 403);
    }

    c.set(AUTH_USER_KEY, payload);
    await next();
  };
}

export { AUTH_USER_KEY };
