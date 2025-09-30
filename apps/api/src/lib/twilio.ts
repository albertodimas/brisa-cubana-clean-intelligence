import twilio from "twilio";
import { logger } from "./logger";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const phoneNumber = process.env.TWILIO_PHONE_NUMBER;
const whatsappFrom = process.env.TWILIO_WHATSAPP_FROM;

let twilioClient: ReturnType<typeof twilio> | null = null;

export function getTwilioClient() {
  if (!accountSid || !authToken) {
    logger.warn(
      "Twilio credentials not configured. Notifications will be disabled.",
    );
    return null;
  }

  if (!twilioClient) {
    twilioClient = twilio(accountSid, authToken);
    logger.info("Twilio client initialized successfully");
  }

  return twilioClient;
}

export function twilioEnabled(): boolean {
  return !!(accountSid && authToken && (phoneNumber ?? whatsappFrom));
}

export function getPhoneNumber(): string | undefined {
  return phoneNumber;
}

export function getWhatsAppNumber(): string | undefined {
  return whatsappFrom;
}

interface SendSMSParams {
  to: string;
  body: string;
}

interface SendWhatsAppParams {
  to: string;
  body: string;
}

export async function sendSMS({
  to,
  body,
}: SendSMSParams): Promise<{ success: boolean; messageId?: string }> {
  const client = getTwilioClient();

  if (!client || !phoneNumber) {
    logger.warn("SMS sending skipped: Twilio not configured");
    return { success: false };
  }

  try {
    const message = await client.messages.create({
      from: phoneNumber,
      to,
      body,
    });

    logger.info({ messageId: message.sid, to }, "SMS sent successfully");
    return { success: true, messageId: message.sid };
  } catch (error) {
    logger.error({ error, to }, "Failed to send SMS");
    return { success: false };
  }
}

export async function sendWhatsApp({
  to,
  body,
}: SendWhatsAppParams): Promise<{ success: boolean; messageId?: string }> {
  const client = getTwilioClient();

  if (!client || !whatsappFrom) {
    logger.warn("WhatsApp sending skipped: Twilio not configured");
    return { success: false };
  }

  try {
    // Ensure 'to' is in WhatsApp format
    const formattedTo = to.startsWith("whatsapp:") ? to : `whatsapp:${to}`;

    const message = await client.messages.create({
      from: whatsappFrom,
      to: formattedTo,
      body,
    });

    logger.info({ messageId: message.sid, to }, "WhatsApp sent successfully");
    return { success: true, messageId: message.sid };
  } catch (error) {
    logger.error({ error, to }, "Failed to send WhatsApp");
    return { success: false };
  }
}
