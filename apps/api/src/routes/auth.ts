import type { Context } from "hono";
import { Hono } from "hono";
import { setCookie, deleteCookie } from "hono/cookie";
import { z } from "zod";
import * as bcrypt from "bcryptjs";
import honoRateLimiter from "hono-rate-limiter";
import { prisma } from "../lib/prisma.js";
import { signAuthToken, verifyAuthToken } from "../lib/jwt.js";
import { authenticate, getAuthenticatedUser } from "../middleware/auth.js";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const router = new Hono();

const { rateLimiter } = honoRateLimiter as any;

const loginRateLimiter = rateLimiter({
  windowMs: Number(process.env.LOGIN_RATE_LIMIT_WINDOW_MS ?? "60000"),
  limit: Number(process.env.LOGIN_RATE_LIMIT ?? "5"),
  standardHeaders: "draft-7",
  keyGenerator: (c: Context) => {
    const forwarded = c.req.header("x-forwarded-for");
    if (forwarded) {
      return forwarded.split(",")[0]?.trim() ?? forwarded;
    }
    const realIp =
      c.req.header("x-real-ip") ??
      c.req.header("cf-connecting-ip") ??
      c.req.header("fastly-client-ip");
    if (realIp) {
      return realIp;
    }
    const fallback =
      c.req.raw.headers.get("x-forwarded-for") ??
      c.req.raw.headers.get("x-real-ip") ??
      c.req.raw.headers.get("cf-connecting-ip") ??
      c.req.header("user-agent") ??
      "anonymous";
    return fallback;
  },
  handler: async (ctx: Context) =>
    ctx.json(
      { error: "Too many login attempts. Please wait before retrying." },
      429,
    ),
});

type SameSitePolicy = "lax" | "strict";

function resolveCookiePolicy(c: Context): {
  secure: boolean;
  sameSite: SameSitePolicy;
} {
  if (process.env.NODE_ENV === "production") {
    return { secure: true, sameSite: "strict" };
  }
  const forwardedProto = c.req.header("x-forwarded-proto");
  const secure = forwardedProto === "https" || c.req.url.startsWith("https");
  return { secure, sameSite: secure ? "strict" : "lax" };
}

router.use("/login", loginRateLimiter);

router.post("/login", async (c) => {
  const body = await c.req.json();
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return c.json({ error: "Invalid credentials" }, 401);
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

  const token = signAuthToken({
    sub: user.id,
    email: user.email,
    role: user.role,
  });

  const { secure, sameSite } = resolveCookiePolicy(c);

  setCookie(c, "auth_token", token, {
    httpOnly: true,
    sameSite,
    secure,
    maxAge: 60 * 60 * 24,
    path: "/",
  });

  return c.json({
    data: {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    token,
  });
});

router.post("/logout", (c) => {
  const { secure, sameSite } = resolveCookiePolicy(c);
  deleteCookie(c, "auth_token", { path: "/", secure, sameSite });
  return c.json({ success: true });
});

router.get("/me", authenticate, async (c) => {
  const authUser = getAuthenticatedUser(c);
  if (!authUser) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  return c.json({ data: authUser });
});

router.post("/verify", async (c) => {
  const body = await c.req.json();
  const token = typeof body?.token === "string" ? body.token : undefined;
  if (!token) {
    return c.json({ valid: false }, 400);
  }

  const payload = verifyAuthToken(token);
  return c.json({ valid: Boolean(payload) });
});

export default router;
