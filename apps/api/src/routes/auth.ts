import type { Context } from "hono";
import { Hono } from "hono";
import { setCookie, deleteCookie } from "hono/cookie";
import { z } from "zod";
import honoRateLimiter from "hono-rate-limiter";
import type { PublicAuthUser } from "@brisa/core";
import { authenticate, getAuthenticatedUser } from "../middleware/auth.js";
import { getAuthService } from "../container.js";
import { resolveCookiePolicy } from "../lib/cookies.js";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const registerRoles = ["CLIENT", "COORDINATOR"] as const;

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(1).max(120).optional(),
  role: z.enum(registerRoles).optional(),
});

const verificationSchema = z.object({
  email: z.string().email(),
  code: z.string().min(4).max(10),
});

const resendSchema = z.object({
  email: z.string().email(),
});

const forgotSchema = z.object({
  email: z.string().email(),
});

const resetSchema = z.object({
  email: z.string().email(),
  code: z.string().min(4).max(10),
  password: z.string().min(8),
});

const router = new Hono();

const { rateLimiter } = honoRateLimiter as any;

function serializeUser(user: PublicAuthUser) {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

function shouldExposeDebugCodes(): boolean {
  if (process.env.AUTH_DEBUG_CODES === "true") {
    return true;
  }
  if (process.env.AUTH_DEBUG_CODES === "false") {
    return false;
  }
  return process.env.NODE_ENV !== "production";
}

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

router.use("/login", loginRateLimiter);

router.post("/login", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const authService = getAuthService();
  const result = await authService.login(parsed.data);

  if (result.status === "invalid-credentials") {
    return c.json({ error: "Invalid credentials" }, 401);
  }

  if (result.status === "inactive") {
    return c.json({ error: "Account has been deactivated" }, 403);
  }

  const { secure, sameSite } = resolveCookiePolicy(c);

  setCookie(c, "auth_token", result.token, {
    httpOnly: true,
    sameSite,
    secure,
    maxAge: 60 * 60 * 24,
    path: "/",
  });

  return c.json({
    data: {
      id: result.user.id,
      email: result.user.email,
      role: result.user.role,
    },
    token: result.token,
  });
});

router.post("/register", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const authService = getAuthService();
  const result = await authService.register({
    email: parsed.data.email,
    password: parsed.data.password,
    fullName: parsed.data.fullName,
    role: parsed.data.role,
  });

  if (result.status === "pending-verification") {
    const debug = shouldExposeDebugCodes();
    return c.json(
      {
        message: "Verification code sent",
        data: {
          user: serializeUser(result.user),
          verification: {
            expiresAt: result.verification.expiresAt.toISOString(),
            ...(debug ? { code: result.verification.code } : {}),
          },
        },
      },
      201,
    );
  }

  if (result.status === "already-active") {
    return c.json(
      {
        error: "Account already verified",
        data: serializeUser(result.user),
      },
      409,
    );
  }

  return c.json({ error: "Email is already in use" }, 409);
});

router.post("/register/verify", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = verificationSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const authService = getAuthService();
  const result = await authService.verifyRegistration(parsed.data);

  if (result.status === "verified" || result.status === "already-active") {
    return c.json({
      message:
        result.status === "verified"
          ? "Account verified"
          : "Account already verified",
      data: serializeUser(result.user),
    });
  }

  if (result.status === "expired-code") {
    return c.json({ error: "Verification code expired" }, 410);
  }

  return c.json({ error: "Invalid verification code" }, 400);
});

router.post("/register/resend", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = resendSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const authService = getAuthService();
  const result = await authService.resendVerification(parsed.data);
  const debug = shouldExposeDebugCodes();

  if (result.status === "sent") {
    const verificationPayload = result.verification
      ? {
          expiresAt: result.verification.expiresAt.toISOString(),
          ...(debug ? { code: result.verification.code } : {}),
        }
      : undefined;

    const responseBody: Record<string, unknown> = {
      message: "If the account exists, a verification code has been sent.",
    };

    if (verificationPayload) {
      responseBody.data = verificationPayload;
    }

    return c.json({
      ...responseBody,
    });
  }

  if (result.status === "already-active") {
    return c.json({
      message: "Account already verified",
      data: serializeUser(result.user),
    });
  }

  return c.json({
    message: "If the account exists, a verification code has been sent.",
  });
});

router.post("/forgot-password", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = forgotSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const authService = getAuthService();
  const result = await authService.requestPasswordReset(parsed.data);
  const debug = shouldExposeDebugCodes();

  const payload: Record<string, unknown> = {
    message: "If the account exists, a reset code has been sent.",
  };

  if (result.verification && debug) {
    payload.data = {
      expiresAt: result.verification.expiresAt.toISOString(),
      code: result.verification.code,
    };
  }

  return c.json(payload);
});

router.post("/reset-password", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = resetSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const authService = getAuthService();
  const result = await authService.resetPassword({
    email: parsed.data.email,
    code: parsed.data.code,
    newPassword: parsed.data.password,
  });

  if (result.status === "reset") {
    return c.json({
      message: "Password updated",
      data: serializeUser(result.user),
    });
  }

  if (result.status === "expired-code") {
    return c.json({ error: "Reset code expired" }, 410);
  }

  if (result.status === "not-found") {
    return c.json({ error: "Account not found" }, 404);
  }

  return c.json({ error: "Invalid reset code" }, 400);
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

export default router;
