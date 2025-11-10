import { Hono, type Context } from "hono";
import { setCookie, deleteCookie, getCookie } from "hono/cookie";
import { z } from "zod";
import { randomBytes } from "node:crypto";
import jwt from "jsonwebtoken";
import {
  getUserRepository,
  getMagicLinkTokenRepository,
  getPortalSessionRepository,
} from "../container.js";
import { logger } from "../lib/logger.js";
import {
  sendPortalMagicLinkEmail,
  shouldExposeDebugToken,
} from "../services/magic-link-mailer.js";
import { authenticatePortal } from "../middleware/auth.js";
import { resolveCookiePolicy } from "../lib/cookies.js";
import { createRateLimiter } from "../lib/rate-limiter.js";
import { hashToken } from "../lib/token-hash.js";
import {
  PORTAL_ACCESS_COOKIE_NAME,
  PORTAL_CUSTOMER_COOKIE_NAME,
  PORTAL_REFRESH_COOKIE_NAME,
} from "../lib/portal-session-constants.js";

const router = new Hono();

const requestSchema = z.object({
  email: z.string().email(),
});

const verifySchema = z.object({
  token: z.string().min(20),
});

const MAGIC_LINK_TTL_MINUTES = Number.parseInt(
  process.env.MAGIC_LINK_TTL_MINUTES ?? "15",
  10,
);

const PORTAL_ACCESS_TOKEN_TTL_SECONDS = Number.parseInt(
  process.env.PORTAL_ACCESS_TOKEN_TTL_SECONDS ?? "3600",
  10,
);

const PORTAL_REFRESH_TOKEN_TTL_DAYS = Number.parseInt(
  process.env.PORTAL_REFRESH_TOKEN_TTL_DAYS ?? "30",
  10,
);

const portalRequestRateLimiter = createRateLimiter({
  limit: Number(process.env.PORTAL_MAGIC_LINK_RATE_LIMIT ?? "3"),
  windowMs: Number(process.env.PORTAL_MAGIC_LINK_WINDOW_MS ?? "900000"),
  errorMessage:
    "Demasiadas solicitudes de enlace mágico. Intenta nuevamente más tarde.",
  identifier: "portal-magic-link-request",
});

const portalVerifyRateLimiter = createRateLimiter({
  limit: Number(process.env.PORTAL_MAGIC_LINK_VERIFY_RATE_LIMIT ?? "5"),
  windowMs: Number(process.env.PORTAL_MAGIC_LINK_VERIFY_WINDOW_MS ?? "900000"),
  errorMessage:
    "Demasiados intentos de verificación. Intenta nuevamente más tarde.",
  identifier: "portal-magic-link-verify",
});

router.use("/request", portalRequestRateLimiter);
router.use("/verify", portalVerifyRateLimiter);

function extractClientIp(c: Context): string | null {
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

function buildPortalJwtSecret() {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error("JWT_SECRET no configurado en el entorno");
  }
  return jwtSecret;
}

async function issuePortalSessionCookies(
  c: Context,
  user: { id: string; email: string },
  options: { revokeExisting?: boolean } = {},
) {
  const jwtSecret = buildPortalJwtSecret();
  const sessionRepository = getPortalSessionRepository();
  const now = Date.now();
  const accessExpiresAt = new Date(
    now + PORTAL_ACCESS_TOKEN_TTL_SECONDS * 1000,
  );
  const refreshExpiresAt = new Date(
    now + PORTAL_REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
  );

  if (options.revokeExisting) {
    await sessionRepository.revokeAllForEmail(user.email, "rotated");
  }

  const portalToken = jwt.sign(
    {
      sub: user.email,
      scope: "portal-client",
    },
    jwtSecret,
    {
      expiresIn: PORTAL_ACCESS_TOKEN_TTL_SECONDS,
      audience: "portal-client",
      issuer: "brisa-cubana",
    },
  );

  const refreshToken = randomBytes(32).toString("hex");
  await sessionRepository.create({
    email: user.email,
    tokenHash: hashToken(refreshToken),
    expiresAt: refreshExpiresAt,
    userAgent: c.req.header("user-agent") ?? null,
    ipAddress: extractClientIp(c),
  });

  const { secure, sameSite } = resolveCookiePolicy(c);

  setCookie(c, PORTAL_ACCESS_COOKIE_NAME, portalToken, {
    httpOnly: true,
    secure,
    sameSite,
    path: "/",
    maxAge: PORTAL_ACCESS_TOKEN_TTL_SECONDS,
    expires: accessExpiresAt,
  });

  setCookie(c, PORTAL_REFRESH_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure,
    sameSite,
    path: "/",
    maxAge: PORTAL_REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60,
    expires: refreshExpiresAt,
  });

  setCookie(c, PORTAL_CUSTOMER_COOKIE_NAME, user.id, {
    httpOnly: false,
    secure,
    sameSite,
    path: "/",
    maxAge: PORTAL_REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60,
    expires: refreshExpiresAt,
  });

  return {
    portalToken,
    email: user.email,
    customerId: user.id,
    expiresAt: accessExpiresAt.toISOString(),
    refreshExpiresAt: refreshExpiresAt.toISOString(),
  };
}

function clearPortalCookies(c: Context) {
  const { secure, sameSite } = resolveCookiePolicy(c);
  deleteCookie(c, PORTAL_ACCESS_COOKIE_NAME, { path: "/", secure, sameSite });
  deleteCookie(c, PORTAL_REFRESH_COOKIE_NAME, { path: "/", secure, sameSite });
  deleteCookie(c, PORTAL_CUSTOMER_COOKIE_NAME, { path: "/", secure, sameSite });
}

router.post("/request", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const { email } = parsed.data;
  const userRepository = getUserRepository();
  const magicLinkRepository = getMagicLinkTokenRepository();

  const user = await userRepository.findByEmail?.(email);
  if (!user || !user.isActive || user.role !== "CLIENT") {
    return c.json(
      { message: "Si tu cuenta existe, recibirás un enlace." },
      200,
    );
  }

  await magicLinkRepository.invalidateExpiredForEmail(email);

  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + MAGIC_LINK_TTL_MINUTES * 60 * 1000);

  await magicLinkRepository.create({
    email,
    tokenHash,
    expiresAt,
  });

  const delivery = await sendPortalMagicLinkEmail({
    email,
    token: rawToken,
    expiresAt,
  });

  if (!delivery.delivered) {
    logger.warn(
      {
        email,
        expiresAt,
        delivery: delivery.reason,
        ...(delivery.error ? { errorDetail: delivery.error } : {}),
      },
      "Magic link email no enviado",
    );
    const status = delivery.reason === "not-configured" ? 503 : 500;
    return c.json(
      {
        error:
          delivery.reason === "not-configured"
            ? "No está configurado el correo de enlaces mágicos. Contacta al equipo de operaciones."
            : "No pudimos enviar el enlace mágico. Intenta más tarde.",
        ...(delivery.error ? { detail: delivery.error } : {}),
      },
      status,
    );
  }

  logger.info(
    {
      email,
      expiresAt,
      delivery: "sent",
    },
    "Magic link solicitado para cliente",
  );

  const responsePayload: Record<string, unknown> = {
    message: "Enlace de acceso enviado.",
    expiresAt: expiresAt.toISOString(),
  };

  if (shouldExposeDebugToken()) {
    responsePayload.debugToken = rawToken;
  }

  return c.json(responsePayload);
});

router.post("/verify", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = verifySchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const tokenHash = hashToken(parsed.data.token);
  const magicLinkRepository = getMagicLinkTokenRepository();
  const tokenRecord = await magicLinkRepository.findValidByHash(tokenHash);

  if (!tokenRecord) {
    return c.json({ error: "Token inválido o expirado" }, 400);
  }

  const userRepository = getUserRepository();
  const user = await userRepository.findByEmail(tokenRecord.email);
  if (!user || !user.isActive || user.role !== "CLIENT") {
    await magicLinkRepository.consume(tokenRecord.id);
    return c.json({ error: "Cuenta no habilitada para acceso portal" }, 400);
  }

  await magicLinkRepository.consume(tokenRecord.id);

  const sessionPayload = await issuePortalSessionCookies(c, user, {
    revokeExisting: true,
  });

  return c.json({
    data: sessionPayload,
  });
});

router.post("/logout", authenticatePortal, async (c) => {
  const portalAuth = c.get("portalAuth");
  const refreshToken = getCookie(c, PORTAL_REFRESH_COOKIE_NAME);
  if (refreshToken) {
    try {
      await getPortalSessionRepository().revokeByTokenHash(
        hashToken(refreshToken),
        "logout",
      );
    } catch (error) {
      logger.warn(
        {
          error: error instanceof Error ? error.message : String(error),
        },
        "No se pudo revocar el refresh token del portal en logout",
      );
    }
  }

  clearPortalCookies(c);

  logger.info(
    {
      email: portalAuth?.email,
      type: "portal_logout",
    },
    "Portal logout solicitado",
  );
  return c.json({ success: true });
});

router.post("/refresh", async (c) => {
  const refreshToken = getCookie(c, PORTAL_REFRESH_COOKIE_NAME);
  if (!refreshToken) {
    clearPortalCookies(c);
    return c.json({ error: "Unauthorized" }, 401);
  }

  const portalSessionRepository = getPortalSessionRepository();
  const existingSession = await portalSessionRepository.findValidByTokenHash(
    hashToken(refreshToken),
  );

  if (!existingSession) {
    clearPortalCookies(c);
    return c.json({ error: "Unauthorized" }, 401);
  }

  const userRepository = getUserRepository();
  const user = await userRepository.findByEmail(existingSession.email);
  if (!user || !user.isActive || user.role !== "CLIENT") {
    await portalSessionRepository.revokeById(
      existingSession.id,
      "user-not-eligible",
    );
    clearPortalCookies(c);
    return c.json({ error: "Cuenta no habilitada para portal" }, 403);
  }

  await portalSessionRepository.revokeById(existingSession.id, "rotated");
  const sessionPayload = await issuePortalSessionCookies(c, user);

  logger.info(
    {
      email: user.email,
      customerId: user.id,
      type: "portal_refresh",
    },
    "Portal session refreshed via refresh token",
  );

  return c.json({
    data: sessionPayload,
  });
});

export default router;
