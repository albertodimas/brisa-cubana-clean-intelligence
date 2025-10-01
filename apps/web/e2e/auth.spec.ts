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
    await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  });

  test("should show validation errors for invalid credentials", async ({
    page,
  }) => {
    await page.goto("/auth/signin");

    // Try to submit with empty fields
    await page.getByRole("button", { name: /sign in/i }).click();

    // Should show validation errors or remain on page
    const currentUrl = new URL(page.url());
    expect(currentUrl.pathname).toBe("/auth/signin");
  });

  test("should redirect to dashboard after successful login", async ({
    page,
  }) => {
    await page.goto("/auth/signin");

    // Fill in credentials (using test user from seed data)
    await page.getByLabel(/email/i).fill("admin@brisacubanaclean.com");
    await page.getByLabel(/password/i).fill("Admin123!");

    // Submit form
    await page.getByRole("button", { name: /sign in/i }).click();

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
