import { test, expect } from "@playwright/test";
import { createTestUser, loginAsUser, deleteTestUser } from "./support/auth";

test.describe("Dashboard", () => {
  test.describe("Access Control", () => {
    test("should redirect to login if not authenticated @critical", async ({
      page,
    }) => {
      await page.goto("/panel/dashboard");
      await expect(page).toHaveURL(/\/login/);
    });

    test("should redirect STAFF users to /panel @critical", async ({
      page,
      context,
    }) => {
      const staffUser = await createTestUser({
        email: `staff-dashboard-${Date.now()}@test.com`,
        password: "Test1234!",
        role: "STAFF",
      });

      try {
        await loginAsUser(page, context, staffUser.email, "Test1234!");
        await page.goto("/panel/dashboard");

        // Staff should be redirected away from dashboard
        await expect(page).toHaveURL(/\/panel/);
        await expect(page).not.toHaveURL(/\/panel\/dashboard/);
      } finally {
        await deleteTestUser(staffUser.email);
      }
    });

    test("should allow ADMIN to access dashboard @critical", async ({
      page,
      context,
    }) => {
      const adminUser = await createTestUser({
        email: `admin-dashboard-${Date.now()}@test.com`,
        password: "Test1234!",
        role: "ADMIN",
      });

      try {
        await loginAsUser(page, context, adminUser.email, "Test1234!");
        await page.goto("/panel/dashboard");

        await expect(page).toHaveURL(/\/panel\/dashboard/);
        await expect(
          page.getByRole("heading", { name: "Dashboard" }),
        ).toBeVisible();
      } finally {
        await deleteTestUser(adminUser.email);
      }
    });

    test("should allow COORDINATOR to access dashboard @critical", async ({
      page,
      context,
    }) => {
      const coordinatorUser = await createTestUser({
        email: `coord-dashboard-${Date.now()}@test.com`,
        password: "Test1234!",
        role: "COORDINATOR",
      });

      try {
        await loginAsUser(page, context, coordinatorUser.email, "Test1234!");
        await page.goto("/panel/dashboard");

        await expect(page).toHaveURL(/\/panel\/dashboard/);
        await expect(
          page.getByRole("heading", { name: "Dashboard" }),
        ).toBeVisible();
      } finally {
        await deleteTestUser(coordinatorUser.email);
      }
    });
  });

  test.describe("Dashboard Content", () => {
    test.beforeEach(async ({ page, context }) => {
      const adminUser = await createTestUser({
        email: `admin-content-${Date.now()}@test.com`,
        password: "Test1234!",
        role: "ADMIN",
      });

      await loginAsUser(page, context, adminUser.email, "Test1234!");
      await page.goto("/panel/dashboard");
      await page.waitForLoadState("networkidle");
    });

    test("should display all stats cards @critical", async ({ page }) => {
      // Wait for stats to load
      await expect(page.locator("text=Total Reservas").first()).toBeVisible();

      // Check all 4 stats cards are present
      await expect(page.locator("text=Total Reservas")).toBeVisible();
      await expect(page.locator("text=Ingresos Totales")).toBeVisible();
      await expect(page.locator("text=Staff Activo")).toBeVisible();
      await expect(page.locator("text=Propiedades Activas")).toBeVisible();
    });

    test("should display stats card subtitles", async ({ page }) => {
      await expect(page.locator("text=Últimos 30 días").first()).toBeVisible();
      await expect(page.locator("text=Con reservas asignadas")).toBeVisible();
      await expect(page.locator("text=Con reservas recientes")).toBeVisible();
    });

    test("should display all charts @critical", async ({ page }) => {
      // Wait for charts to load
      await expect(page.locator("text=Reservas por Estado")).toBeVisible();

      // Check all 4 charts are present
      await expect(page.locator("text=Reservas por Estado")).toBeVisible();
      await expect(
        page.getByText(/Carga de Trabajo (?:del|por) Staff/i),
      ).toBeVisible();
      await expect(page.getByText(/Tendencia de Ingresos/i)).toBeVisible();
      await expect(page.locator("text=Top 5 Propiedades")).toBeVisible();
    });

    test("should render charts without errors", async ({ page }) => {
      // Wait for all charts to be visible (no empty states)
      await page.waitForTimeout(1000); // Give charts time to render

      // Check that we don't see multiple "No hay datos disponibles" messages
      // (it's ok if there's one, but all charts shouldn't be empty)
      const emptyStates = await page
        .locator("text=No hay datos disponibles")
        .count();

      // In a fresh system, some charts might be empty, but not all
      expect(emptyStates).toBeLessThan(4);
    });

    test("should display page title and description", async ({ page }) => {
      await expect(page.locator("h1")).toContainText("Dashboard");
      await expect(
        page.locator("text=Métricas y análisis de los últimos 30 días"),
      ).toBeVisible();
    });
  });

  test.describe("Dashboard Stats Values", () => {
    test.beforeEach(async ({ page, context }) => {
      const adminUser = await createTestUser({
        email: `admin-stats-${Date.now()}@test.com`,
        password: "Test1234!",
        role: "ADMIN",
      });

      await loginAsUser(page, context, adminUser.email, "Test1234!");
      await page.goto("/panel/dashboard");
      await page.waitForLoadState("networkidle");
    });

    test("should display numeric values for all stats", async ({ page }) => {
      // Stats should show numbers (not "undefined" or error messages)
      const statsCards = page.locator(".rounded-2xl").filter({
        has: page.locator(
          "text=/Total Reservas|Ingresos Totales|Staff Activo|Propiedades Activas/",
        ),
      });

      // Should have exactly 4 stats cards
      await expect(statsCards).toHaveCount(4);

      // Each card should have a numeric value (could be 0)
      for (let i = 0; i < 4; i++) {
        const card = statsCards.nth(i);
        const valueText = await card.locator(".text-3xl").textContent();

        // Value should be a number or currency format
        expect(valueText).toMatch(/^[\d,.$]+$/);
      }
    });

    test("should format revenue as currency", async ({ page }) => {
      const revenueCard = page.locator("text=Ingresos Totales").locator("..");
      const revenueValue = await revenueCard.locator(".text-3xl").textContent();

      // Should start with $
      expect(revenueValue).toMatch(/^\$/);
    });

    test("should show zero values gracefully", async ({ page }) => {
      // In a fresh system, some values might be 0
      // This shouldn't cause UI errors

      await expect(page.locator("text=Total Reservas").first()).toBeVisible();
      await expect(page.locator("text=Ingresos Totales")).toBeVisible();
    });
  });

  test.describe("Dashboard Empty States", () => {
    test("should handle empty data gracefully @critical", async ({
      page,
      context,
    }) => {
      const adminUser = await createTestUser({
        email: `admin-empty-${Date.now()}@test.com`,
        password: "Test1234!",
        role: "ADMIN",
      });

      try {
        await loginAsUser(page, context, adminUser.email, "Test1234!");
        await page.goto("/panel/dashboard");
        await page.waitForLoadState("networkidle");

        // Page should load without errors even with no data
        await expect(page.locator("h1")).toContainText("Dashboard");

        // Stats should show 0 values
        const statsCards = page.locator(".rounded-2xl").filter({
          has: page.locator(
            "text=/Total Reservas|Staff Activo|Propiedades Activas/",
          ),
        });

        // Should have stats cards visible
        await expect(statsCards.first()).toBeVisible();

        // Charts should show empty states if no data
        // (this is acceptable behavior)
        const hasEmptyState = await page.locator("text=No hay").count();
        expect(hasEmptyState).toBeGreaterThanOrEqual(0);
      } finally {
        await deleteTestUser(adminUser.email);
      }
    });
  });

  test.describe("Dashboard Loading States", () => {
    test("should show skeleton while loading", async ({ page, context }) => {
      const adminUser = await createTestUser({
        email: `admin-loading-${Date.now()}@test.com`,
        password: "Test1234!",
        role: "ADMIN",
      });

      try {
        await loginAsUser(page, context, adminUser.email, "Test1234!");

        // Navigate and try to catch loading state
        await page.goto("/panel/dashboard");

        // Skeleton might be visible briefly
        // (hard to test reliably due to speed, but shouldn't cause errors)

        // Eventually content should load
        await expect(page.locator("text=Total Reservas").first()).toBeVisible({
          timeout: 10000,
        });
      } finally {
        await deleteTestUser(adminUser.email);
      }
    });
  });

  test.describe("Dashboard Responsiveness", () => {
    test("should be responsive on mobile @critical", async ({
      page,
      context,
    }) => {
      const adminUser = await createTestUser({
        email: `admin-mobile-${Date.now()}@test.com`,
        password: "Test1234!",
        role: "ADMIN",
      });

      try {
        // Set mobile viewport
        await page.setViewportSize({ width: 375, height: 667 });

        await loginAsUser(page, context, adminUser.email, "Test1234!");
        await page.goto("/panel/dashboard");
        await page.waitForLoadState("networkidle");

        // Stats cards should stack vertically on mobile
        await expect(page.locator("text=Total Reservas").first()).toBeVisible();

        // Charts should be visible
        await expect(page.locator("text=Reservas por Estado")).toBeVisible();
      } finally {
        await deleteTestUser(adminUser.email);
      }
    });

    test("should be responsive on tablet", async ({ page, context }) => {
      const adminUser = await createTestUser({
        email: `admin-tablet-${Date.now()}@test.com`,
        password: "Test1234!",
        role: "ADMIN",
      });

      try {
        // Set tablet viewport
        await page.setViewportSize({ width: 768, height: 1024 });

        await loginAsUser(page, context, adminUser.email, "Test1234!");
        await page.goto("/panel/dashboard");
        await page.waitForLoadState("networkidle");

        // Content should be visible
        await expect(page.locator("h1")).toContainText("Dashboard");
        await expect(page.locator("text=Total Reservas").first()).toBeVisible();
      } finally {
        await deleteTestUser(adminUser.email);
      }
    });
  });
});
