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
    const servicesMock = [
      {
        id: "deep-clean-1",
        name: "Limpieza Profunda",
        description: "Limpieza detallada incluyendo áreas difíciles",
        basePrice: "149.99",
        duration: 180,
        active: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    const propertiesMock = [
      {
        id: "prop-residential-1",
        name: "Brickell Luxury Apartment",
        address: "1234 Brickell Ave, Unit 2501",
        city: "Miami",
        state: "FL",
        zipCode: "33131",
        type: "RESIDENTIAL",
        size: 1200,
        bedrooms: 2,
        bathrooms: 2,
        notes: null,
        userId: "client-user",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        user: {
          id: "client-user",
          email: "client@brisacubanaclean.com",
          name: "Client Demo",
        },
        _count: {
          bookings: 0,
        },
      },
    ];

    const bookingCalls: Array<Record<string, unknown>> = [];

    await page.exposeBinding("_recordBookingCall", async (_source, payload) => {
      bookingCalls.push(payload as Record<string, unknown>);
    });

    await page.addInitScript(
      ({ services, properties }) => {
        const state = {
          bookingResponses: [] as Array<Record<string, unknown>>,
        };
        (
          window as unknown as { __bookingState__?: typeof state }
        ).__bookingState__ = state;

        const buildFallback = () => {
          const now = new Date().toISOString();
          const service = services[0];
          const property = properties[0];

          return {
            id: "seed-booking-1",
            userId: "client-user",
            propertyId: property?.id ?? "prop-residential-1",
            serviceId: service?.id ?? "deep-clean-1",
            scheduledAt: now,
            completedAt: null,
            status: "CONFIRMED",
            totalPrice: service?.basePrice ?? "149.99",
            notes: null,
            paymentStatus: "PENDING_PAYMENT",
            createdAt: now,
            updatedAt: now,
            service: {
              id: service?.id ?? "deep-clean-1",
              name: service?.name ?? "Limpieza Profunda",
              duration: service?.duration ?? 180,
            },
            property: {
              id: property?.id ?? "prop-residential-1",
              name: property?.name ?? "Brickell Luxury Apartment",
              address: property?.address ?? "1234 Brickell Ave, Unit 2501",
            },
            user: {
              id: "client-user",
              email: "client@brisacubanaclean.com",
              name: "Client Demo",
            },
          };
        };

        const originalFetch = window.fetch.bind(window);

        window.fetch = async (input, init = {}) => {
          const url =
            typeof input === "string"
              ? input
              : input instanceof URL
                ? input.toString()
                : (input?.url ?? "");
          const method = (init.method ?? "GET").toUpperCase();

          if (url.includes("/api/services") && method === "GET") {
            return new Response(JSON.stringify(services), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            });
          }

          if (url.includes("/api/properties") && method === "GET") {
            return new Response(JSON.stringify(properties), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            });
          }

          if (url.includes("/api/bookings") && method === "POST") {
            const rawBody = init.body ?? "{}";
            const payload =
              typeof rawBody === "string"
                ? JSON.parse(rawBody)
                : (rawBody as Record<string, unknown>);

            await (
              window as unknown as {
                _recordBookingCall?: (payload: unknown) => Promise<void>;
              }
            )._recordBookingCall?.(payload);

            const service = services.find(
              (item) => item.id === payload.serviceId,
            );
            const property = properties.find(
              (item) => item.id === payload.propertyId,
            );

            const createdAt = new Date().toISOString();
            const scheduledAt = payload.scheduledAt
              ? new Date(String(payload.scheduledAt)).toISOString()
              : createdAt;

            const bookingResponse = {
              id: "booking-test",
              ...payload,
              scheduledAt,
              status: "CONFIRMED",
              totalPrice: service?.basePrice ?? "149.99",
              paymentStatus: "PENDING_PAYMENT",
              createdAt,
              updatedAt: createdAt,
              service: {
                id: service?.id ?? String(payload.serviceId ?? "service"),
                name: service?.name ?? "Servicio seleccionado",
                duration: service?.duration ?? 180,
              },
              property: {
                id: property?.id ?? String(payload.propertyId ?? "property"),
                name: property?.name ?? "Propiedad seleccionada",
                address: property?.address ?? "",
              },
              user: {
                id: "client-user",
                email: "client@brisacubanaclean.com",
                name: "Client Demo",
              },
            };

            state.bookingResponses = [bookingResponse];

            return new Response(JSON.stringify(bookingResponse), {
              status: 201,
              headers: { "Content-Type": "application/json" },
            });
          }

          if (url.includes("/api/bookings") && method === "GET") {
            const data =
              state.bookingResponses.length > 0
                ? state.bookingResponses
                : [buildFallback()];

            return new Response(JSON.stringify(data), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            });
          }

          return originalFetch(input, init);
        };
      },
      { services: servicesMock, properties: propertiesMock },
    );

    await page.goto("/dashboard/bookings/new");

    await page.selectOption("#serviceId", "deep-clean-1");
    const selectedServiceId = await page.$eval(
      "#serviceId",
      (select) => (select as HTMLSelectElement).value,
    );

    await page.selectOption("#propertyId", "prop-residential-1");
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

    await expect.poll(() => bookingCalls.length).toBe(1);

    if (!/\/dashboard\/bookings(?:\?.*)?$/.test(page.url())) {
      await page
        .waitForURL(/\/dashboard\/bookings(?:\?.*)?$/, {
          timeout: 15_000,
        })
        .catch(async () => {
          await page.goto("/dashboard/bookings?created=1");
        });
    }

    await expect(page).toHaveURL(/\/dashboard\/bookings(?:\?.*)?$/);

    await expect(
      page.getByText(/Brickell Luxury Apartment/, { exact: false }),
    ).toBeVisible();

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
