import { Hono } from "hono";
import { z } from "zod";
import { db } from "../lib/db";
import { verifyPassword } from "../lib/password";
import { generateAccessToken } from "../lib/token";
import { rateLimiter, RateLimits } from "../middleware/rate-limit";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const auth = new Hono();

// Apply strict rate limiting to auth routes
auth.use("/*", rateLimiter(RateLimits.auth));

auth.post("/login", async (c) => {
  const json = (await c.req.json()) as unknown;
  const parsed = credentialsSchema.safeParse(json);

  if (!parsed.success) {
    return c.json(
      {
        error: "Invalid credentials payload",
        details: parsed.error.flatten().fieldErrors,
      },
      400,
    );
  }

  const { email, password } = parsed.data;

  const user = await db.user.findUnique({
    where: { email },
  });

  if (!user?.passwordHash) {
    return c.json({ error: "Invalid email or password" }, 401);
  }

  const validPassword = await verifyPassword(password, user.passwordHash);
  if (!validPassword) {
    return c.json({ error: "Invalid email or password" }, 401);
  }

  const token = generateAccessToken({
    sub: user.id,
    email: user.email,
    role: user.role,
  });

  return c.json({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    token,
  });
});

export default auth;
