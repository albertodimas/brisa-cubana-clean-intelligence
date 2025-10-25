import { Hono } from "hono";
import { setCookie, deleteCookie } from "hono/cookie";
import { z } from "zod";
import { randomBytes, createHash } from "node:crypto";
import jwt from "jsonwebtoken";
import {
  getUserRepository,
  getMagicLinkTokenRepository,
} from "../container.js";
import { logger } from "../lib/logger.js";
import {
  sendPortalMagicLinkEmail,
  shouldExposeDebugToken,
} from "../services/magic-link-mailer.js";
import { authenticatePortal } from "../middleware/auth.js";
import { resolveCookiePolicy } from "../lib/cookies.js";
import { createRateLimiter } from "../lib/rate-limiter.js";

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

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

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

  logger.info(
    {
      email,
      expiresAt,
      delivery: delivery.delivered ? "sent" : delivery.reason,
    },
    "Magic link solicitado para cliente",
  );

  if (!delivery.delivered) {
    const status = delivery.reason === "not-configured" ? 503 : 500;
    return c.json(
      {
        error:
          delivery.reason === "not-configured"
            ? "No está configurado el correo de enlaces mágicos. Contacta al equipo de operaciones."
            : "No pudimos enviar el enlace mágico. Intenta más tarde.",
      },
      status,
    );
  }

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

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    return c.json({ error: "JWT_SECRET no configurado en el entorno" }, 500);
  }

  const userRepository = getUserRepository();
  const user = await userRepository.findByEmail(tokenRecord.email);
  if (!user || !user.isActive || user.role !== "CLIENT") {
    await magicLinkRepository.consume(tokenRecord.id);
    return c.json({ error: "Cuenta no habilitada para acceso portal" }, 400);
  }

  await magicLinkRepository.consume(tokenRecord.id);

  const sessionTtlSeconds = 60 * 60;
  const sessionExpiresAt = new Date(Date.now() + sessionTtlSeconds * 1000);

  const portalToken = jwt.sign(
    {
      sub: tokenRecord.email,
      scope: "portal-client",
    },
    jwtSecret,
    {
      expiresIn: "1h",
      audience: "portal-client",
      issuer: "brisa-cubana",
    },
  );

  const { secure, sameSite } = resolveCookiePolicy(c);

  setCookie(c, "portal_token", portalToken, {
    httpOnly: true,
    secure,
    sameSite,
    path: "/",
    maxAge: sessionTtlSeconds,
    expires: sessionExpiresAt,
  });

  setCookie(c, "portal_customer_id", user.id, {
    httpOnly: false,
    secure,
    sameSite,
    path: "/",
    maxAge: sessionTtlSeconds,
    expires: sessionExpiresAt,
  });

  return c.json({
    data: {
      portalToken,
      email: tokenRecord.email,
      customerId: user.id,
      expiresAt: sessionExpiresAt.toISOString(),
    },
  });
});

router.post("/logout", authenticatePortal, async (c) => {
  const portalAuth = c.get("portalAuth");
  const { secure, sameSite } = resolveCookiePolicy(c);

  deleteCookie(c, "portal_token", { path: "/", secure, sameSite });
  deleteCookie(c, "portal_customer_id", { path: "/", secure, sameSite });

  logger.info(
    {
      email: portalAuth?.email,
      type: "portal_logout",
    },
    "Portal logout solicitado",
  );
  return c.json({ success: true });
});

export default router;
