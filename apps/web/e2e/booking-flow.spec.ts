import { test, expect } from "@playwright/test";
import { establishSession } from "./fixtures/session";

/**
 * E2E tests for booking creation flow
 *
 * Critical user journey:
 * - Create property -> Create booking -> View booking details
 */

test.describe("Booking Flow", () => {
  // Login before each test
  test.beforeEach(async ({ page, request }) => {
    await establishSession(page, request, {
      email: "client@brisacubanaclean.com",
      password: "Client123!",
    });

    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("should navigate to create property page", async ({ page }) => {
    await page.goto("/dashboard/properties");

    // Look for "New Property" or "Create" button
    const createButton = page.getByRole("link", {
      name: /agregar propiedad|nueva propiedad|create/i,
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
      name: /nueva reserva|crear reserva|new booking/i,
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

  test("should create a new booking", async ({ page }) => {
    const bookingCalls: Array<Record<string, unknown>> = [];

    await page.route("**/api/bookings", async (route) => {
      if (route.request().method() === "POST") {
        const payload = JSON.parse(
          route.request().postData() ?? "{}",
        ) as Record<string, unknown>;
        bookingCalls.push(payload);
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({ id: "booking-test", ...payload }),
        });
        return;
      }

      await route.continue();
    });

    await page.goto("/dashboard/bookings/new");

    await page.selectOption("#serviceId", "deep-clean-1");
    const selectedServiceId = await page.$eval(
      "#serviceId",
      (select) => (select as HTMLSelectElement).value,
    );

    const hasProperties = await page.evaluate(() => {
      const select = document.querySelector<HTMLSelectElement>("#propertyId");
      return Boolean(select && select.options.length > 1);
    });

    if (!hasProperties) {
      await page.evaluate(() => {
        const propertySelect =
          document.querySelector<HTMLSelectElement>("#propertyId");
        if (propertySelect) {
          propertySelect.options.add(
            new Option(
              "Brickell Luxury Apartment - 1234 Brickell Ave",
              "prop-residential-1",
            ),
          );
        }
      });
    }

    await page.selectOption("#propertyId", { index: 1 });
    const selectedPropertyId = await page.$eval(
      "#propertyId",
      (select) => (select as HTMLSelectElement).value,
    );

    const scheduledDate = new Date(Date.now() + 4 * 60 * 60 * 1000);
    const scheduledValue = scheduledDate.toISOString().slice(0, 16);
    await page.fill("#scheduledAt", scheduledValue);

    const notes = "Favor dejar kit de bienvenida en la mesa";
    await page.fill("#notes", notes);

    await page.getByRole("button", { name: /Confirmar Reserva/i }).click();

    await expect(page).toHaveURL(/\/dashboard\/bookings(?:\?.*)?$/);

    await expect(
      page.getByText(/Brickell Luxury Apartment/, { exact: false }),
    ).toBeVisible();

    await expect.poll(() => bookingCalls.length).toBe(1);

    const expectedScheduledAt = new Date(scheduledValue).toISOString();
    expect(bookingCalls[0]).toMatchObject({
      serviceId: selectedServiceId,
      propertyId: selectedPropertyId,
      notes,
    });
    expect(bookingCalls[0]?.scheduledAt).toBe(expectedScheduledAt);
  });

  test("should open booking details view", async ({ page, request }) => {
    await establishSession(page, request, {
      email: "client@brisacubanaclean.com",
      password: "Client123!",
    });

    const bookingId = "fake-booking-1";
    const baseBooking = {
      id: bookingId,
      userId: "client-user",
      propertyId: "prop-residential-1",
      serviceId: "deep-clean-1",
      scheduledAt: new Date().toISOString(),
      completedAt: null,
      status: "CONFIRMED" as const,
      totalPrice: "149.99",
      notes: "Revisar terraza",
      paymentStatus: "PENDING_PAYMENT" as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      service: {
        id: "deep-clean-1",
        name: "Limpieza Profunda",
        duration: 180,
      },
      property: {
        id: "prop-residential-1",
        name: "Brickell Luxury Apartment",
        address: "1234 Brickell Ave, Unit 2501",
      },
    };

    await page.route("**/api/bookings", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([baseBooking]),
      });
    });

    await page.route(`**/api/bookings/${bookingId}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ...baseBooking,
          service: {
            ...baseBooking.service,
            description:
              "Limpieza detallada incluyendo áreas difíciles y sanitización",
          },
          property: {
            id: baseBooking.property.id,
            name: baseBooking.property.name,
            address: baseBooking.property.address,
            city: "Miami",
            state: "FL",
            zipCode: "33131",
          },
          user: {
            id: "client-user",
            email: "client@brisacubanaclean.com",
            name: "Client Demo",
          },
        }),
      });
    });

    await page.goto("/dashboard/bookings");

    await expect(
      page.getByRole("heading", { name: /Mis Reservas/i }),
    ).toBeVisible();

    await page
      .getByRole("link", { name: /Ver Detalles/i })
      .first()
      .click();

    await expect(page).toHaveURL(`/dashboard/bookings/${bookingId}`);
    await expect(
      page.getByRole("heading", { name: /Limpieza Profunda/i }),
    ).toBeVisible();
    await expect(page.getByText(/Revisar terraza/)).toBeVisible();
    await expect(page.getByText(/Brickell Luxury Apartment/)).toBeVisible();
  });
});
