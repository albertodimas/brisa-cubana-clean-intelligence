import { Hono } from "hono";
import { z } from "zod";
import { db } from "../lib/db";
import { verifyPassword } from "../lib/password";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  revokeRefreshToken,
  revokeAllRefreshTokens,
} from "../lib/token";
import { rateLimiter, RateLimits } from "../middleware/rate-limit";
import { requireAuth } from "../middleware/auth";
import { requireAuthUser } from "../lib/auth-helpers";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
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

  // Generate both access and refresh tokens
  const accessToken = generateAccessToken({
    sub: user.id,
    email: user.email,
    role: user.role,
  });

  const refreshToken = await generateRefreshToken(user.id);

  return c.json({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    accessToken,
    refreshToken,
    // Legacy field for backwards compatibility
    token: accessToken,
  });
});

// Refresh token endpoint with rotation
auth.post("/refresh", async (c) => {
  const json = (await c.req.json()) as unknown;
  const parsed = refreshTokenSchema.safeParse(json);

  if (!parsed.success) {
    return c.json(
      {
        error: "Invalid refresh token payload",
        details: parsed.error.flatten().fieldErrors,
      },
      400,
    );
  }

  const payload = await verifyRefreshToken(parsed.data.refreshToken);

  if (!payload) {
    return c.json({ error: "Invalid or expired refresh token" }, 401);
  }

  // Get user data
  const user = await db.user.findUnique({
    where: { id: payload.sub },
  });

  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  // Revoke old refresh token (rotation)
  await revokeRefreshToken(payload.tokenId);

  // Generate new tokens
  const accessToken = generateAccessToken({
    sub: user.id,
    email: user.email,
    role: user.role,
  });

  const newRefreshToken = await generateRefreshToken(user.id);

  return c.json({
    accessToken,
    refreshToken: newRefreshToken,
    // Legacy field
    token: accessToken,
  });
});

// Logout endpoint - revokes all refresh tokens
auth.post("/logout", requireAuth(), async (c) => {
  const authUser = requireAuthUser(c);

  // Revoke all refresh tokens for this user
  await revokeAllRefreshTokens(authUser.sub);

  return c.json({ message: "Logged out successfully" });
});

export default auth;
