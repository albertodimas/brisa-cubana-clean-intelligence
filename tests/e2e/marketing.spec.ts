import { expect, test } from "@playwright/test";

test("@smoke @critical muestra tabla comparativa y CTAs instrumentados", async ({
  page,
}) => {
  await page.goto("/");

  const heading = page.getByRole("heading", {
    name: "¿Qué diferencia a cada paquete?",
  });
  await expect(heading).toBeVisible();

  const table = page.getByTestId("service-comparison-table");
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
