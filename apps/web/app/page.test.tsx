import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

describe("LandingPage", () => {
  it("muestra hero y llamados a la acción", async () => {
    const { default: LandingPage } = await import("./page");
    const markup = renderToStaticMarkup(<LandingPage />);

    expect(markup).toContain(
      "Limpieza profesional para propiedades premium en Miami.",
    );
    expect(markup).toContain("Solicitar cotización");
    expect(markup).toContain("Explora el portal cliente");
  });

  it("detalla beneficios clave", async () => {
    const { default: LandingPage } = await import("./page");
    const markup = renderToStaticMarkup(<LandingPage />);

    expect(markup).toContain("Portal cliente y operaciones conectadas");
    expect(markup).toContain(
      "Alertas automáticas al detectar cambios de agenda o incidencias.",
    );
    expect(markup).toContain(
      "Vista del portal cliente de Brisa Cubana mostrando reservas y acciones disponibles.",
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
