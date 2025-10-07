import { test, expect } from "@playwright/test";

const adminEmail = process.env.E2E_ADMIN_EMAIL ?? "admin@brisacubanaclean.com";
const adminPassword = process.env.E2E_ADMIN_PASSWORD ?? "Brisa123!";

test.describe("Autenticación", () => {
  test("permite iniciar sesión y acceder al panel operativo", async ({
    page,
  }) => {
    await page.goto("/login");

    await page.getByLabel("Correo").fill(adminEmail);
    await page.getByLabel("Contraseña").fill(adminPassword);
    await page.getByRole("button", { name: "Ingresar" }).click();

    await page.waitForURL("/**");
    await expect(
      page.getByRole("heading", { name: "Panel operativo" }),
    ).toBeVisible();
    await expect(
      page.getByText("Sesión activa", { exact: false }),
    ).toContainText(adminEmail);
  });
});
