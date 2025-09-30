import { test, expect } from "@playwright/test";

test.describe("Landing page", () => {
  test("shows hero metrics and CTA buttons", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "El sistema operativo inteligente para la limpieza boutique de Miami-Dade.",
    );

    const metricCards = page.getByText("Onboarding digital promedio");
    await expect(metricCards).toBeVisible();

    await expect(
      page.getByRole("link", { name: "Agendar demo piloto" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Roadmap 12+ meses" }),
    ).toBeVisible();
  });
});
