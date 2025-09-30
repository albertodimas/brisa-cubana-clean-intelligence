import type { MiddlewareHandler } from "hono";
import type { UserRole } from "../generated/prisma";
import { verifyAccessToken, type AccessTokenPayload } from "../lib/token";

const AUTH_USER_KEY = "authUser";

export function getAuthUser(
  c: Parameters<MiddlewareHandler>[0],
): AccessTokenPayload | null {
  return (c.get(AUTH_USER_KEY) as AccessTokenPayload | undefined) ?? null;
}

export function requireAuth(allowedRoles?: UserRole[]): MiddlewareHandler {
  return async (c, next) => {
    const header = c.req.header("authorization") ?? "";
    const token = header.startsWith("Bearer ") ? header.slice(7).trim() : null;

    if (!token) {
      return c.json({ error: "Authorization header missing" }, 401);
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
