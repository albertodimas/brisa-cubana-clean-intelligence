import { logger } from "../lib/logger.js";
import type { NotificationType } from "@prisma/client";
import {
  markNotificationAsSent,
  markNotificationAsFailed,
} from "./notification-service.js";

export type SmsNotificationPayload = {
  notificationId: string;
  to: string;
  message: string;
  type: NotificationType;
};

export type SmsNotificationResult =
  | { delivered: true; messageId: string }
  | { delivered: false; reason: string; error?: string };

/**
 * Twilio client instance (lazy-loaded)
 */
let twilioClient: any = null;
let twilioClientInit: Promise<any | null> | null = null;

async function getTwilioClient(): Promise<any | null> {
  if (twilioClient) {
    return twilioClient;
  }

  if (twilioClientInit) {
    return twilioClientInit;
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    return null;
  }

  twilioClientInit = import("twilio")
    .then((module) => {
      const Twilio = module.default ?? module;
      twilioClient = Twilio(accountSid, authToken);
      return twilioClient;
    })
    .catch((error) => {
      logger.error(
        {
          err: error,
        },
        "Failed to initialize Twilio client",
      );
      twilioClient = null;
      return null;
    });

  return twilioClientInit;
}

/**
 * Sends an SMS notification via Twilio
 */
export async function sendSmsNotification(
  payload: SmsNotificationPayload,
): Promise<SmsNotificationResult> {
  if (process.env.ENABLE_TEST_UTILS === "true") {
    logger.warn(
      {
        notificationId: payload.notificationId,
        to: payload.to,
        type: payload.type,
      },
      "SMS notification skipped - test utils mode",
    );

    await markNotificationAsSent(payload.notificationId, {
      messageId: "test-utils-bypass",
    });

    return { delivered: true, messageId: "test-utils-bypass" };
  }

  const client = await getTwilioClient();
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!client || !fromNumber) {
    logger.warn(
      {
        notificationId: payload.notificationId,
        to: payload.to,
        type: payload.type,
      },
      "SMS notification skipped - Twilio not configured",
    );

    await markNotificationAsFailed(
      payload.notificationId,
      "Twilio not configured",
    );

    return { delivered: false, reason: "not-configured" };
  }

  try {
    const message = await client.messages.create({
      body: payload.message,
      from: fromNumber,
      to: payload.to,
    });

    logger.info(
      {
        notificationId: payload.notificationId,
        to: payload.to,
        messageId: message.sid,
        type: payload.type,
      },
      "SMS notification dispatched",
    );

    await markNotificationAsSent(payload.notificationId, {
      messageId: message.sid,
      twilioStatus: message.status,
    });

    return { delivered: true, messageId: message.sid };
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
      "SMS notification failed",
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
 * Verifies Twilio configuration
 */
export async function verifySmsConfiguration(): Promise<boolean> {
  const client = await getTwilioClient();

  if (!client) {
    return false;
  }

  try {
    // Verify by fetching account details
    await client.api.accounts(process.env.TWILIO_ACCOUNT_SID).fetch();
    return true;
  } catch (error) {
    logger.error(
      {
        err: error,
      },
      "SMS configuration verification failed",
    );
    return false;
  }
}
