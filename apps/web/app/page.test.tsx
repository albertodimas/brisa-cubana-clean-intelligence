import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

describe("LandingPage", () => {
  it("muestra hero y llamados a la acción", async () => {
    const { default: LandingPage } = await import("./page");
    const markup = renderToStaticMarkup(<LandingPage />);

    expect(markup).toContain(
      "Limpieza profesional y documentada para propiedades premium en Miami.",
    );
    expect(markup).toContain("Solicitar cotización");
    expect(markup).toContain("Conoce el portal (beta privada)");
  });

  it("detalla beneficios clave", async () => {
    const { default: LandingPage } = await import("./page");
    const markup = renderToStaticMarkup(<LandingPage />);

    expect(markup).toContain(
      "Unimos operación premium, datos en vivo y soporte humano 24/7.",
    );
    expect(markup).toContain("Funcionalidades clave del portal");
    expect(markup).toContain(
      "Calidad supervisada en cada turno, lista para auditar.",
    );
  });

  it("presenta pricing, FAQ y formulario de contacto", async () => {
    const { default: LandingPage } = await import("./page");
    const markup = renderToStaticMarkup(<LandingPage />);

    expect(markup).toContain("Planes y precios");
    expect(markup).toContain("Preguntas frecuentes");
    expect(markup).toContain("Recibir propuesta personalizada");
  });
});
