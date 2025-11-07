import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api", () => ({
  getPortfolioStats: vi.fn().mockResolvedValue({
    activeProperties: 12,
    averageRating: "4.9",
    totalTurnovers: 320,
    period: "Q3 2025",
    lastUpdated: "2025-10-01T00:00:00.000Z",
  }),
  getTestimonials: vi.fn().mockResolvedValue([
    {
      id: "t1",
      author: "Ana Rivera",
      role: "Propietaria",
      quote: "El portal nos permite validar cada turno en minutos.",
      order: 1,
    },
  ]),
  getFAQs: vi.fn().mockResolvedValue([
    {
      id: "faq1",
      question: "¿Qué incluye cada turno?",
      answer: "Checklist de 100 puntos y evidencia fotográfica.",
      order: 1,
    },
  ]),
  getPricingTiers: vi.fn().mockResolvedValue([
    {
      id: "tier-1",
      tierCode: "standard",
      name: "Standard",
      headline: "Turnovers esenciales para STR",
      description: "Incluye limpieza premium y QA básico.",
      price: "$249",
      priceSuffix: "/turno",
      features: ["Checklists digitales", "Reportes en 4h"],
      order: 1,
    },
  ]),
}));

async function renderLandingPage() {
  const { default: LandingPage } = await import("./page");
  const tree = await LandingPage();
  return renderToStaticMarkup(tree);
}

describe("LandingPage", () => {
  it("muestra hero y llamados a la acción", async () => {
    const markup = await renderLandingPage();
    expect(markup).toContain(
      "Limpieza profesional y documentada para propiedades premium en Miami.",
    );
    expect(markup).toContain("Solicitar cotización");
    expect(markup).toContain("Conoce el portal (beta privada)");
  });

  it("detalla beneficios clave", async () => {
    const markup = await renderLandingPage();

    expect(markup).toContain(
      "Unimos operación premium, datos en vivo y soporte humano 24/7.",
    );
    expect(markup).toContain("Funcionalidades clave del portal");
    expect(markup).toContain(
      "Calidad supervisada en cada turno, lista para auditar.",
    );
    expect(markup).toContain("Agenda diagnóstico express");
    expect(markup).toContain("Solicitar playbook QA completo");
    expect(markup).toContain("¿Qué diferencia a cada paquete?");
  });

  it("presenta pricing, FAQ y formulario de contacto", async () => {
    const markup = await renderLandingPage();

    expect(markup).toContain("Planes y precios");
    expect(markup).toContain("Preguntas frecuentes");
    expect(markup).toContain("Recibir propuesta personalizada");
  });
});
