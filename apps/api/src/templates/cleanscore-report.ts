interface CleanScoreData {
  bookingId: string;
  clientName: string;
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

export function generateCleanScoreHTML(data: CleanScoreData): string {
  const scoreColor =
    data.score >= 4.5 ? "#14b8a6" : data.score >= 3.5 ? "#f59e0b" : "#ef4444";
  const scoreLabel =
    data.score >= 4.5 ? "Excelente" : data.score >= 3.5 ? "Bueno" : "Mejorable";

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CleanScore™ Report - ${data.bookingId}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
      background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
      color: #e5e5e5;
      padding: 40px 20px;
      line-height: 1.6;
    }

    .container {
      max-width: 800px;
      margin: 0 auto;
      background: #1a1a1a;
      border-radius: 24px;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    }

    .header {
      background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
      padding: 40px;
      text-align: center;
    }

    .logo {
      font-size: 32px;
      font-weight: 700;
      color: white;
      margin-bottom: 8px;
      letter-spacing: -1px;
    }

    .tagline {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: rgba(255, 255, 255, 0.8);
    }

    .score-section {
      padding: 40px;
      text-align: center;
      background: rgba(20, 184, 166, 0.05);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .score-label {
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 3px;
      color: #9ca3af;
      margin-bottom: 16px;
    }

    .score-value {
      font-size: 72px;
      font-weight: 700;
      color: ${scoreColor};
      line-height: 1;
      margin-bottom: 8px;
    }

    .score-status {
      font-size: 18px;
      font-weight: 600;
      color: ${scoreColor};
      text-transform: uppercase;
      letter-spacing: 2px;
    }

    .section {
      padding: 40px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .section:last-child {
      border-bottom: none;
    }

    .section-title {
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 3px;
      color: #14b8a6;
      margin-bottom: 24px;
      font-weight: 600;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 24px;
      margin-bottom: 24px;
    }

    .info-item {
      background: rgba(255, 255, 255, 0.02);
      padding: 16px;
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.05);
    }

    .info-label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #9ca3af;
      margin-bottom: 6px;
    }

    .info-value {
      font-size: 16px;
      color: white;
      font-weight: 500;
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }

    .metric-item {
      background: rgba(255, 255, 255, 0.02);
      padding: 20px;
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.05);
    }

    .metric-label {
      font-size: 13px;
      color: #e5e5e5;
      margin-bottom: 12px;
    }

    .metric-bar {
      height: 8px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 4px;
      overflow: hidden;
      position: relative;
    }

    .metric-fill {
      height: 100%;
      background: linear-gradient(90deg, #14b8a6 0%, #0d9488 100%);
      border-radius: 4px;
      transition: width 0.3s ease;
    }

    .metric-value {
      font-size: 18px;
      font-weight: 700;
      color: #14b8a6;
      margin-top: 8px;
    }

    .photos-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      margin-top: 24px;
    }

    .photo-item {
      border-radius: 12px;
      overflow: hidden;
      border: 2px solid rgba(255, 255, 255, 0.1);
      position: relative;
      aspect-ratio: 1;
    }

    .photo-item img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .photo-caption {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      background: linear-gradient(to top, rgba(0, 0, 0, 0.8), transparent);
      padding: 12px 8px 8px;
      font-size: 10px;
      color: white;
      text-align: center;
      font-weight: 500;
    }

    .photo-badge {
      position: absolute;
      top: 8px;
      right: 8px;
      background: ${data.score >= 4.5 ? "#14b8a6" : "#f59e0b"};
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .observations {
      background: rgba(255, 255, 255, 0.02);
      padding: 20px;
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.05);
      margin-top: 16px;
      font-size: 14px;
      color: #d1d5db;
      line-height: 1.8;
    }

    .recommendations {
      list-style: none;
      margin-top: 16px;
    }

    .recommendations li {
      background: rgba(20, 184, 166, 0.05);
      padding: 16px;
      border-radius: 12px;
      border-left: 4px solid #14b8a6;
      margin-bottom: 12px;
      font-size: 14px;
      color: #e5e5e5;
    }

    .recommendations li:before {
      content: "✓";
      color: #14b8a6;
      font-weight: 700;
      margin-right: 12px;
      font-size: 16px;
    }

    .footer {
      padding: 40px;
      text-align: center;
      background: rgba(0, 0, 0, 0.3);
    }

    .footer-text {
      font-size: 12px;
      color: #9ca3af;
      margin-bottom: 8px;
    }

    .footer-logo {
      font-size: 14px;
      font-weight: 700;
      color: #14b8a6;
      letter-spacing: 1px;
    }

    @media print {
      body {
        background: white;
        padding: 0;
      }

      .container {
        box-shadow: none;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <div class="logo">Brisa Cubana</div>
      <div class="tagline">Premium Cleaning Intelligence</div>
    </div>

    <!-- Score Section -->
    <div class="score-section">
      <div class="score-label">CleanScore™</div>
      <div class="score-value">${data.score.toFixed(1)}</div>
      <div class="score-status">${scoreLabel}</div>
    </div>

    <!-- Service Information -->
    <div class="section">
      <h2 class="section-title">Información del Servicio</h2>
      <div class="info-grid">
        <div class="info-item">
          <div class="info-label">Cliente</div>
          <div class="info-value">${data.clientName}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Propiedad</div>
          <div class="info-value">${data.propertyName}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Dirección</div>
          <div class="info-value">${data.propertyAddress}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Tipo de Servicio</div>
          <div class="info-value">${data.serviceName}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Fecha de Servicio</div>
          <div class="info-value">${data.serviceDate}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Equipo</div>
          <div class="info-value">${data.teamMembers.join(", ")}</div>
        </div>
      </div>
    </div>

    <!-- Metrics -->
    <div class="section">
      <h2 class="section-title">Métricas de Calidad</h2>
      <div class="metrics-grid">
        <div class="metric-item">
          <div class="metric-label">Limpieza General</div>
          <div class="metric-bar">
            <div class="metric-fill" style="width: ${(data.metrics.generalCleanliness / 5) * 100}%"></div>
          </div>
          <div class="metric-value">${data.metrics.generalCleanliness.toFixed(1)}/5.0</div>
        </div>
        <div class="metric-item">
          <div class="metric-label">Cocina</div>
          <div class="metric-bar">
            <div class="metric-fill" style="width: ${(data.metrics.kitchen / 5) * 100}%"></div>
          </div>
          <div class="metric-value">${data.metrics.kitchen.toFixed(1)}/5.0</div>
        </div>
        <div class="metric-item">
          <div class="metric-label">Baños</div>
          <div class="metric-bar">
            <div class="metric-fill" style="width: ${(data.metrics.bathrooms / 5) * 100}%"></div>
          </div>
          <div class="metric-value">${data.metrics.bathrooms.toFixed(1)}/5.0</div>
        </div>
        <div class="metric-item">
          <div class="metric-label">Detalles Premium</div>
          <div class="metric-bar">
            <div class="metric-fill" style="width: ${(data.metrics.premiumDetails / 5) * 100}%"></div>
          </div>
          <div class="metric-value">${data.metrics.premiumDetails.toFixed(1)}/5.0</div>
        </div>
        <div class="metric-item">
          <div class="metric-label">Ambientación</div>
          <div class="metric-bar">
            <div class="metric-fill" style="width: ${(data.metrics.ambiance / 5) * 100}%"></div>
          </div>
          <div class="metric-value">${data.metrics.ambiance.toFixed(1)}/5.0</div>
        </div>
        <div class="metric-item">
          <div class="metric-label">Puntualidad</div>
          <div class="metric-bar">
            <div class="metric-fill" style="width: ${(data.metrics.timeCompliance / 5) * 100}%"></div>
          </div>
          <div class="metric-value">${data.metrics.timeCompliance.toFixed(1)}/5.0</div>
        </div>
      </div>
    </div>

    <!-- Photos -->
    ${
      data.photos.length > 0
        ? `
    <div class="section">
      <h2 class="section-title">Evidencia Fotográfica</h2>
      <div class="photos-grid">
        ${data.photos
          .map(
            (photo) => `
          <div class="photo-item">
            <img src="${photo.url}" alt="${photo.caption}">
            <div class="photo-badge">${photo.category === "after" ? "Después" : "Antes"}</div>
            <div class="photo-caption">${photo.caption}</div>
          </div>
        `,
          )
          .join("")}
      </div>
    </div>
    `
        : ""
    }

    <!-- Observations -->
    <div class="section">
      <h2 class="section-title">Observaciones del Equipo</h2>
      <div class="observations">
        ${data.observations || "No hay observaciones adicionales para este servicio."}
      </div>
    </div>

    <!-- Recommendations -->
    ${
      data.recommendations.length > 0
        ? `
    <div class="section">
      <h2 class="section-title">Recomendaciones</h2>
      <ul class="recommendations">
        ${data.recommendations.map((rec) => `<li>${rec}</li>`).join("")}
      </ul>
    </div>
    `
        : ""
    }

    <!-- Footer -->
    <div class="footer">
      <div class="footer-text">Reporte generado el ${data.completedAt}</div>
      <div class="footer-text">ID de Servicio: ${data.bookingId}</div>
      <div class="footer-logo">BRISA CUBANA · CLEANSCORE™</div>
    </div>
  </div>
</body>
</html>
  `.trim();
}
