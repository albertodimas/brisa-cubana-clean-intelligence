import { test, expect, Page } from "@playwright/test";

const adminEmail = process.env.E2E_ADMIN_EMAIL ?? "admin@brisacubanaclean.com";
const adminPassword = process.env.E2E_ADMIN_PASSWORD ?? "Brisa123!";

async function login(page: Page) {
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
  test("permite crear un nuevo servicio", async ({ page }) => {
    await login(page);

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

  test("filtra reservas por estado", async ({ page }) => {
    await login(page);

    const statusSelect = page.getByTestId("booking-status-filter");
    await statusSelect.selectOption("CONFIRMED");

    const reservationCards = page.getByTestId("booking-card");

    await expect(reservationCards.first()).toBeVisible();
    await expect(
      reservationCards.first().locator('select[name="bookingStatus"]'),
    ).toHaveValue("CONFIRMED");
  });
});
