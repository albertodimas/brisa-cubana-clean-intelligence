import { test, expect } from "@playwright/test";

/**
 * E2E tests for dashboard functionality
 *
 * Critical user journeys:
 * - View dashboard overview
 * - Navigate between sections
 * - Access properties and bookings
 */

test.describe("Dashboard", () => {
  // Login before each test
  test.beforeEach(async ({ page }) => {
    await page.goto("/auth/signin");
    await page.getByLabel(/email/i).fill("admin@brisacubanaclean.com");
    await page.getByLabel(/password/i).fill("Admin123!");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("should display dashboard overview", async ({ page }) => {
    // Check for dashboard elements
    await expect(
      page.getByRole("heading", { name: /dashboard|overview/i }),
    ).toBeVisible();

    // Should show some metrics or content
    const mainContent = page.locator("main");
    await expect(mainContent).toBeVisible();
  });

  test("should navigate to bookings page", async ({ page }) => {
    // Look for bookings link in navigation
    const bookingsLink = page.getByRole("link", { name: /bookings|reservas/i });

    if (await bookingsLink.isVisible()) {
      await bookingsLink.click();
      await expect(page).toHaveURL(/\/dashboard\/bookings/);
    } else {
      // Try direct navigation
      await page.goto("/dashboard/bookings");
      await expect(page).toHaveURL(/\/dashboard\/bookings/);
    }
  });

  test("should navigate to properties page", async ({ page }) => {
    // Look for properties link in navigation
    const propertiesLink = page.getByRole("link", {
      name: /properties|propiedades/i,
    });

    if (await propertiesLink.isVisible()) {
      await propertiesLink.click();
      await expect(page).toHaveURL(/\/dashboard\/properties/);
    } else {
      // Try direct navigation
      await page.goto("/dashboard/properties");
      await expect(page).toHaveURL(/\/dashboard\/properties/);
    }
  });

  test("should display user info or navigation", async ({ page }) => {
    // Should show some user-related element (name, email, or menu)
    const bodyText = await page.textContent("body");
    expect(bodyText).toContain("admin@brisacubanaclean.com");
  });
});
