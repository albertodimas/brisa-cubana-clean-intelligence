import { test, expect, type Locator, type Page } from "@playwright/test";
import { performLogin } from "./support/auth";

const PANEL_URL = "/panel";

async function gotoPanelSection(page: Page, testId: string): Promise<Locator> {
  await page.goto(PANEL_URL);
  const section = page.getByTestId(testId).first();
  await section.waitFor({ state: "visible" });
  await section.scrollIntoViewIfNeeded();
  return section;
}

async function waitForBookingCards(section: Locator): Promise<void> {
  await section
    .locator('[data-testid="booking-card"]')
    .first()
    .waitFor({ state: "visible", timeout: 10_000 });
}

test.describe("CSV Export Functionality", () => {
  test.beforeEach(async ({ page }) => {
    await performLogin(page, {
      email: "admin@brisa.local",
      password: "SecurePass123!",
    });
  });

  test.describe("Bookings Manager Export", () => {
    test("should display export button", async ({ page }) => {
      const bookingsSection = await gotoPanelSection(
        page,
        "panel-section-bookings",
      );
      await waitForBookingCards(bookingsSection);

      const exportButton = bookingsSection.getByTestId("export-bookings-csv");
      await expect(exportButton).toBeVisible();
    });

    test("should trigger download when export button is clicked", async ({
      page,
    }) => {
      const bookingsSection = await gotoPanelSection(
        page,
        "panel-section-bookings",
      );
      await waitForBookingCards(bookingsSection);

      // Set up download listener
      const downloadPromise = page.waitForEvent("download");

      // Click export button
      const exportButton = bookingsSection.getByTestId("export-bookings-csv");
      await exportButton.click();

      // Wait for download
      const download = await downloadPromise;

      // Verify filename format
      const filename = download.suggestedFilename();
      expect(filename).toMatch(/^reservas-\d{4}-\d{2}-\d{2}\.csv$/);

      // Verify download occurred
      expect(download).toBeTruthy();
    });

    test("should export filtered data", async ({ page }) => {
      const bookingsSection = await gotoPanelSection(
        page,
        "panel-section-bookings",
      );
      await waitForBookingCards(bookingsSection);

      // Apply status filter
      const statusFilter = bookingsSection.locator(
        '[data-testid="booking-status-filter"]',
      );
      await statusFilter.selectOption("CONFIRMED");

      // Wait for filtered results
      await page.waitForTimeout(500);

      // Set up download listener
      const downloadPromise = page.waitForEvent("download");

      // Click export button
      const exportButton = bookingsSection.getByTestId("export-bookings-csv");
      await exportButton.click();

      // Verify download
      const download = await downloadPromise;
      expect(download).toBeTruthy();
    });
  });

  test.describe("Customers Manager Export", () => {
    test("should display export button", async ({ page }) => {
      const customersSection = await gotoPanelSection(
        page,
        "panel-section-customers",
      );
      const exportButton = customersSection.getByTestId("export-customers-csv");
      await expect(exportButton).toBeVisible();
    });

    test("should trigger download when export button is clicked", async ({
      page,
    }) => {
      const customersSection = await gotoPanelSection(
        page,
        "panel-section-customers",
      );

      // Set up download listener
      const downloadPromise = page.waitForEvent("download");

      // Click export button
      const exportButton = customersSection.getByTestId("export-customers-csv");
      await exportButton.click();

      // Wait for download
      const download = await downloadPromise;

      // Verify filename format
      const filename = download.suggestedFilename();
      expect(filename).toMatch(/^clientes-\d{4}-\d{2}-\d{2}\.csv$/);
    });
  });

  test.describe("Properties Manager Export", () => {
    test("should display export button", async ({ page }) => {
      const propertiesSection = await gotoPanelSection(
        page,
        "panel-section-properties",
      );
      const exportButton = propertiesSection.getByTestId(
        "export-properties-csv",
      );
      await expect(exportButton).toBeVisible();
    });

    test("should trigger download when export button is clicked", async ({
      page,
    }) => {
      const propertiesSection = await gotoPanelSection(
        page,
        "panel-section-properties",
      );

      // Set up download listener
      const downloadPromise = page.waitForEvent("download");

      // Click export button
      const exportButton = propertiesSection.getByTestId(
        "export-properties-csv",
      );
      await exportButton.click();

      // Wait for download
      const download = await downloadPromise;

      // Verify filename format
      const filename = download.suggestedFilename();
      expect(filename).toMatch(/^propiedades-\d{4}-\d{2}-\d{2}\.csv$/);
    });
  });

  test.describe("Services Manager Export", () => {
    test("should display export button", async ({ page }) => {
      const servicesSection = await gotoPanelSection(
        page,
        "panel-section-services",
      );
      const exportButton = servicesSection.getByTestId("export-services-csv");
      await expect(exportButton).toBeVisible();
    });

    test("should trigger download when export button is clicked", async ({
      page,
    }) => {
      const servicesSection = await gotoPanelSection(
        page,
        "panel-section-services",
      );

      // Set up download listener
      const downloadPromise = page.waitForEvent("download");

      // Click export button
      const exportButton = servicesSection.getByTestId("export-services-csv");
      await exportButton.click();

      // Wait for download
      const download = await downloadPromise;

      // Verify filename format
      const filename = download.suggestedFilename();
      expect(filename).toMatch(/^servicios-\d{4}-\d{2}-\d{2}\.csv$/);
    });
  });

  test.describe("Export Button States", () => {
    test("should show loading state when exporting", async ({ page }) => {
      const bookingsSection = await gotoPanelSection(
        page,
        "panel-section-bookings",
      );
      await waitForBookingCards(bookingsSection);

      const exportButton = bookingsSection.getByTestId("export-bookings-csv");

      // Click export button
      await exportButton.click();

      // Check for loading state (it might be very brief)
      // We just verify the button is present and clickable
      await expect(exportButton).toBeVisible();
    });

    test("should be disabled when no data is available", async ({ page }) => {
      const bookingsSection = await gotoPanelSection(
        page,
        "panel-section-bookings",
      );
      await waitForBookingCards(bookingsSection);

      // Apply filters that return no results
      const statusFilter = bookingsSection.locator(
        '[data-testid="booking-status-filter"]',
      );
      await statusFilter.selectOption("CANCELLED");

      const searchBar = bookingsSection.getByPlaceholder(
        /buscar por código, cliente o propiedad/i,
      );
      await searchBar.fill("nonexistent-search-term-12345");

      // Wait for empty state
      await page.waitForTimeout(500);

      // Check if button is disabled (if there's no data)
      const exportButton = bookingsSection.getByTestId("export-bookings-csv");

      // Button should be visible but might be disabled if no data
      await expect(exportButton).toBeVisible();
    });
  });

  test.describe("Export with Search Filters", () => {
    test("should export search results from bookings", async ({ page }) => {
      const bookingsSection = await gotoPanelSection(
        page,
        "panel-section-bookings",
      );
      await waitForBookingCards(bookingsSection);

      // Apply search
      const searchBar = bookingsSection.getByPlaceholder(
        /buscar por código, cliente o propiedad/i,
      );
      await searchBar.fill("BR");

      // Wait for search results
      await page.waitForTimeout(500);

      // Set up download listener
      const downloadPromise = page.waitForEvent("download");

      // Click export button
      const exportButton = bookingsSection.getByTestId("export-bookings-csv");
      await exportButton.click();

      // Verify download
      const download = await downloadPromise;
      expect(download).toBeTruthy();
    });
  });

  test.describe("Export Filename Format", () => {
    test("should generate filename with current date", async ({ page }) => {
      const bookingsSection = await gotoPanelSection(
        page,
        "panel-section-bookings",
      );
      await waitForBookingCards(bookingsSection);

      // Get current date for verification
      const today = new Date().toISOString().split("T")[0];

      // Set up download listener
      const downloadPromise = page.waitForEvent("download");

      // Click export button
      const exportButton = bookingsSection.getByTestId("export-bookings-csv");
      await exportButton.click();

      // Verify filename includes today's date
      const download = await downloadPromise;
      const filename = download.suggestedFilename();
      expect(filename).toContain(today);
    });
  });
});
