import { describe, expect, it } from "vitest";
import { generateCleanScoreReport } from "./reports";

const basePayload = {
  bookingId: "booking-123",
  clientName: "Cliente Demo",
  clientEmail: "client@example.com",
  propertyName: "Skyline Loft",
  propertyAddress: "123 Brickell Ave",
  serviceName: "Limpieza Premium",
  serviceDate: "lunes, 1 de enero de 2025",
  teamMembers: ["Ana", "Luis"],
  score: 95,
  metrics: {
    generalCleanliness: 4.8,
    kitchen: 4.7,
    bathrooms: 4.9,
    premiumDetails: 4.5,
    ambiance: 4.6,
    timeCompliance: 4.9,
  },
  photos: [
    {
      url: "https://example.com/foto1.jpg",
      caption: "Antes",
      category: "before" as const,
    },
  ],
  videos: ["https://example.com/video.mp4"],
  checklist: [
    {
      area: "Cocina",
      status: "PASS" as const,
      notes: "Todo impecable",
    },
  ],
  observations: "Checklist completado al 100%.",
  recommendations: ["Enviar agradecimiento al cliente"],
  completedAt: "2025-01-01 12:00:00",
};

describe("generateCleanScoreReport", () => {
  it("incluye la sección de videos cuando hay clips disponibles", () => {
    const html = generateCleanScoreReport(basePayload);
    expect(html).toContain("Clips de Verificación");
    expect(html).toContain(basePayload.videos[0]);
  });

  it("omite la sección de videos cuando no hay clips", () => {
    const html = generateCleanScoreReport({
      ...basePayload,
      videos: [],
    });
    expect(html).not.toContain("Clips de Verificación");
  });

  it("renderiza el checklist de servicio", () => {
    const html = generateCleanScoreReport(basePayload);
    expect(html).toContain("Checklist del Servicio");
    expect(html).toContain("Cocina");
  });
});
