import { test, expect } from "@playwright/test";
import { establishSession } from "./fixtures/session";

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
  test.beforeEach(async ({ page, request }) => {
    await establishSession(page, request, {
      email: "admin@brisacubanaclean.com",
      password: "Admin123!",
    });

    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("should display dashboard overview", async ({ page }) => {
    // Check for dashboard heading with "Hola"
    await expect(page.getByRole("heading", { name: /hola/i })).toBeVisible();

    // Should show operational state section heading
    await expect(
      page.getByRole("heading", { name: /estado operacional/i }),
    ).toBeVisible();
  });

  test("should navigate to bookings page", async ({ page }) => {
    // Look for bookings link in navigation
    const bookingsLink = page.getByRole("link", { name: /reservas/i });

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
    const propertiesLink = page.getByRole("link", { name: /propiedades/i });

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
    // Should show user email in the page (use first() to handle multiple matches)
    await expect(
      page.getByText("admin@brisacubanaclean.com", { exact: false }).first(),
    ).toBeVisible();
  });
});
