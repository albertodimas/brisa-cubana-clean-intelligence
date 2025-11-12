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
    expect(markup).toContain("Agendar diagnóstico");
    expect(markup).toContain("Ver portal");
  });

  it("detalla beneficios clave", async () => {
    const markup = await renderLandingPage();

    expect(markup).toContain("Por qué Brisa Cubana");
    expect(markup).toContain("Operación premium con resultados medibles");
    expect(markup).toContain("Servicios clave");
    expect(markup).toContain("Portal cliente");
  });

  it("presenta testimonios, FAQ y formulario de contacto", async () => {
    const markup = await renderLandingPage();

    expect(markup).toContain("Preguntas frecuentes");
    expect(markup).toContain("Hosts y PMs con operación documentada");
    expect(markup).toContain('id="contacto-form"');
  });
});
