import { sendSMS, sendWhatsApp, twilioEnabled } from "../lib/twilio";
import { logger } from "../lib/logger";
import { resendEnabled, sendEmail } from "../lib/resend";

interface BookingNotificationData {
  clientName: string;
  clientPhone: string;
  serviceName: string;
  propertyName: string;
  propertyAddress: string;
  scheduledDate: string;
  scheduledTime: string;
  totalPrice: string;
  bookingId: string;
}

interface StatusUpdateData {
  clientName: string;
  clientPhone: string;
  serviceName: string;
  propertyName: string;
  status: string;
  bookingId: string;
}

interface CompletionNotificationData {
  clientName: string;
  clientPhone: string;
  serviceName: string;
  propertyName: string;
  cleanScoreUrl?: string;
  bookingId: string;
}

/**
 * Message templates for Brisa Cubana notifications
 */
const MessageTemplates = {
  bookingConfirmed: (data: BookingNotificationData): string =>
    `
🧹 *Brisa Cubana - Reserva Confirmada*

Hola ${data.clientName}, tu servicio ha sido confirmado:

📋 Servicio: ${data.serviceName}
📍 Ubicación: ${data.propertyName}
${data.propertyAddress}

📅 Fecha: ${data.scheduledDate}
⏰ Hora: ${data.scheduledTime}
💵 Total: $${data.totalPrice}

Recibirás notificaciones cuando tu cuadrilla esté en camino.

ID: ${data.bookingId}

¿Preguntas? Responde a este mensaje.
`.trim(),

  bookingPending: (data: BookingNotificationData): string =>
    `
🧹 *Brisa Cubana - Reserva Recibida*

Hola ${data.clientName}, hemos recibido tu solicitud de servicio:

📋 ${data.serviceName}
📍 ${data.propertyName}
📅 ${data.scheduledDate} a las ${data.scheduledTime}

Nuestro equipo revisará tu reserva y te confirmaremos en las próximas horas.

ID: ${data.bookingId}

Gracias por confiar en Brisa Cubana! 🌟
`.trim(),

  statusInProgress: (data: StatusUpdateData): string =>
    `
🚀 *Brisa Cubana - Servicio Iniciado*

Hola ${data.clientName},

Tu cuadrilla ha llegado a ${data.propertyName} y está comenzando el servicio de ${data.serviceName}.

Te notificaremos cuando termine con el reporte de calidad CleanScore™.

ID: ${data.bookingId}
`.trim(),

  statusCompleted: (data: CompletionNotificationData): string =>
    `
✅ *Brisa Cubana - Servicio Completado*

Hola ${data.clientName},

Tu servicio de ${data.serviceName} en ${data.propertyName} ha sido completado exitosamente!

${data.cleanScoreUrl ? `📊 Ver tu CleanScore™:\n${data.cleanScoreUrl}\n\n` : ""}Tu reporte de calidad CleanScore™ estará disponible en las próximas 24 horas.

Gracias por confiar en Brisa Cubana! 🌟

ID: ${data.bookingId}

¿Cómo estuvo el servicio? Responde con una calificación del 1-10.
`.trim(),

  statusCancelled: (data: StatusUpdateData): string =>
    `
❌ *Brisa Cubana - Reserva Cancelada*

Hola ${data.clientName},

Tu servicio de ${data.serviceName} en ${data.propertyName} ha sido cancelado.

Si esto fue un error o deseas reagendar, contáctanos respondiendo a este mensaje.

ID: ${data.bookingId}
`.trim(),

  reminder24h: (data: BookingNotificationData): string =>
    `
⏰ *Brisa Cubana - Recordatorio*

Hola ${data.clientName},

Te recordamos que mañana tienes programado:

📋 ${data.serviceName}
📍 ${data.propertyName}
⏰ ${data.scheduledTime}

Tu cuadrilla llegará puntual. Asegúrate de que tengan acceso a la propiedad.

ID: ${data.bookingId}

¿Necesitas cambios? Responde a este mensaje.
`.trim(),

  reminder2h: (data: BookingNotificationData): string =>
    `
🚗 *Brisa Cubana - Tu cuadrilla está en camino*

Hola ${data.clientName},

Tu servicio comienza en aproximadamente 2 horas:

📍 ${data.propertyName}
⏰ ${data.scheduledTime}

Nuestra cuadrilla está preparada y lista para brindarte el mejor servicio!

ID: ${data.bookingId}
`.trim(),
};

/**
 * Send booking confirmation notification via WhatsApp (preferred) or SMS fallback
 */
export async function sendBookingConfirmation(
  data: BookingNotificationData,
  status: "CONFIRMED" | "PENDING" = "CONFIRMED",
): Promise<{ success: boolean }> {
  if (!twilioEnabled()) {
    logger.warn(
      { bookingId: data.bookingId },
      "Notification skipped: Twilio disabled",
    );
    return { success: false };
  }

  const message =
    status === "CONFIRMED"
      ? MessageTemplates.bookingConfirmed(data)
      : MessageTemplates.bookingPending(data);

  // Try WhatsApp first
  const whatsappResult = await sendWhatsApp({
    to: data.clientPhone,
    body: message,
  });

  if (whatsappResult.success) {
    logger.info(
      { bookingId: data.bookingId, channel: "whatsapp" },
      "Booking confirmation sent",
    );
    return { success: true };
  }

  // Fallback to SMS
  const smsResult = await sendSMS({
    to: data.clientPhone,
    body: message,
  });

  if (smsResult.success) {
    logger.info(
      { bookingId: data.bookingId, channel: "sms" },
      "Booking confirmation sent",
    );
    return { success: true };
  }

  logger.error(
    { bookingId: data.bookingId },
    "Failed to send booking confirmation",
  );
  return { success: false };
}

/**
 * Send status update notification
 */
export async function sendStatusUpdate(
  data: StatusUpdateData,
): Promise<{ success: boolean }> {
  if (!twilioEnabled()) {
    logger.warn(
      { bookingId: data.bookingId },
      "Notification skipped: Twilio disabled",
    );
    return { success: false };
  }

  let message: string;

  switch (data.status) {
    case "IN_PROGRESS":
      message = MessageTemplates.statusInProgress(data);
      break;
    case "CANCELLED":
      message = MessageTemplates.statusCancelled(data);
      break;
    default:
      logger.warn({ status: data.status }, "Unknown status for notification");
      return { success: false };
  }

  // Try WhatsApp first
  const whatsappResult = await sendWhatsApp({
    to: data.clientPhone,
    body: message,
  });

  if (whatsappResult.success) {
    logger.info(
      { bookingId: data.bookingId, status: data.status, channel: "whatsapp" },
      "Status update sent",
    );
    return { success: true };
  }

  // Fallback to SMS
  const smsResult = await sendSMS({
    to: data.clientPhone,
    body: message,
  });

  if (smsResult.success) {
    logger.info(
      { bookingId: data.bookingId, status: data.status, channel: "sms" },
      "Status update sent",
    );
    return { success: true };
  }

  logger.error(
    { bookingId: data.bookingId, status: data.status },
    "Failed to send status update",
  );
  return { success: false };
}

/**
 * Send service completion notification with CleanScore link
 */
export async function sendCompletionNotification(
  data: CompletionNotificationData,
): Promise<{ success: boolean }> {
  if (!twilioEnabled()) {
    logger.warn(
      { bookingId: data.bookingId },
      "Notification skipped: Twilio disabled",
    );
    return { success: false };
  }

  const message = MessageTemplates.statusCompleted(data);

  // Try WhatsApp first
  const whatsappResult = await sendWhatsApp({
    to: data.clientPhone,
    body: message,
  });

  if (whatsappResult.success) {
    logger.info(
      { bookingId: data.bookingId, channel: "whatsapp" },
      "Completion notification sent",
    );
    return { success: true };
  }

  // Fallback to SMS
  const smsResult = await sendSMS({
    to: data.clientPhone,
    body: message,
  });

  if (smsResult.success) {
    logger.info(
      { bookingId: data.bookingId, channel: "sms" },
      "Completion notification sent",
    );
    return { success: true };
  }

  logger.error(
    { bookingId: data.bookingId },
    "Failed to send completion notification",
  );
  return { success: false };
}

/**
 * Send reminder notification (24h or 2h before service)
 */
export async function sendReminder(
  data: BookingNotificationData,
  type: "24h" | "2h",
): Promise<{ success: boolean }> {
  if (!twilioEnabled()) {
    logger.warn(
      { bookingId: data.bookingId },
      "Notification skipped: Twilio disabled",
    );
    return { success: false };
  }

  const message =
    type === "24h"
      ? MessageTemplates.reminder24h(data)
      : MessageTemplates.reminder2h(data);

  // Try WhatsApp first
  const whatsappResult = await sendWhatsApp({
    to: data.clientPhone,
    body: message,
  });

  if (whatsappResult.success) {
    logger.info(
      { bookingId: data.bookingId, type, channel: "whatsapp" },
      "Reminder sent",
    );
    return { success: true };
  }

  // Fallback to SMS
  const smsResult = await sendSMS({
    to: data.clientPhone,
    body: message,
  });

  if (smsResult.success) {
    logger.info(
      { bookingId: data.bookingId, type, channel: "sms" },
      "Reminder sent",
    );
    return { success: true };
  }

  logger.error({ bookingId: data.bookingId, type }, "Failed to send reminder");
  return { success: false };
}

/**
 * Utility to format phone number for display
 */
export function formatPhoneForDisplay(phone: string): string {
  // Remove non-digits
  const digits = phone.replace(/\D/g, "");

  // Format as (XXX) XXX-XXXX for US numbers
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  if (digits.length === 11 && digits.startsWith("1")) {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }

  return phone;
}

export async function sendConciergeEmail({
  to,
  conversationId,
  assistantMessage,
  userMessage,
}: {
  to: string;
  conversationId: string;
  assistantMessage: string;
  userMessage: string;
}): Promise<{ success: boolean }> {
  if (!resendEnabled()) {
    logger.warn({ conversationId }, "Concierge email skipped: Resend disabled");
    return { success: false };
  }

  const html = `
  <!DOCTYPE html>
  <html lang="es">
  <head><meta charset="utf-8" /></head>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #111;">
    <h2 style="margin-bottom: 8px;">Respuesta Concierge AI</h2>
    <p style="margin: 0 0 12px 0;">Hemos recibido tu mensaje:</p>
    <blockquote style="margin: 0 0 16px 0; padding-left: 12px; border-left: 4px solid #14b8a6; color: #4b5563;">${userMessage}</blockquote>
    <p style="margin: 0 0 12px 0;">Nuestra IA respondió:</p>
    <blockquote style="margin: 0 0 16px 0; padding-left: 12px; border-left: 4px solid #14b8a6; color: #111;">${assistantMessage}</blockquote>
    <p style="font-size: 12px; color: #6b7280;">ID de conversación: ${conversationId}</p>
  </body>
  </html>
  `;
  const result = await sendEmail({
    to,
    subject: "Concierge AI Response",
    html,
  });
  return { success: result.success };
}
