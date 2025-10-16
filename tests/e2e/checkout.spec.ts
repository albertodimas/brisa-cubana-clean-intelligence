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

    // Validar que al menos uno de los estados (falta configurar Stripe o formulario)
    // esté presente para garantizar retroalimentación al usuario.
    const fallbackMessage = page.getByText(
      /Configura Stripe para habilitar el checkout público/i,
    );
    const fallbackVisible = await fallbackMessage
      .isVisible()
      .catch(() => false);

    if (!fallbackVisible) {
      await expect(
        page.getByText(/Selecciona servicio y comparte tus datos/i),
      ).toBeVisible();
    }
  });
});
