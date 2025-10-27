import { expect, test, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";

const CUSTOMER_EMAIL = "cliente@brisacubanacleanintelligence.com";
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

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

async function requestPortalDebugToken(page: Page, email: string) {
  const response = await page.request.post("/api/portal/auth/request", {
    headers: { "content-type": "application/json" },
    data: { email },
  });
  expect(response.ok()).toBeTruthy();
  const payload = (await response.json()) as { debugToken?: string };
  expect(payload.debugToken).toBeTruthy();
  return payload.debugToken as string;
}

async function completePortalLogin(page: Page, token: string) {
  await page.goto(`/clientes/acceso/confirmar?token=${token}`);
  await expect(
    page.getByRole("heading", { name: "Validando tu enlace de acceso" }),
  ).toBeVisible();
  await expect(
    page.getByText("¡Listo! Tu enlace se validó correctamente."),
  ).toBeVisible();
  await page.waitForURL(/\/clientes\/[a-z0-9]+$/i, {
    timeout: 10_000,
  });
  const dashboardUrl = new URL(page.url());
  const customerIdMatch = dashboardUrl.pathname.match(/\/clientes\/([^/]+)/i);
  const customerId = customerIdMatch?.[1];
  expect(customerId).toBeTruthy();
  await expect(
    page.getByRole("heading", {
      name: /¡?Hola .*Estas son tus reservas/i,
    }),
  ).toBeVisible();
  return customerId as string;
}

test.afterEach(async ({ page }) => {
  await page.request.post("/api/portal/logout").catch(() => {});
  await page.request
    .post(`${API_BASE_URL}/api/authentication/logout`, {
      headers: { "content-type": "application/json" },
      data: {},
    })
    .catch(() => {});
});

test.describe("@critical portal cliente – flujo completo", () => {
  test("@critical valida enlace mágico, navega dashboard y ejecuta acciones", async ({
    page,
  }) => {
    const debugToken = await requestPortalDebugToken(page, CUSTOMER_EMAIL);
    const currentCustomerId = await completePortalLogin(page, debugToken);
    await expect(page.getByText("Tu sesión vence")).toBeVisible();

    const bookingCards = page.locator("[data-portal-booking-id]");
    await expect(bookingCards.first()).toBeVisible();
    const totalBookings = await bookingCards.count();
    expect(totalBookings).toBeGreaterThan(1);
    const targetBookingCard = bookingCards.first();
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

test("@mobile portal cliente – layout responsivo y navegación", async ({
  page,
}, _testInfo) => {
  test.skip(
    _testInfo.project.name !== "mobile-chrome",
    "Solo se ejecuta en la configuración mobile",
  );

  const debugToken = await requestPortalDebugToken(page, CUSTOMER_EMAIL);
  const customerId = await completePortalLogin(page, debugToken);
  await expect(page.getByText("Tu sesión vence")).toBeVisible();

  const viewport = page.viewportSize();
  expect(viewport?.width).toBeLessThanOrEqual(430);

  const bookingCards = page.locator("[data-portal-booking-id]");
  await expect(bookingCards.first()).toBeVisible();
  const totalBookings = await bookingCards.count();
  expect(totalBookings).toBeGreaterThan(1);
  const bookingCard = bookingCards.first();
  const bookingTitleRaw =
    ((await bookingCard.getByRole("heading").textContent()) ?? "").trim() ?? "";
  const [serviceName, propertyLabel] = bookingTitleRaw
    .split("·")
    .map((value) => value.trim());
  const expectedDetailHeading =
    serviceName && propertyLabel
      ? `${serviceName} en ${propertyLabel}`
      : bookingTitleRaw;

  await expect(
    bookingCard.getByRole("button", { name: "Reagendar" }),
  ).toBeVisible();
  await expect(
    bookingCard.getByRole("button", { name: "Cancelar" }),
  ).toBeVisible();

  await Promise.all([
    page.waitForURL(
      new RegExp(`/clientes/${customerId}/reservas/[a-z0-9-]+`, "i"),
    ),
    bookingCard.getByRole("link", { name: "Ver detalle" }).click(),
  ]);
  await expect(
    page.getByRole("heading", {
      name: new RegExp(escapeRegExp(expectedDetailHeading), "i"),
    }),
  ).toBeVisible();
  await Promise.all([
    page.waitForURL(new RegExp(`/clientes/${customerId}$`, "i")),
    page.getByRole("link", { name: "Volver al dashboard" }).click(),
  ]);

  await page.waitForTimeout(4_000);
  await expect(
    page.locator(
      "text=No pudimos actualizar tus reservas automáticamente. Intenta recargar manualmente.",
    ),
  ).toHaveCount(0);
});

test("@full portal cliente – muestra estado sin reservas activas", async ({
  page,
}, testInfo) => {
  const uniqueSuffix = randomUUID().slice(0, 8);
  const newEmail = `portal-empty-${uniqueSuffix}@clientes.brisa.test`;
  const fullName = `Portal Demo ${uniqueSuffix}`;
  const password = "Brisa123!";

  const adminLogin = await page.request.post(
    `${API_BASE_URL}/api/authentication/login`,
    {
      headers: { "content-type": "application/json" },
      data: {
        email: "admin@brisacubanacleanintelligence.com",
        password,
      },
    },
  );
  expect(adminLogin.ok()).toBeTruthy();

  const createUserResponse = await page.request.post(
    `${API_BASE_URL}/api/users`,
    {
      headers: { "content-type": "application/json" },
      data: {
        email: newEmail,
        fullName,
        password,
        role: "CLIENT",
      },
    },
  );
  expect(createUserResponse.status()).toBe(201);
  const createdUser = (await createUserResponse.json()) as {
    data?: { id: string };
  };
  const createdUserId = createdUser.data?.id;
  expect(createdUserId).toBeTruthy();

  try {
    const debugToken = await requestPortalDebugToken(page, newEmail);
    await completePortalLogin(page, debugToken);
    await expect(page.getByText("Tu sesión vence")).toBeVisible();

    const emptyState = page.locator(
      "text=No encontramos reservas próximas en tu cuenta.",
    );
    await expect(emptyState).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Solicitar un nuevo servicio →" }),
    ).toBeVisible();
    await expect(page.locator("[data-portal-booking-id]")).toHaveCount(0);
  } finally {
    if (createdUserId) {
      await page.request
        .delete(`${API_BASE_URL}/api/users/${createdUserId}`)
        .catch(() => {});
    }
  }
});
