import { Hono } from "hono";
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

  await magicLinkRepository.consume(tokenRecord.id);

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    return c.json({ error: "JWT_SECRET no configurado en el entorno" }, 500);
  }

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

  return c.json({
    data: {
      portalToken,
      email: tokenRecord.email,
    },
  });
});

export default router;
