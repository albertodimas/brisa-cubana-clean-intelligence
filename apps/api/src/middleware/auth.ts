import type { MiddlewareHandler } from "hono";
import { getCookie } from "hono/cookie";
import type { UserRole } from "@prisma/client";
import { verifyAuthToken } from "../lib/jwt";

const API_TOKEN = process.env.API_TOKEN ?? null;

type AuthInfo = {
  id: string;
  email: string;
  role: UserRole;
  kind: "user" | "service";
};

declare module "hono" {
  interface ContextVariableMap {
    authUser?: AuthInfo;
  }
}

function extractBearerToken(header: string | undefined | null): string | null {
  if (!header) return null;
  const [scheme, token] = header.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return null;
  }
  return token;
}

export const authenticate: MiddlewareHandler = async (c, next) => {
  const headerToken = extractBearerToken(c.req.header("authorization"));
  const cookieToken = getCookie(c, "auth_token");
  const token = headerToken ?? cookieToken ?? null;

  if (token && API_TOKEN && token === API_TOKEN) {
    c.set("authUser", {
      id: "service-account",
      email: "service@brisacubanaclean.com",
      role: "ADMIN",
      kind: "service",
    });
    await next();
    return;
  }

  if (!token) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const payload = verifyAuthToken(token);
  if (!payload) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  c.set("authUser", {
    id: payload.sub,
    email: payload.email,
    role: payload.role,
    kind: "user",
  });

  await next();
};

export const requireRoles = (roles: UserRole[]): MiddlewareHandler => {
  return async (c, next) => {
    const authUser = c.get("authUser");
    if (!authUser) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    if (!roles.includes(authUser.role)) {
      return c.json({ error: "Forbidden" }, 403);
    }

    await next();
  };
};

export function getAuthenticatedUser(c: Parameters<MiddlewareHandler>[0]): AuthInfo | undefined {
  return c.get("authUser");
}
