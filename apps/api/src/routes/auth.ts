import { Hono } from "hono";
import { setCookie, deleteCookie } from "hono/cookie";
import { z } from "zod";
import * as bcrypt from "bcryptjs";
import { signAuthToken } from "../lib/jwt.js";
import { authenticate, getAuthenticatedUser } from "../middleware/auth.js";
import { getUserRepository } from "../container.js";
import { resolveCookiePolicy } from "../lib/cookies.js";
import { createRateLimiter } from "../lib/rate-limiter.js";

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

  const token = signAuthToken({
    sub: publicUser.id,
    email: publicUser.email,
    role: publicUser.role,
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
      id: publicUser.id,
      email: publicUser.email,
      role: publicUser.role,
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

export default router;
