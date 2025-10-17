import { expect, test } from "@playwright/test";

const CUSTOMER_EMAIL = "client@brisacubanaclean.com";

function toDatetimeLocal(date: Date): string {
  const pad = (value: number) => value.toString().padStart(2, "0");
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

test.describe("@critical portal cliente – flujo completo", () => {
  test("@critical valida enlace mágico, navega dashboard y ejecuta acciones", async ({
    page,
  }) => {
    // Solicita enlace mágico y obtiene token de depuración
    const requestResponse = await page.request.post(
      "/api/portal/auth/request",
      {
        headers: { "content-type": "application/json" },
        data: { email: CUSTOMER_EMAIL },
      },
    );
    await expect(requestResponse).toBeOK();
    const requestPayload = (await requestResponse.json()) as {
      debugToken?: string;
    };
    expect(requestPayload.debugToken).toBeTruthy();
    const debugToken = requestPayload.debugToken as string;

    // Verifica enlace mágico y espera redirección al dashboard
    await page.goto(`/clientes/acceso/confirmar?token=${debugToken}`);
    await expect(
      page.getByRole("heading", { name: "Validando tu enlace de acceso" }),
    ).toBeVisible();
    await expect(
      page.getByText("¡Listo! Tu enlace se validó correctamente."),
    ).toBeVisible();
    await page.waitForURL(/\/clientes\/[a-z0-9]+$/i, {
      timeout: 10_000,
    });
    await expect(
      page.getByRole("heading", {
        name: /¡?Hola .*Estas son tus reservas/i,
      }),
    ).toBeVisible();
    await expect(page.getByText("Tu sesión vence")).toBeVisible();

    const dashboardUrl = new URL(page.url());
    const customerIdMatch = dashboardUrl.pathname.match(/\/clientes\/([^/]+)/i);
    const currentCustomerId = customerIdMatch?.[1] ?? "[a-z0-9]+";

    const targetBookingCard = page.locator("[data-portal-booking-id]").first();
    await expect(targetBookingCard).toBeVisible();
    const targetBookingCode =
      (await targetBookingCard.getAttribute("data-portal-booking-code")) ?? "";
    expect(targetBookingCode).toBeTruthy();
    const targetBookingId =
      (await targetBookingCard.getAttribute("data-portal-booking-id")) ?? "";
    expect(targetBookingId).toBeTruthy();
    const targetBookingTitleRaw =
      (
        (await targetBookingCard.getByRole("heading").textContent()) ?? ""
      ).trim() ?? "";
    expect(targetBookingTitleRaw).toBeTruthy();
    const [serviceName, propertyLabel] = targetBookingTitleRaw
      .split("·")
      .map((value) => value.trim());
    const expectedDetailHeading =
      serviceName && propertyLabel
        ? `${serviceName} en ${propertyLabel}`
        : targetBookingTitleRaw;

    await Promise.all([
      page.waitForURL(
        new RegExp(
          `/clientes/${currentCustomerId}/reservas/${targetBookingId}`,
        ),
        { waitUntil: "commit" },
      ),
      targetBookingCard.getByRole("link", { name: "Ver detalle" }).click(),
    ]);
    await expect(
      page.getByRole("heading", {
        name: new RegExp(escapeRegExp(expectedDetailHeading), "i"),
      }),
    ).toBeVisible();
    await expect(page.locator("main")).toContainText(targetBookingCode);
    await expect(page.getByText("¿Necesitas ayuda?")).toBeVisible();
    await Promise.all([
      page.waitForURL(new RegExp(`/clientes/${currentCustomerId}$`), {
        waitUntil: "commit",
      }),
      page.getByRole("link", { name: "Volver al dashboard" }).click(),
    ]);

    const refreshedCard = page.locator(
      `[data-portal-booking-id="${targetBookingId}"]`,
    );
    await expect(refreshedCard).toBeVisible();

    await refreshedCard.getByRole("button", { name: "Reagendar" }).click();

    const newDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
    const newDateValue = toDatetimeLocal(newDate);
    await page.getByLabel("Nueva fecha").fill(newDateValue, { timeout: 5_000 });
    await page
      .getByLabel("Comentarios para operaciones (opcional)")
      .fill("Reprogramado desde pruebas automáticas");
    await page.getByRole("button", { name: "Enviar solicitud" }).click();
    await expect(
      page.getByText(/Tu solicitud de reagendado fue enviada/i),
    ).toBeVisible();

    // Cancelar la misma reserva (la lista se refresca después del mutate)
    await refreshedCard.getByRole("button", { name: "Cancelar" }).click();
    await page
      .getByLabel("Motivo (opcional)")
      .fill("Cancelación desde pruebas automáticas");
    await page.getByRole("button", { name: "Enviar solicitud" }).click();
    await expect(
      page.getByText(/Tu solicitud de cancelación fue registrada/i),
    ).toBeVisible();

    // Cerrar sesión
    await page.request.post("/api/portal/logout");
    await page.goto("/clientes/acceso");
    await expect(
      page.getByRole("heading", {
        name: "Recibe un enlace mágico en tu correo",
      }),
    ).toBeVisible();
  });
});
