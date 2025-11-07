import type { NotificationType } from "@prisma/client";

export type EmailTemplate = {
  subject: string;
  text: string;
  html: string;
};

export type BookingEmailData = {
  bookingId: string;
  bookingCode: string;
  customerName: string;
  serviceName: string;
  propertyAddress: string;
  scheduledAt: string;
  durationMin: number;
  totalAmount: string;
  notes?: string;
  staffName?: string;
};

/**
 * Generates email template for booking created notification
 */
export function getBookingCreatedTemplate(
  data: BookingEmailData,
): EmailTemplate {
  return {
    subject: `Confirmación de Reserva - ${data.bookingCode}`,
    text: `
Hola ${data.customerName},

¡Tu reserva ha sido creada exitosamente!

Detalles de la reserva:
- Código: ${data.bookingCode}
- Servicio: ${data.serviceName}
- Propiedad: ${data.propertyAddress}
- Fecha y hora: ${data.scheduledAt}
- Duración: ${data.durationMin} minutos
- Monto total: ${data.totalAmount}
${data.notes ? `- Notas: ${data.notes}` : ""}
${data.staffName ? `- Personal asignado: ${data.staffName}` : ""}

Te confirmaremos los detalles finales próximamente.

Gracias por confiar en Brisa Cubana.

Equipo Brisa Cubana
    `.trim(),
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
    <h2 style="color: #2c3e50; margin-top: 0;">¡Reserva Confirmada!</h2>
    <p>Hola <strong>${data.customerName}</strong>,</p>
    <p>Tu reserva ha sido creada exitosamente.</p>
  </div>

  <div style="background-color: #fff; border: 1px solid #dee2e6; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
    <h3 style="color: #2c3e50; margin-top: 0;">Detalles de la Reserva</h3>
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;"><strong>Código:</strong></td>
        <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;">${data.bookingCode}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;"><strong>Servicio:</strong></td>
        <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;">${data.serviceName}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;"><strong>Propiedad:</strong></td>
        <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;">${data.propertyAddress}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;"><strong>Fecha y hora:</strong></td>
        <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;">${data.scheduledAt}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;"><strong>Duración:</strong></td>
        <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;">${data.durationMin} minutos</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;"><strong>Monto total:</strong></td>
        <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;">${data.totalAmount}</td>
      </tr>
      ${
        data.staffName
          ? `
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;"><strong>Personal asignado:</strong></td>
        <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;">${data.staffName}</td>
      </tr>
      `
          : ""
      }
      ${
        data.notes
          ? `
      <tr>
        <td style="padding: 8px 0;"><strong>Notas:</strong></td>
        <td style="padding: 8px 0;">${data.notes}</td>
      </tr>
      `
          : ""
      }
    </table>
  </div>

  <p style="color: #6c757d; font-size: 14px;">
    Te confirmaremos los detalles finales próximamente.
  </p>

  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; color: #6c757d; font-size: 14px;">
    <p>Gracias por confiar en Brisa Cubana.</p>
    <p><strong>Equipo Brisa Cubana</strong></p>
  </div>
</body>
</html>
    `.trim(),
  };
}

/**
 * Generates email template for booking reminder (24h before)
 */
export function getBookingReminder24hTemplate(
  data: BookingEmailData,
): EmailTemplate {
  return {
    subject: `Recordatorio: Tu servicio de limpieza es mañana - ${data.bookingCode}`,
    text: `
Hola ${data.customerName},

Te recordamos que tienes un servicio programado para mañana.

Detalles de la reserva:
- Código: ${data.bookingCode}
- Servicio: ${data.serviceName}
- Propiedad: ${data.propertyAddress}
- Fecha y hora: ${data.scheduledAt}
- Duración: ${data.durationMin} minutos
${data.staffName ? `- Personal asignado: ${data.staffName}` : ""}

Por favor, asegúrate de que la propiedad esté accesible.

Si necesitas reprogramar o cancelar, contáctanos lo antes posible.

Equipo Brisa Cubana
    `.trim(),
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
    <h2 style="color: #856404; margin-top: 0;">⏰ Recordatorio de Servicio</h2>
    <p>Hola <strong>${data.customerName}</strong>,</p>
    <p>Te recordamos que tienes un servicio programado para <strong>mañana</strong>.</p>
  </div>

  <div style="background-color: #fff; border: 1px solid #dee2e6; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
    <h3 style="color: #2c3e50; margin-top: 0;">Detalles de la Reserva</h3>
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;"><strong>Código:</strong></td>
        <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;">${data.bookingCode}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;"><strong>Servicio:</strong></td>
        <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;">${data.serviceName}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;"><strong>Propiedad:</strong></td>
        <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;">${data.propertyAddress}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;"><strong>Fecha y hora:</strong></td>
        <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;">${data.scheduledAt}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;"><strong>Duración:</strong></td>
        <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;">${data.durationMin} minutos</td>
      </tr>
      ${
        data.staffName
          ? `
      <tr>
        <td style="padding: 8px 0;"><strong>Personal asignado:</strong></td>
        <td style="padding: 8px 0;">${data.staffName}</td>
      </tr>
      `
          : ""
      }
    </table>
  </div>

  <div style="background-color: #e7f3ff; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
    <p style="margin: 0; color: #004085;">
      <strong>Importante:</strong> Por favor, asegúrate de que la propiedad esté accesible.
    </p>
  </div>

  <p style="color: #6c757d; font-size: 14px;">
    Si necesitas reprogramar o cancelar, contáctanos lo antes posible.
  </p>

  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; color: #6c757d; font-size: 14px;">
    <p><strong>Equipo Brisa Cubana</strong></p>
  </div>
</body>
</html>
    `.trim(),
  };
}

/**
 * Generates email template for booking reminder (1h before)
 */
export function getBookingReminder1hTemplate(
  data: BookingEmailData,
): EmailTemplate {
  return {
    subject: `Recordatorio: Tu servicio comienza en 1 hora - ${data.bookingCode}`,
    text: `
Hola ${data.customerName},

¡Tu servicio de limpieza comienza en aproximadamente 1 hora!

Detalles:
- Servicio: ${data.serviceName}
- Propiedad: ${data.propertyAddress}
- Hora programada: ${data.scheduledAt}
${data.staffName ? `- Personal asignado: ${data.staffName}` : ""}

Nuestro equipo llegará puntualmente.

Equipo Brisa Cubana
    `.trim(),
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #cfe2ff; border-left: 4px solid #0d6efd; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
    <h2 style="color: #084298; margin-top: 0;">⏰ ¡Tu servicio comienza pronto!</h2>
    <p>Hola <strong>${data.customerName}</strong>,</p>
    <p>Tu servicio de limpieza comienza en aproximadamente <strong>1 hora</strong>.</p>
  </div>

  <div style="background-color: #fff; border: 1px solid #dee2e6; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;"><strong>Servicio:</strong></td>
        <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;">${data.serviceName}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;"><strong>Propiedad:</strong></td>
        <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;">${data.propertyAddress}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;"><strong>Hora:</strong></td>
        <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;">${data.scheduledAt}</td>
      </tr>
      ${
        data.staffName
          ? `
      <tr>
        <td style="padding: 8px 0;"><strong>Personal:</strong></td>
        <td style="padding: 8px 0;">${data.staffName}</td>
      </tr>
      `
          : ""
      }
    </table>
  </div>

  <p style="color: #6c757d;">Nuestro equipo llegará puntualmente.</p>

  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; color: #6c757d; font-size: 14px;">
    <p><strong>Equipo Brisa Cubana</strong></p>
  </div>
</body>
</html>
    `.trim(),
  };
}

/**
 * Generates email template for booking completed
 */
export function getBookingCompletedTemplate(
  data: BookingEmailData,
): EmailTemplate {
  return {
    subject: `Servicio Completado - ${data.bookingCode}`,
    text: `
Hola ${data.customerName},

¡Tu servicio de limpieza ha sido completado!

Detalles del servicio:
- Código: ${data.bookingCode}
- Servicio: ${data.serviceName}
- Propiedad: ${data.propertyAddress}
- Fecha: ${data.scheduledAt}
- Monto: ${data.totalAmount}

Esperamos que estés satisfecho con nuestro trabajo.

Si tienes algún comentario o sugerencia, no dudes en contactarnos.

¡Gracias por confiar en Brisa Cubana!

Equipo Brisa Cubana
    `.trim(),
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #d1e7dd; border-left: 4px solid #198754; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
    <h2 style="color: #0f5132; margin-top: 0;">✅ ¡Servicio Completado!</h2>
    <p>Hola <strong>${data.customerName}</strong>,</p>
    <p>Tu servicio de limpieza ha sido completado exitosamente.</p>
  </div>

  <div style="background-color: #fff; border: 1px solid #dee2e6; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
    <h3 style="color: #2c3e50; margin-top: 0;">Resumen del Servicio</h3>
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;"><strong>Código:</strong></td>
        <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;">${data.bookingCode}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;"><strong>Servicio:</strong></td>
        <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;">${data.serviceName}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;"><strong>Propiedad:</strong></td>
        <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;">${data.propertyAddress}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;"><strong>Fecha:</strong></td>
        <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;">${data.scheduledAt}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0;"><strong>Monto:</strong></td>
        <td style="padding: 8px 0;">${data.totalAmount}</td>
      </tr>
    </table>
  </div>

  <p>Esperamos que estés satisfecho con nuestro trabajo.</p>
  <p style="color: #6c757d;">Si tienes algún comentario o sugerencia, no dudes en contactarnos.</p>

  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; color: #6c757d; font-size: 14px;">
    <p>¡Gracias por confiar en Brisa Cubana!</p>
    <p><strong>Equipo Brisa Cubana</strong></p>
  </div>
</body>
</html>
    `.trim(),
  };
}

/**
 * Generates email template for booking cancelled
 */
export function getBookingCancelledTemplate(
  data: BookingEmailData,
): EmailTemplate {
  return {
    subject: `Reserva Cancelada - ${data.bookingCode}`,
    text: `
Hola ${data.customerName},

Tu reserva ha sido cancelada.

Detalles de la reserva cancelada:
- Código: ${data.bookingCode}
- Servicio: ${data.serviceName}
- Propiedad: ${data.propertyAddress}
- Fecha programada: ${data.scheduledAt}

Si tienes alguna pregunta o deseas reagendar, no dudes en contactarnos.

Equipo Brisa Cubana
    `.trim(),
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8d7da; border-left: 4px solid #dc3545; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
    <h2 style="color: #842029; margin-top: 0;">❌ Reserva Cancelada</h2>
    <p>Hola <strong>${data.customerName}</strong>,</p>
    <p>Tu reserva ha sido cancelada.</p>
  </div>

  <div style="background-color: #fff; border: 1px solid #dee2e6; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
    <h3 style="color: #2c3e50; margin-top: 0;">Detalles de la Reserva Cancelada</h3>
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;"><strong>Código:</strong></td>
        <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;">${data.bookingCode}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;"><strong>Servicio:</strong></td>
        <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;">${data.serviceName}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;"><strong>Propiedad:</strong></td>
        <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;">${data.propertyAddress}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0;"><strong>Fecha programada:</strong></td>
        <td style="padding: 8px 0;">${data.scheduledAt}</td>
      </tr>
    </table>
  </div>

  <p style="color: #6c757d;">Si tienes alguna pregunta o deseas reagendar, no dudes en contactarnos.</p>

  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; color: #6c757d; font-size: 14px;">
    <p><strong>Equipo Brisa Cubana</strong></p>
  </div>
</body>
</html>
    `.trim(),
  };
}

/**
 * Generates email template for booking rescheduled
 */
export function getBookingRescheduledTemplate(
  data: BookingEmailData & { oldScheduledAt: string },
): EmailTemplate {
  return {
    subject: `Reserva Reprogramada - ${data.bookingCode}`,
    text: `
Hola ${data.customerName},

Tu reserva ha sido reprogramada.

Nueva fecha y hora: ${data.scheduledAt}
Fecha anterior: ${data.oldScheduledAt}

Detalles de la reserva:
- Código: ${data.bookingCode}
- Servicio: ${data.serviceName}
- Propiedad: ${data.propertyAddress}
- Duración: ${data.durationMin} minutos
${data.staffName ? `- Personal asignado: ${data.staffName}` : ""}

Si tienes alguna pregunta, no dudes en contactarnos.

Equipo Brisa Cubana
    `.trim(),
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #cff4fc; border-left: 4px solid #0dcaf0; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
    <h2 style="color: #055160; margin-top: 0;">🔄 Reserva Reprogramada</h2>
    <p>Hola <strong>${data.customerName}</strong>,</p>
    <p>Tu reserva ha sido reprogramada.</p>
  </div>

  <div style="background-color: #fff; border: 1px solid #dee2e6; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
    <div style="background-color: #e7f3ff; padding: 10px; border-radius: 4px; margin-bottom: 15px;">
      <p style="margin: 5px 0;"><strong>Nueva fecha:</strong> ${data.scheduledAt}</p>
      <p style="margin: 5px 0; color: #6c757d;"><del>Fecha anterior: ${data.oldScheduledAt}</del></p>
    </div>

    <h3 style="color: #2c3e50; margin-top: 0;">Detalles de la Reserva</h3>
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;"><strong>Código:</strong></td>
        <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;">${data.bookingCode}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;"><strong>Servicio:</strong></td>
        <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;">${data.serviceName}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;"><strong>Propiedad:</strong></td>
        <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;">${data.propertyAddress}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;"><strong>Duración:</strong></td>
        <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;">${data.durationMin} minutos</td>
      </tr>
      ${
        data.staffName
          ? `
      <tr>
        <td style="padding: 8px 0;"><strong>Personal asignado:</strong></td>
        <td style="padding: 8px 0;">${data.staffName}</td>
      </tr>
      `
          : ""
      }
    </table>
  </div>

  <p style="color: #6c757d;">Si tienes alguna pregunta, no dudes en contactarnos.</p>

  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; color: #6c757d; font-size: 14px;">
    <p><strong>Equipo Brisa Cubana</strong></p>
  </div>
</body>
</html>
    `.trim(),
  };
}

/**
 * Main template dispatcher
 */
export function getEmailTemplate(
  type: NotificationType,
  data: BookingEmailData & { oldScheduledAt?: string },
): EmailTemplate | null {
  switch (type) {
    case "BOOKING_CREATED":
      return getBookingCreatedTemplate(data);
    case "BOOKING_REMINDER_24H":
      return getBookingReminder24hTemplate(data);
    case "BOOKING_REMINDER_1H":
      return getBookingReminder1hTemplate(data);
    case "BOOKING_COMPLETED":
      return getBookingCompletedTemplate(data);
    case "BOOKING_CANCELLED":
      return getBookingCancelledTemplate(data);
    case "BOOKING_RESCHEDULED":
      if (!data.oldScheduledAt) return null;
      return getBookingRescheduledTemplate(
        data as BookingEmailData & { oldScheduledAt: string },
      );
    default:
      return null;
  }
}
