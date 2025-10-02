import { test, expect } from "@playwright/test";

/**
 * E2E tests for authentication flows
 *
 * Critical user journey: Sign in -> Access dashboard
 */

test.describe("Authentication", () => {
  test("should display sign in page", async ({ page }) => {
    await page.goto("/auth/signin");

    // Check for sign in form elements
    await expect(
      page.getByRole("heading", { name: /inicia sesión/i }),
    ).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/contraseña/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /entrar/i })).toBeVisible();
  });

  test("should show validation errors for invalid credentials", async ({
    page,
  }) => {
    await page.goto("/auth/signin");

    const emailInput = page.getByLabel(/email/i);
    const passwordInput = page.getByLabel(/contraseña/i);

    await emailInput.fill("wrong@example.com");
    await passwordInput.fill("wrong-password");
    await expect(emailInput).toHaveValue("wrong@example.com");
    await expect(passwordInput).toHaveValue("wrong-password");
    await page.getByRole("button", { name: /entrar/i }).click();

    await expect(page.getByText("Credenciales inválidas.")).toBeVisible();
    await expect(page).toHaveURL(/\/auth\/signin/);
  });

  test("should redirect to dashboard after successful login", async ({
    page,
  }) => {
    await page.goto("/auth/signin");

    // Fill in credentials (using test user from seed data)
    const emailInput = page.getByLabel(/email/i);
    const passwordInput = page.getByLabel(/contraseña/i);

    await emailInput.fill("admin@brisacubanaclean.com");
    await passwordInput.fill("Admin123!");
    await expect(emailInput).toHaveValue("admin@brisacubanaclean.com");
    await expect(passwordInput).toHaveValue("Admin123!");

    // Submit form
    await page.getByRole("button", { name: /entrar/i }).click();

    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("should redirect to sign in when accessing protected route without auth", async ({
    page,
  }) => {
    await page.goto("/dashboard");

    // Should be redirected to sign in page
    await expect(page).toHaveURL(/\/auth\/signin/);
  });
});
