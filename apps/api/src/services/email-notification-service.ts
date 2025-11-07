import nodemailer, { type Transporter } from "nodemailer";
import { logger } from "../lib/logger.js";
import type { NotificationType } from "@prisma/client";
import {
  markNotificationAsSent,
  markNotificationAsFailed,
} from "./notification-service.js";

export type EmailNotificationPayload = {
  notificationId: string;
  to: string;
  subject: string;
  text: string;
  html: string;
  type: NotificationType;
};

export type EmailNotificationResult =
  | { delivered: true; messageId: string }
  | { delivered: false; reason: string; error?: string };

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (transporter) {
    return transporter;
  }

  const host = process.env.NOTIFICATION_SMTP_HOST;
  const portString = process.env.NOTIFICATION_SMTP_PORT ?? "587";
  const user = process.env.NOTIFICATION_SMTP_USER;
  const pass = process.env.NOTIFICATION_SMTP_PASSWORD;
  const from = process.env.NOTIFICATION_FROM_EMAIL;

  if (!host || !portString || !user || !pass || !from) {
    return null;
  }

  const port = Number.parseInt(portString, 10);

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: process.env.NOTIFICATION_SMTP_SECURE === "true" || port === 465,
    auth: {
      user,
      pass,
    },
  });

  return transporter;
}

/**
 * Sends an email notification
 */
export async function sendEmailNotification(
  payload: EmailNotificationPayload,
): Promise<EmailNotificationResult> {
  if (process.env.ENABLE_TEST_UTILS === "true") {
    logger.warn(
      {
        notificationId: payload.notificationId,
        to: payload.to,
        type: payload.type,
      },
      "Email notification skipped - test utils mode",
    );

    await markNotificationAsSent(payload.notificationId, {
      messageId: "test-utils-bypass",
    });

    return { delivered: true, messageId: "test-utils-bypass" };
  }

  const mailTransporter = getTransporter();
  const from = process.env.NOTIFICATION_FROM_EMAIL;

  if (!mailTransporter || !from) {
    logger.warn(
      {
        notificationId: payload.notificationId,
        to: payload.to,
        type: payload.type,
      },
      "Email notification skipped - SMTP not configured",
    );

    await markNotificationAsFailed(
      payload.notificationId,
      "SMTP not configured",
    );

    return { delivered: false, reason: "not-configured" };
  }

  try {
    const info = await mailTransporter.sendMail({
      from,
      to: payload.to,
      subject: payload.subject,
      text: payload.text,
      html: payload.html,
    });

    logger.info(
      {
        notificationId: payload.notificationId,
        to: payload.to,
        messageId: info.messageId,
        type: payload.type,
      },
      "Email notification dispatched",
    );

    await markNotificationAsSent(payload.notificationId, {
      messageId: info.messageId,
    });

    return { delivered: true, messageId: info.messageId };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "unknown error";

    logger.error(
      {
        notificationId: payload.notificationId,
        to: payload.to,
        type: payload.type,
        err: error,
      },
      "Email notification failed",
    );

    await markNotificationAsFailed(payload.notificationId, errorMessage);

    return {
      delivered: false,
      reason: "error",
      error: errorMessage,
    };
  }
}

/**
 * Verifies SMTP configuration
 */
export async function verifyEmailConfiguration(): Promise<boolean> {
  const mailTransporter = getTransporter();

  if (!mailTransporter) {
    return false;
  }

  try {
    await mailTransporter.verify();
    return true;
  } catch (error) {
    logger.error(
      {
        err: error,
      },
      "Email configuration verification failed",
    );
    return false;
  }
}
