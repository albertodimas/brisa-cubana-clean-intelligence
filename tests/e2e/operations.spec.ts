import { test, expect, Page } from "@playwright/test";
import type { TestInfo } from "@playwright/test";

const adminEmail = process.env.E2E_ADMIN_EMAIL ?? "admin@brisacubanaclean.com";
const adminPassword = process.env.E2E_ADMIN_PASSWORD ?? "Brisa123!";

function ipForTest(testInfo: TestInfo): string {
  let hash = 0;
  for (const char of testInfo.title) {
    hash = (hash * 31 + char.charCodeAt(0)) % 200;
  }
  const octet = 10 + (hash % 200);
  return `198.51.100.${octet}`;
}

async function login(page: Page, testInfo: TestInfo) {
  const ip = ipForTest(testInfo);
  await page.context().setExtraHTTPHeaders({ "x-forwarded-for": ip });
  await page.goto("/login");
  await page.getByLabel("Correo").fill(adminEmail);
  await page.getByLabel("Contraseña").fill(adminPassword);
  await page.getByRole("button", { name: "Ingresar" }).click();
  await page.waitForURL("/**");
  await expect(
    page.getByRole("heading", { name: "Panel operativo" }),
  ).toBeVisible();
}

test.describe("Operaciones", () => {
  test("permite crear un nuevo servicio", async ({ page }, testInfo) => {
    await login(page, testInfo);

    const uniqueName = `Servicio E2E ${Date.now().toString().slice(-6)}`;
    const serviceForm = page.locator("form").filter({
      has: page.getByRole("heading", { name: "Crear servicio" }),
    });

    await serviceForm.locator('input[name="name"]').fill(uniqueName);
    await serviceForm
      .locator('textarea[name="description"]')
      .fill("Servicio generado en pruebas E2E");
    await serviceForm.locator('input[name="basePrice"]').fill("199");
    await serviceForm.locator('input[name="durationMin"]').fill("120");
    await serviceForm.getByRole("button", { name: "Guardar" }).click();

    await expect(serviceForm.getByText("Servicio creado")).toBeVisible();
    await expect(page.getByText(uniqueName).first()).toBeVisible();
  });

  test("filtra reservas por estado", async ({ page }, testInfo) => {
    await login(page, testInfo);

    const statusSelect = page.getByTestId("booking-status-filter");
    await statusSelect.selectOption("CONFIRMED");

    const reservationCards = page.getByTestId("booking-card");

    await expect(reservationCards.first()).toBeVisible();
    await expect(
      reservationCards.first().locator('select[name="bookingStatus"]'),
    ).toHaveValue("CONFIRMED");
  });
});
