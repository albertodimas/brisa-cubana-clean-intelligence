import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

describe("LandingPage", () => {
  it("muestra hero y llamados a la acción", async () => {
    const { default: LandingPage } = await import("./page");
    const markup = renderToStaticMarkup(<LandingPage />);

    expect(markup).toContain("Limpieza hotelera para renta corta");
    expect(markup).toContain("Solicita una propuesta");
    expect(markup).toContain("Explora el portal cliente");
  });

  it("detalla beneficios clave", async () => {
    const { default: LandingPage } = await import("./page");
    const markup = renderToStaticMarkup(<LandingPage />);

    expect(markup).toContain("Equipos confiables");
    expect(markup).toContain("Pagos sin fricción");
    expect(markup).toContain("Agenda una inspección");
  });
});
