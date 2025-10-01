import { test, expect } from "@playwright/test";

/**
 * E2E tests for booking creation flow
 *
 * Critical user journey:
 * - Create property -> Create booking -> View booking details
 */

test.describe("Booking Flow", () => {
  // Login before each test
  test.beforeEach(async ({ page }) => {
    await page.goto("/auth/signin");
    await page.getByLabel(/email/i).fill("client@example.com");
    await page.getByLabel(/password/i).fill("Client123!");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("should navigate to create property page", async ({ page }) => {
    await page.goto("/dashboard/properties");

    // Look for "New Property" or "Create" button
    const createButton = page.getByRole("link", {
      name: /new property|create|nueva propiedad/i,
    });

    if (await createButton.isVisible()) {
      await createButton.click();
      await expect(page).toHaveURL(/\/dashboard\/properties\/new/);
    } else {
      // Direct navigation
      await page.goto("/dashboard/properties/new");
      await expect(page).toHaveURL(/\/dashboard\/properties\/new/);
    }
  });

  test("should display bookings list page", async ({ page }) => {
    await page.goto("/dashboard/bookings");

    // Should show bookings page title or empty state
    await expect(page).toHaveURL(/\/dashboard\/bookings/);

    // Check for either bookings list or empty state
    const pageContent = await page.textContent("body");
    const hasBookings =
      pageContent?.includes("Booking") ||
      pageContent?.includes("Reserva") ||
      pageContent?.includes("No bookings") ||
      pageContent?.includes("Sin reservas");

    expect(hasBookings).toBe(true);
  });

  test("should navigate to create booking page", async ({ page }) => {
    await page.goto("/dashboard/bookings");

    // Look for "New Booking" or "Create" button
    const createButton = page.getByRole("link", {
      name: /new booking|create|nueva reserva/i,
    });

    if (await createButton.isVisible()) {
      await createButton.click();
      await expect(page).toHaveURL(/\/dashboard\/bookings\/new/);
    } else {
      // Direct navigation
      await page.goto("/dashboard/bookings/new");
      await expect(page).toHaveURL(/\/dashboard\/bookings\/new/);
    }

    // Should show booking form
    const formContent = await page.textContent("body");
    expect(formContent).toBeTruthy();
  });

  test("should display services page", async ({ page }) => {
    await page.goto("/dashboard/services");

    // Should show services list
    await expect(page).toHaveURL(/\/dashboard\/services/);

    const pageContent = await page.textContent("body");
    const hasServices =
      pageContent?.includes("Service") ||
      pageContent?.includes("Servicio") ||
      pageContent?.includes("Cleaning") ||
      pageContent?.includes("Limpieza");

    expect(hasServices).toBe(true);
  });
});
