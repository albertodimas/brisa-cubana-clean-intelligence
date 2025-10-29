import { test, expect } from "@playwright/test";

test.describe("Checkout público", () => {
  test("carga el flujo de checkout y muestra contenido principal @critical", async ({
    page,
  }) => {
    await page.goto("/checkout");

    const demoHeading = page.getByRole("heading", {
      name: /el checkout público estará disponible en producción muy pronto/i,
    });

    if ((await demoHeading.count()) > 0) {
      await expect(demoHeading.first()).toBeVisible();
      await expect(
        page.getByRole("link", { name: /formulario de contacto/i }),
      ).toBeVisible();
      await expect(
        page.getByText(/agenda tu diagnóstico operativo/i),
      ).toBeVisible();
      return;
    }

    await expect(
      page.getByRole("heading", {
        name: /reserva un servicio con pagos seguros usando stripe/i,
      }),
    ).toBeVisible();

    await expect(
      page.getByText(/Este flujo usa el Stripe Payment Element/i),
    ).toBeVisible();
  });
});
