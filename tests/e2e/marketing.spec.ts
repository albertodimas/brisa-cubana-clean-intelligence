import { expect, test } from "@playwright/test";

test("@smoke @critical muestra tabla comparativa y CTAs instrumentados", async ({
  page,
}) => {
  await page.goto("/");

  const heading = page
    .getByRole("heading", {
      name: "¿Qué diferencia a cada paquete?",
    })
    .first();
  await heading.scrollIntoViewIfNeeded();
  await expect(heading).toBeVisible();

  const table = page.getByTestId("service-comparison-table").first();
  await table.scrollIntoViewIfNeeded();
  await expect(table).toBeVisible();

  const rows = table.locator("tbody tr");
  await expect(rows).toHaveCount(3);

  const turnoverRow = table.locator("tbody tr").first();
  await expect(
    turnoverRow.locator("td").nth(1).getByText("Airbnb / STR 6-20 unidades"),
  ).toBeVisible();

  const turnoverCta = page.getByTestId("plan-cta-turnover");
  await expect(turnoverCta).toHaveAttribute(
    "href",
    expect.stringContaining("?plan=turnover"),
  );

  // Los tres CTAs deben apuntar al formulario de contacto
  for (const serviceId of ["turnover", "deep-clean", "post-construction"]) {
    const cta = page.getByTestId(`plan-cta-${serviceId}`);
    await expect(cta).toHaveAttribute(
      "href",
      expect.stringContaining("#contacto"),
    );
  }
});

test("@critical muestra métricas de mercado con datos reales", async ({
  page,
}) => {
  await page.goto("/");

  const snapshotSection = page.getByTestId("market-stats-snapshot").first();
  await expect(snapshotSection).toBeVisible();

  const expectations = [
    { label: "Ocupación promedio anual", value: "72%" },
    { label: "Tarifa diaria media (ADR) en Miami", value: "$215" },
    { label: "Listados activos en el mercado STR", value: "13.8K+" },
    { label: "Visitantes totales en 2024", value: "24M" },
  ];

  for (const { label, value } of expectations) {
    const container = page
      .getByText(label, { exact: false })
      .locator("..")
      .first();
    await expect(container.getByText(value)).toBeVisible();
  }

  const snapshotList = snapshotSection.locator("dl").first();
  await expect(
    snapshotList.getByText("Dato en actualización", { exact: false }),
  ).toHaveCount(0);
});
