import nodemailer, { type Transporter } from "nodemailer";
import { logger } from "../lib/logger.js";

export type MagicLinkEmailPayload = {
  email: string;
  token: string;
  expiresAt: Date;
};

export type MagicLinkEmailResult =
  | { delivered: true; messageId: string }
  | {
      delivered: false;
      reason: "not-configured" | "invalid-config" | "error";
      error?: string;
    };

const DEFAULT_CONFIRMATION_PATH =
  process.env.PORTAL_MAGIC_LINK_CONFIRMATION_PATH ??
  "/clientes/acceso/confirmar";

const DEFAULT_PORTAL_BASE_URL =
  process.env.PORTAL_MAGIC_LINK_BASE_URL ??
  process.env.NEXT_PUBLIC_PORTAL_URL ??
  process.env.NEXT_PUBLIC_BASE_URL ??
  "https://brisacubanacleanintelligence.com";

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (transporter) {
    return transporter;
  }

  const host = process.env.PORTAL_MAGIC_LINK_SMTP_HOST;
  const portString = process.env.PORTAL_MAGIC_LINK_SMTP_PORT ?? "587";
  const user = process.env.PORTAL_MAGIC_LINK_SMTP_USER;
  const pass = process.env.PORTAL_MAGIC_LINK_SMTP_PASSWORD;
  const from = process.env.PORTAL_MAGIC_LINK_FROM;

  if (!host || !portString || !user || !pass || !from) {
    return null;
  }

  const port = Number.parseInt(portString, 10);

  transporter = nodemailer.createTransport({
    host,
    port,
    secure:
      process.env.PORTAL_MAGIC_LINK_SMTP_SECURE === "true" || port === 465,
    auth: {
      user,
      pass,
    },
  });

  return transporter;
}

export function buildPortalMagicLinkUrl(token: string): string {
  const url = new URL(DEFAULT_CONFIRMATION_PATH, DEFAULT_PORTAL_BASE_URL);
  url.searchParams.set("token", token);
  return url.toString();
}

export function shouldExposeDebugToken(): boolean {
  if (process.env.ENABLE_TEST_UTILS === "true") {
    return true;
  }

  if (process.env.PORTAL_MAGIC_LINK_EXPOSE_DEBUG === "false") {
    return false;
  }

  return process.env.NODE_ENV !== "production";
}

export async function sendPortalMagicLinkEmail(
  payload: MagicLinkEmailPayload,
): Promise<MagicLinkEmailResult> {
  if (process.env.ENABLE_TEST_UTILS === "true") {
    logger.warn(
      {
        email: payload.email,
      },
      "Magic link email skipped - test utils mode",
    );

    return { delivered: true, messageId: "test-utils-bypass" };
  }

  const mailTransporter = getTransporter();
  const from = process.env.PORTAL_MAGIC_LINK_FROM;
  const expiresIso = payload.expiresAt.toISOString();

  if (!mailTransporter || !from) {
    logger.warn(
      {
        email: payload.email,
      },
      "Magic link email skipped - SMTP not configured",
    );

    return { delivered: false, reason: "not-configured" };
  }

  const confirmationUrl = buildPortalMagicLinkUrl(payload.token);

  try {
    const info = await mailTransporter.sendMail({
      from,
      to: payload.email,
      subject: "Tu enlace de acceso al portal cliente Brisa Cubana",
      text: [
        "Hola,",
        "",
        "Recibimos tu solicitud para acceder al portal cliente de Brisa Cubana.",
        "Haz click en el siguiente enlace para iniciar sesión. El enlace expirará en la hora indicada abajo.",
        "",
        confirmationUrl,
        "",
        `Expira: ${expiresIso} (UTC)`,
        "",
        "Si no solicitaste este acceso, puedes ignorar este correo.",
        "",
        "Equipo Brisa Cubana",
      ].join("\n"),
      html: `
        <p>Hola,</p>
        <p>Recibimos tu solicitud para acceder al portal cliente de <strong>Brisa Cubana</strong>.</p>
        <p>
          Haz click en el siguiente enlace para iniciar sesión (válido hasta
          <strong>${expiresIso} UTC</strong>):
        </p>
        <p><a href="${confirmationUrl}">${confirmationUrl}</a></p>
        <p>Si no solicitaste este acceso, puedes ignorar este correo.</p>
        <p>Equipo Brisa Cubana</p>
      `,
    });

    logger.info(
      {
        email: payload.email,
        messageId: info.messageId,
      },
      "Magic link email dispatched",
    );

    return { delivered: true, messageId: info.messageId };
  } catch (error) {
    logger.error(
      {
        email: payload.email,
        err: error,
      },
      "Magic link email failed",
    );

    return {
      delivered: false,
      reason: "error",
      error: error instanceof Error ? error.message : "unknown error",
    };
  }
}
