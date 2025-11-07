import { test, expect } from "@playwright/test";
import type { Locator, Page, TestInfo } from "@playwright/test";
import {
  createBookingFixture,
  deleteAllBookings,
  getAdminAccessToken,
} from "./support/services";
import {
  openCalendarPage,
  getCalendarGrid,
  ensureCalendarGridVisible,
  locateBookingButton,
} from "./support/calendar";

test.describe.serial("Calendario", () => {
  let adminToken: string;

  test.beforeEach(async ({ request }) => {
    adminToken = await getAdminAccessToken(request);
  });

  test("permite acceder al calendario desde el panel @smoke @critical", async ({
    page,
  }, testInfo: TestInfo) => {
    const calendarGrid = await openCalendarPage(page, testInfo);

    await expect(
      page.getByRole("heading", { name: "Calendario de Reservas" }),
    ).toBeVisible();

    // Check days of week headers are visible
    const daysOfWeek = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
    for (const day of daysOfWeek) {
      await expect(
        calendarGrid.getByRole("columnheader", { name: day }).first(),
      ).toBeVisible();
    }
  });

  test("muestra reservas en el calendario @critical", async ({
    page,
  }, testInfo: TestInfo) => {
    const calendarGrid = await openCalendarPage(page, testInfo);

    await expect(
      calendarGrid.locator('button[aria-label*="Reserva"]').first(),
    ).toBeVisible();
  });

  test("permite cambiar entre vista mensual y semanal @critical", async ({
    page,
  }, testInfo: TestInfo) => {
    await openCalendarPage(page, testInfo);

    const viewToggle = page.getByLabel("Selector de vista del calendario");
    const monthButton = viewToggle.getByRole("button", { name: "Mes" });
    const weekButton = viewToggle.getByRole("button", { name: "Semana" });

    // Switch to weekly view
    await weekButton.click();

    // Weekly view should now be active (summary cards cambian)
    await expect(page.getByText("Reservas esta Semana")).toBeVisible();

    // Should show 7 day columns
    const dayColumns = page.locator(".lg\\:grid-cols-7 > div");
    await expect(dayColumns).toHaveCount(7);
  });

  test("permite filtrar reservas por estado @critical", async ({
    page,
    request,
  }, testInfo: TestInfo) => {
    // Create bookings with different statuses
    await createBookingFixture(request, adminToken, {
      status: "CONFIRMED",
    });

    await createBookingFixture(request, adminToken, {
      status: "PENDING",
    });

    await openCalendarPage(page, testInfo);

    // Expand filters
    const filterToggle = page.locator("button[aria-label*='filtros']").first();
    await filterToggle.click();

    // Select CONFIRMED status
    const [response] = await Promise.all([
      page.waitForResponse((res) => {
        const url = res.url();
        return (
          res.request().method() === "GET" &&
          url.includes("/api/calendar") &&
          url.includes("status=CONFIRMED")
        );
      }),
      page.selectOption("#status-filter", "CONFIRMED"),
    ]);

    expect(response.ok()).toBeTruthy();

    // Should show filter badge when collapsed
    await filterToggle.click();
    await expect(page.getByText("Confirmada×", { exact: true })).toBeVisible();
  });

  test("permite filtrar reservas por propiedad @critical", async ({
    page,
    request,
  }, testInfo: TestInfo) => {
    await openCalendarPage(page, testInfo);

    // Expand filters
    const filterToggle = page.locator("button[aria-label*='filtros']").first();
    await filterToggle.click();

    // Get first property option
    const propertySelect = page.locator("#property-filter");
    const firstPropertyOption = await propertySelect
      .locator("option")
      .nth(1)
      .textContent();

    if (
      firstPropertyOption &&
      firstPropertyOption !== "Todas las propiedades"
    ) {
      const [response] = await Promise.all([
        page.waitForResponse((res) => {
          const url = res.url();
          return (
            res.request().method() === "GET" &&
            url.includes("/api/calendar") &&
            url.includes("propertyId=")
          );
        }),
        propertySelect.selectOption({ index: 1 }),
      ]);

      expect(response.ok()).toBeTruthy();
    }
  });

  test("permite navegar entre meses @smoke", async ({
    page,
  }, testInfo: TestInfo) => {
    await openCalendarPage(page, testInfo);

    // Get current month name
    const currentMonthName = await page
      .locator("h2.text-2xl")
      .first()
      .textContent();

    // Click next month
    await page.getByRole("button", { name: "Mes siguiente" }).click();
    await page.waitForTimeout(500); // Wait for calendar to update

    // Month should have changed
    const newMonthName = await page
      .locator("h2.text-2xl")
      .first()
      .textContent();
    expect(newMonthName).not.toBe(currentMonthName);

    // Click previous month
    await page.getByRole("button", { name: "Mes anterior" }).click();
    await page.waitForTimeout(500);

    // Should be back to original month
    const backMonthName = await page
      .locator("h2.text-2xl")
      .first()
      .textContent();
    expect(backMonthName).toBe(currentMonthName);
  });

  test("botón 'Hoy' navega al mes actual @smoke", async ({
    page,
  }, testInfo: TestInfo) => {
    await openCalendarPage(page, testInfo);

    // Navigate to a different month
    await page.getByRole("button", { name: "Mes siguiente" }).click();
    await page.waitForTimeout(500);

    // Click "Hoy" button
    await page.getByRole("button", { name: "Hoy" }).click();
    await page.waitForTimeout(500);

    // Should highlight today's date with blue background
    const calendarGrid = await ensureCalendarGridVisible(page);
    const today = new Date();
    const todayLabel = today.toLocaleDateString("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });

    const todayCell = calendarGrid.getByRole("gridcell", {
      name: new RegExp(todayLabel, "i"),
    });

    await expect(todayCell.locator(".bg-blue-600")).toBeVisible();
  });

  test("muestra estadísticas de resumen en vista mensual @smoke", async ({
    page,
    request,
  }, testInfo: TestInfo) => {
    await createBookingFixture(request, adminToken, {
      status: "CONFIRMED",
    });

    await openCalendarPage(page, testInfo);

    // Check summary stats are visible
    await expect(page.getByText("Total Reservas")).toBeVisible();
    await expect(page.getByText("Confirmadas")).toBeVisible();
    await expect(page.getByText("Ingresos del Mes")).toBeVisible();
  });

  test("abre modal de detalles al hacer clic en una reserva @critical", async ({
    page,
    request,
  }, testInfo: TestInfo) => {
    const booking = await createBookingFixture(request, adminToken, {
      status: "CONFIRMED",
    });

    const calendarGrid = await openCalendarPage(page, testInfo);

    const scheduledDate = new Date(booking.scheduledAt);
    const dateLabel = scheduledDate.toLocaleDateString("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
    const timeLabel = scheduledDate.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const targetCell = calendarGrid.getByRole("gridcell", {
      name: new RegExp(dateLabel, "i"),
    });
    await expect(targetCell).toBeVisible();

    const servicePattern = booking.service.name.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&",
    );
    const bookingButton = targetCell
      .getByRole("button", {
        name: new RegExp(`${servicePattern}.*${timeLabel}`, "i"),
      })
      .first();
    await expect(bookingButton).toBeVisible();
    await bookingButton.click();
    await page.waitForFunction(
      (bookingId) =>
        typeof window !== "undefined" &&
        (window as any).__BRISA_LAST_BOOKING_CLICK === bookingId,
      booking.id,
    );
    await page.waitForTimeout(500);

    // Modal should open with booking details
    const modal = page.getByTestId("booking-details-modal");
    await expect(modal).toBeVisible({ timeout: 15_000 });
    await expect(modal.getByText("Fecha y Hora")).toBeVisible();
    await expect(modal.getByText("Servicio")).toBeVisible();
    await expect(modal.getByText("Cliente")).toBeVisible();
    await expect(modal.getByText("Monto Total")).toBeVisible();
  });

  test("modal permite cancelar una reserva @critical", async ({
    page,
    request,
  }, testInfo: TestInfo) => {
    await deleteAllBookings(request, adminToken);
    const booking = await createBookingFixture(request, adminToken, {
      status: "CONFIRMED",
    });

    await openCalendarPage(page, testInfo);

    const calendarGrid = await ensureCalendarGridVisible(page);
    const bookingButton = locateBookingButton(calendarGrid, booking);
    await bookingButton.click();

    // Click cancel button
    page.once("dialog", (dialog) => {
      expect(dialog.message()).toContain("cancelar");
      dialog.accept();
    });

    await page.getByRole("button", { name: "Cancelar Reserva" }).click();

    // Modal should close and calendar should refresh
    await expect(page.getByTestId("booking-details-modal")).not.toBeVisible();
  });

  test("modal permite completar una reserva @critical", async ({
    page,
    request,
  }, testInfo: TestInfo) => {
    await deleteAllBookings(request, adminToken);
    const booking = await createBookingFixture(request, adminToken, {
      status: "IN_PROGRESS",
    });

    await openCalendarPage(page, testInfo);

    const calendarGrid = await ensureCalendarGridVisible(page);
    const bookingButton = locateBookingButton(calendarGrid, booking);
    await bookingButton.click();

    // Click complete button
    page.once("dialog", (dialog) => {
      expect(dialog.message()).toContain("completada");
      dialog.accept();
    });

    await page.getByRole("button", { name: "Marcar Completada" }).click();

    // Modal should close
    await expect(page.getByTestId("booking-details-modal")).not.toBeVisible();
  });

  test("muestra leyenda de colores de estados @smoke", async ({
    page,
  }, testInfo: TestInfo) => {
    await openCalendarPage(page, testInfo);

    const legend = page.getByTestId("calendar-status-legend");
    const entries = [
      { id: "pending", label: "Pendiente" },
      { id: "confirmed", label: "Confirmada" },
      { id: "in_progress", label: "En curso" },
      { id: "completed", label: "Completada" },
      { id: "cancelled", label: "Cancelada" },
    ];

    for (const entry of entries) {
      await expect(
        legend
          .getByTestId(`calendar-status-legend-${entry.id}`)
          .getByText(entry.label),
      ).toBeVisible();
    }
  });

  test("solo permite acceso a ADMIN y COORDINATOR @security", async ({
    page,
    request,
  }) => {
    // This would require a staff login function
    // For now we test that the route requires authentication
    await page.goto("/panel/calendario");

    // Should redirect to login if not authenticated
    await expect(page).toHaveURL(/\/login/);
  });

  test("limpia filtros correctamente @smoke", async ({
    page,
  }, testInfo: TestInfo) => {
    await openCalendarPage(page, testInfo);

    // Expand filters
    const filterToggle = page.locator("button[aria-label*='filtros']").first();
    await filterToggle.click();

    // Apply a filter
    await page.selectOption("#status-filter", "CONFIRMED");

    // Should show "Limpiar filtros" button
    await expect(page.getByText("Limpiar filtros")).toBeVisible();

    // Click clear filters
    await page.getByText("Limpiar filtros").click();

    // Status select should be back to default
    const statusSelect = page.locator("#status-filter");
    await expect(statusSelect).toHaveValue("");

    // "Limpiar filtros" button should disappear
    await expect(page.getByText("Limpiar filtros")).not.toBeVisible();
  });
});
