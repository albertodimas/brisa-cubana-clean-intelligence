import { Hono } from "hono";
import { setCookie, deleteCookie } from "hono/cookie";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
import { signAuthToken, verifyAuthToken } from "../lib/jwt";
import { authenticate, getAuthenticatedUser } from "../middleware/auth";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const router = new Hono();

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

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    return c.json({ error: "Invalid credentials" }, 401);
  }

  const token = signAuthToken({ sub: user.id, email: user.email, role: user.role });

  const secure = c.req.header("x-forwarded-proto") === "https" || c.req.url.startsWith("https");

  setCookie(c, "auth_token", token, {
    httpOnly: true,
    sameSite: "lax",
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
  deleteCookie(c, "auth_token", { path: "/" });
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
