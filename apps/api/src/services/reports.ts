import { generateCleanScoreHTML } from "../templates/cleanscore-report";
import { generateCleanScorePDF } from "./pdf";
import { sendEmail, resendEnabled } from "../lib/resend";
import { logger } from "../lib/logger";

interface CleanScoreReportData {
  bookingId: string;
  clientName: string;
  clientEmail: string;
  propertyName: string;
  propertyAddress: string;
  serviceName: string;
  serviceDate: string;
  teamMembers: string[];
  score: number;
  metrics: {
    generalCleanliness: number;
    kitchen: number;
    bathrooms: number;
    premiumDetails: number;
    ambiance: number;
    timeCompliance: number;
  };
  photos: {
    url: string;
    caption: string;
    category: "before" | "after";
  }[];
  observations: string;
  recommendations: string[];
  completedAt: string;
}

/**
 * Generate CleanScore report HTML
 */
export function generateCleanScoreReport(data: CleanScoreReportData): string {
  return generateCleanScoreHTML(data);
}

/**
 * Generate and send CleanScore report via email
 */
export async function sendCleanScoreReport(
  data: CleanScoreReportData,
): Promise<{ success: boolean; pdfBuffer?: Buffer }> {
  if (!resendEnabled()) {
    logger.warn(
      { bookingId: data.bookingId },
      "Email delivery skipped: Resend not configured",
    );
    return { success: false };
  }

  try {
    // Generate HTML
    const html = generateCleanScoreReport(data);

    // Generate PDF
    logger.info(
      { bookingId: data.bookingId },
      "Generating CleanScore PDF report",
    );
    const pdfBuffer = await generateCleanScorePDF(html);

    // Prepare email
    const emailSubject = `Tu CleanScore™ Report - ${data.propertyName}`;
    const emailHTML = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
      color: white;
      padding: 30px;
      border-radius: 12px;
      text-align: center;
      margin-bottom: 30px;
    }
    .logo {
      font-size: 28px;
      font-weight: 700;
      margin-bottom: 8px;
    }
    .score {
      font-size: 48px;
      font-weight: 700;
      margin: 20px 0;
    }
    .content {
      background: #f9fafb;
      padding: 30px;
      border-radius: 12px;
      margin-bottom: 20px;
    }
    .content h2 {
      color: #14b8a6;
      margin-bottom: 16px;
    }
    .content p {
      margin-bottom: 12px;
    }
    .footer {
      text-align: center;
      color: #6b7280;
      font-size: 14px;
      margin-top: 30px;
    }
    .cta-button {
      display: inline-block;
      background: #14b8a6;
      color: white;
      padding: 12px 32px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">🧹 Brisa Cubana</div>
    <p style="font-size: 14px; opacity: 0.9; text-transform: uppercase; letter-spacing: 2px;">Premium Cleaning Intelligence</p>
    <div class="score">CleanScore™: ${data.score.toFixed(1)}</div>
    <p style="font-size: 18px; margin: 0;">${data.score >= 4.5 ? "¡Excelente!" : data.score >= 3.5 ? "Buen trabajo" : "Mejorable"}</p>
  </div>

  <div class="content">
    <h2>Hola ${data.clientName},</h2>
    <p>
      Tu servicio de <strong>${data.serviceName}</strong> en <strong>${data.propertyName}</strong>
      ha sido completado exitosamente.
    </p>
    <p>
      Nuestro equipo ha preparado tu reporte de calidad CleanScore™ con todas las métricas
      y evidencias fotográficas del servicio realizado.
    </p>
    <p>
      <strong>Fecha de servicio:</strong> ${data.serviceDate}<br>
      <strong>Equipo asignado:</strong> ${data.teamMembers.join(", ")}<br>
      <strong>CleanScore™ obtenido:</strong> ${data.score.toFixed(1)}/5.0
    </p>
  </div>

  <div class="content">
    <h2>📊 Métricas de Calidad</h2>
    <ul style="list-style: none; padding: 0;">
      <li>✓ Limpieza General: ${data.metrics.generalCleanliness.toFixed(1)}/5.0</li>
      <li>✓ Cocina: ${data.metrics.kitchen.toFixed(1)}/5.0</li>
      <li>✓ Baños: ${data.metrics.bathrooms.toFixed(1)}/5.0</li>
      <li>✓ Detalles Premium: ${data.metrics.premiumDetails.toFixed(1)}/5.0</li>
      <li>✓ Ambientación: ${data.metrics.ambiance.toFixed(1)}/5.0</li>
      <li>✓ Puntualidad: ${data.metrics.timeCompliance.toFixed(1)}/5.0</li>
    </ul>
  </div>

  ${
    data.recommendations.length > 0
      ? `
  <div class="content">
    <h2>💡 Recomendaciones</h2>
    <ul>
      ${data.recommendations.map((rec) => `<li>${rec}</li>`).join("")}
    </ul>
  </div>
  `
      : ""
  }

  <div class="content" style="text-align: center;">
    <p><strong>¿Cómo fue tu experiencia?</strong></p>
    <p>Tu opinión es muy importante para nosotros. Por favor califica nuestro servicio:</p>
    <a href="#" class="cta-button">Dejar mi calificación</a>
  </div>

  <div class="footer">
    <p>
      <strong>Brisa Cubana</strong> · Premium Cleaning Intelligence<br>
      ID de Servicio: ${data.bookingId}<br>
      ${data.completedAt}
    </p>
    <p style="font-size: 12px; margin-top: 16px;">
      Este es un reporte automatizado. Si tienes alguna pregunta, responde a este correo.
    </p>
  </div>
</body>
</html>
    `.trim();

    // Send email with PDF attachment
    logger.info(
      { bookingId: data.bookingId, to: data.clientEmail },
      "Sending CleanScore report via email",
    );

    const emailResult = await sendEmail({
      to: data.clientEmail,
      subject: emailSubject,
      html: emailHTML,
      attachments: [
        {
          filename: `CleanScore_${data.bookingId}.pdf`,
          content: pdfBuffer,
        },
      ],
    });

    if (emailResult.success) {
      logger.info(
        { bookingId: data.bookingId, messageId: emailResult.messageId },
        "CleanScore report sent successfully",
      );
      return { success: true, pdfBuffer };
    }

    logger.error(
      { bookingId: data.bookingId },
      "Failed to send CleanScore report",
    );
    return { success: false, pdfBuffer };
  } catch (error) {
    logger.error(
      { error, bookingId: data.bookingId },
      "Error generating/sending CleanScore report",
    );
    return { success: false };
  }
}

/**
 * Calculate weighted CleanScore from metrics
 */
export function calculateCleanScore(metrics: {
  generalCleanliness: number;
  kitchen: number;
  bathrooms: number;
  premiumDetails: number;
  ambiance: number;
  timeCompliance: number;
}): number {
  // Weights according to MVP Lean Plan template
  const weights = {
    generalCleanliness: 0.3, // 30%
    kitchen: 0.15, // 15%
    bathrooms: 0.15, // 15%
    premiumDetails: 0.1, // 10%
    ambiance: 0.05, // 5%
    timeCompliance: 0.1, // 10%
    // clientFeedback: 0.15 // 15% - will be added manually after NPS
  };

  const baseScore =
    metrics.generalCleanliness * weights.generalCleanliness +
    metrics.kitchen * weights.kitchen +
    metrics.bathrooms * weights.bathrooms +
    metrics.premiumDetails * weights.premiumDetails +
    metrics.ambiance * weights.ambiance +
    metrics.timeCompliance * weights.timeCompliance;

  // Scale to 85% (15% reserved for client feedback)
  return baseScore * 0.85;
}
