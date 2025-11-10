import { Hono, type Context } from "hono";
import { setCookie, deleteCookie } from "hono/cookie";
import { z } from "zod";
import * as bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import type { UserRole } from "@prisma/client";
import { signAuthToken } from "../lib/jwt.js";
import { authenticate, getAuthenticatedUser } from "../middleware/auth.js";
import { getUserRepository, getUserSessionRepository } from "../container.js";
import { resolveCookiePolicy } from "../lib/cookies.js";
import { createRateLimiter } from "../lib/rate-limiter.js";
import { hashToken } from "../lib/token-hash.js";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const router = new Hono();

const loginRateLimiter = createRateLimiter({
  limit: Number(process.env.LOGIN_RATE_LIMIT ?? "5"),
  windowMs: Number(process.env.LOGIN_RATE_LIMIT_WINDOW_MS ?? "60000"),
  errorMessage:
    "Demasiados intentos de inicio de sesión. Intenta nuevamente en unos minutos.",
  identifier: "authentication-login",
});

router.use("/login", loginRateLimiter);

const ACCESS_TOKEN_TTL_SECONDS = Number(
  process.env.AUTH_ACCESS_TOKEN_TTL_SECONDS ?? "3600",
);
const REFRESH_TOKEN_TTL_DAYS = Number(
  process.env.AUTH_REFRESH_TOKEN_TTL_DAYS ?? "7",
);

const refreshSchema = z.object({
  refreshToken: z.string().min(20),
});

type AuthContext = Context;

function extractClientIp(c: AuthContext): string | null {
  const forwarded = c.req.header("x-forwarded-for");
  if (forwarded) {
    const [first] = forwarded.split(",");
    if (first && first.trim()) {
      return first.trim();
    }
  }
  const realIp = c.req.header("x-real-ip");
  if (realIp) {
    return realIp;
  }
  return null;
}

type AuthUser = { id: string; email: string; role: UserRole };

async function issueUserSession(
  c: AuthContext,
  user: AuthUser,
  options: { revokeExisting?: boolean } = {},
) {
  const accessToken = signAuthToken(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
    },
    ACCESS_TOKEN_TTL_SECONDS,
  );
  const userSessionRepository = getUserSessionRepository();

  if (options.revokeExisting) {
    await userSessionRepository.revokeAllForUser(user.id, "rotated");
  }

  const now = Date.now();
  const accessExpiresAt = new Date(now + ACCESS_TOKEN_TTL_SECONDS * 1000);
  const refreshExpiresAt = new Date(
    now + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
  );
  const refreshToken = randomBytes(32).toString("hex");

  await userSessionRepository.create({
    userId: user.id,
    tokenHash: hashToken(refreshToken),
    expiresAt: refreshExpiresAt,
    userAgent: c.req.header("user-agent") ?? null,
    ipAddress: extractClientIp(c),
  });

  return {
    accessToken,
    refreshToken,
    accessExpiresAt,
    refreshExpiresAt,
  };
}

function attachAuthCookies(c: AuthContext, token: string, expiresAt: Date) {
  const { secure, sameSite } = resolveCookiePolicy(c);
  setCookie(c, "auth_token", token, {
    httpOnly: true,
    sameSite,
    secure,
    maxAge: Math.floor((expiresAt.getTime() - Date.now()) / 1000),
    path: "/",
    expires: expiresAt,
  });
}

function clearAuthCookies(c: AuthContext) {
  const { secure, sameSite } = resolveCookiePolicy(c);
  deleteCookie(c, "auth_token", { path: "/", secure, sameSite });
}

router.post("/login", async (c) => {
  const body = await c.req.json();
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const { email, password } = parsed.data;
  const userRepository = getUserRepository();
  const user = await userRepository.findAuthByEmail(email);

  if (!user) {
    return c.json({ error: "Invalid credentials" }, 401);
  }

  if (!user.isActive) {
    return c.json({ error: "Account has been deactivated" }, 403);
  }

  const namespace = bcrypt as unknown as {
    compare?: typeof bcrypt.compare;
    default?: { compare?: typeof bcrypt.compare };
  };
  const compareFn = namespace.compare ?? namespace.default?.compare;

  if (!compareFn) {
    console.error(
      "[auth] bcrypt.compare unavailable. Namespace keys:",
      Object.keys(namespace),
    );
    return c.json({ error: "Authentication service misconfigured" }, 500);
  }

  const isValid = await compareFn(password, user.passwordHash);
  if (!isValid) {
    return c.json({ error: "Invalid credentials" }, 401);
  }

  const { passwordHash: _passwordHash, ...publicUser } = user;
  void _passwordHash;

  const sessionTokens = await issueUserSession(c, publicUser as AuthUser, {
    revokeExisting: true,
  });
  attachAuthCookies(
    c,
    sessionTokens.accessToken,
    sessionTokens.accessExpiresAt,
  );

  return c.json({
    data: {
      id: publicUser.id,
      email: publicUser.email,
      role: publicUser.role,
    },
    token: sessionTokens.accessToken,
    refreshToken: sessionTokens.refreshToken,
    expiresAt: sessionTokens.accessExpiresAt.toISOString(),
    refreshExpiresAt: sessionTokens.refreshExpiresAt.toISOString(),
  });
});

router.post("/logout", authenticate, async (c) => {
  const authUser = getAuthenticatedUser(c);
  if (!authUser) {
    clearAuthCookies(c);
    return c.json({ error: "Unauthorized" }, 401);
  }
  const body = await c.req.json().catch(() => null);
  const parsedRefresh = refreshSchema.safeParse(body);
  if (parsedRefresh.success) {
    const userSessionRepository = getUserSessionRepository();
    await userSessionRepository.revokeByTokenHash(
      hashToken(parsedRefresh.data.refreshToken),
      "logout",
    );
  } else {
    const userSessionRepository = getUserSessionRepository();
    await userSessionRepository.revokeAllForUser(authUser.id, "logout");
  }
  clearAuthCookies(c);
  return c.json({ success: true });
});

router.post("/refresh", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = refreshSchema.safeParse(body);
  if (!parsed.success) {
    clearAuthCookies(c);
    return c.json({ error: "Unauthorized" }, 401);
  }

  const userSessionRepository = getUserSessionRepository();
  const existingSession = await userSessionRepository.findValidByTokenHash(
    hashToken(parsed.data.refreshToken),
  );

  if (!existingSession) {
    clearAuthCookies(c);
    return c.json({ error: "Unauthorized" }, 401);
  }

  const userRepository = getUserRepository();
  const user = await userRepository.findById(existingSession.userId);
  if (!user || !user.isActive) {
    await userSessionRepository.revokeById(existingSession.id, "user-disabled");
    clearAuthCookies(c);
    return c.json({ error: "Account has been deactivated" }, 403);
  }

  await userSessionRepository.revokeById(existingSession.id, "rotated");
  const sessionTokens = await issueUserSession(c, user as AuthUser);
  attachAuthCookies(
    c,
    sessionTokens.accessToken,
    sessionTokens.accessExpiresAt,
  );

  return c.json({
    data: {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    token: sessionTokens.accessToken,
    refreshToken: sessionTokens.refreshToken,
    expiresAt: sessionTokens.accessExpiresAt.toISOString(),
    refreshExpiresAt: sessionTokens.refreshExpiresAt.toISOString(),
  });
});

router.get("/me", authenticate, async (c) => {
  const authUser = getAuthenticatedUser(c);
  if (!authUser) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  return c.json({ data: authUser });
});

export default router;
