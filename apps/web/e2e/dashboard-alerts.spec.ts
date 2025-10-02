import { expect, test, type Page } from "@playwright/test";

async function signIn(page: Page, email: string, password: string) {
  await page.goto("/auth/signin");
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/contraseña/i).fill(password);
  await page.getByRole("button", { name: /entrar/i }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
}

test.describe("financial alerts widget", () => {
  test("renders alerts card for finance roles when reconciliation alerts exist", async ({
    page,
  }) => {
    await signIn(page, "admin@brisacubanaclean.com", "Admin123!");

    const alertHeading = page.getByText(/alertas de conciliación/i);
    await expect(alertHeading).toBeVisible();
    await expect(page.getByText(/pagos marcados como\s+FAILED/i)).toBeVisible();
  });

  test("remains hidden for client accounts", async ({ page }) => {
    await signIn(page, "client@brisacubanaclean.com", "Client123!");

    const alertHeading = page.getByText(/alertas de conciliación/i);
    await expect(alertHeading).toHaveCount(0);
  });
});
