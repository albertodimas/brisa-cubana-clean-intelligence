import { test, expect } from "@playwright/test";

test.describe("Checkout público", () => {
  test("carga el flujo de checkout y muestra contenido principal @critical", async ({
    page,
  }) => {
    await page.goto("/checkout");

    await expect(
      page.getByRole("heading", {
        name: /reserva un servicio con pagos seguros usando stripe/i,
      }),
    ).toBeVisible();

    const fallbackHeading = page.getByRole("heading", {
      name: /Configura Stripe para habilitar el checkout público/i,
    });
    const fallbackVisible = (await fallbackHeading.count()) > 0;

    if (fallbackVisible) {
      await expect(fallbackHeading.first()).toBeVisible();
    } else {
      await expect(
        page.getByText(/Selecciona servicio y comparte tus datos/i),
      ).toBeVisible();
    }
  });
});
