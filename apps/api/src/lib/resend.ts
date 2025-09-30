import { Resend } from "resend";
import { logger } from "./logger";

const apiKey = process.env.RESEND_API_KEY;
const fromEmail = process.env.EMAIL_FROM ?? "noreply@brisacubanaclean.com";

let resendClient: Resend | null = null;

export function getResendClient(): Resend | null {
  if (!apiKey) {
    logger.warn(
      "Resend API key not configured. Email delivery will be disabled.",
    );
    return null;
  }

  if (!resendClient) {
    resendClient = new Resend(apiKey);
    logger.info("Resend client initialized successfully");
  }

  return resendClient;
}

export function resendEnabled(): boolean {
  return !!apiKey;
}

export function getFromEmail(): string {
  return fromEmail;
}

interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
  attachments?: {
    filename: string;
    content: Buffer | string;
  }[];
}

export async function sendEmail({
  to,
  subject,
  html,
  attachments,
}: SendEmailParams): Promise<{ success: boolean; messageId?: string }> {
  const client = getResendClient();

  if (!client) {
    logger.warn("Email sending skipped: Resend not configured");
    return { success: false };
  }

  try {
    const response = await client.emails.send({
      from: fromEmail,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      attachments,
    });

    logger.info(
      { messageId: response.data?.id, to },
      "Email sent successfully",
    );
    return { success: true, messageId: response.data?.id };
  } catch (error) {
    logger.error({ error, to }, "Failed to send email");
    return { success: false };
  }
}
