import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./support/auth";
import {
  createBookingFixture,
  createServiceFixture,
  getAdminAccessToken,
} from "./support/services";

test.describe.serial("Búsquedas y filtros", () => {
  let adminToken: string;

  test.beforeAll(async ({ request }) => {
    adminToken = await getAdminAccessToken(request);
  });

  test("encuentra un servicio por nombre usando la barra de búsqueda @critical", async ({
    page,
    request,
  }, testInfo) => {
    const uniqueServiceName = `Servicio Buscado ${Date.now()}`;
    await createServiceFixture(request, adminToken, {
      name: uniqueServiceName,
      description: "Servicio creado para validar la búsqueda UI",
    });

    await loginAsAdmin(page, testInfo);

    const searchInput = page.getByPlaceholder("Buscar servicios...");
    const responsePromise = page.waitForResponse((response) => {
      const url = response.url();
      return (
        response.request().method() === "GET" &&
        url.includes("/api/services") &&
        url.includes("search=")
      );
    });
    await searchInput.fill(uniqueServiceName);
    const response = await responsePromise;
    const data = (await response.json()) as {
      data?: Array<{ name: string }>;
    };
    expect(
      data.data?.some((service) => service.name === uniqueServiceName),
    ).toBeTruthy();

    const servicesSection = page
      .locator("section")
      .filter({
        has: page.getByRole("heading", { name: "Gestionar servicios" }),
      })
      .first();
    await expect(servicesSection).toBeVisible();

    const serviceHeading = servicesSection
      .locator("form strong")
      .filter({ hasText: uniqueServiceName })
      .first();
    await expect(serviceHeading).toBeVisible();
  });

  test("filtra usuarios por rol coordinador desde el panel de administración @critical", async ({
    page,
  }, testInfo) => {
    await loginAsAdmin(page, testInfo);

    const roleSelect = page.getByLabel("Filtrar por rol");
    const responsePromise = page.waitForResponse((response) => {
      const url = response.url();
      return (
        response.request().method() === "GET" &&
        url.includes("/api/users") &&
        url.includes("role=COORDINATOR")
      );
    });
    await roleSelect.selectOption("COORDINATOR");
    await responsePromise;

    const rows = page.locator("table tbody tr");
    const totalRows = await rows.count();
    expect(totalRows).toBeGreaterThan(0);
    const coordinatorRows = await rows
      .filter({ hasText: "COORDINATOR" })
      .count();
    expect(coordinatorRows).toBe(totalRows);
    await expect(
      rows.first().getByText("ops@brisacubanaclean.com"),
    ).toBeVisible();
    await expect(page.getByText("Rol: COORDINATOR")).toBeVisible();
  });

  test("combina búsqueda y estado en reservas mostrando los filtros activos @critical", async ({
    page,
    request,
  }, testInfo) => {
    const booking = await createBookingFixture(request, adminToken, {
      status: "CONFIRMED",
    });

    await loginAsAdmin(page, testInfo);

    const bookingSearch = page.getByPlaceholder(
      "Buscar por código, cliente o propiedad...",
    );
    const statusSelect = page.getByTestId("booking-status-filter");

    const responsePromiseSearch = page.waitForResponse((response) => {
      const url = response.url();
      return (
        response.request().method() === "GET" &&
        url.includes("/api/bookings") &&
        url.includes(`search=${booking.code}`)
      );
    });
    await bookingSearch.fill(booking.code);
    const searchResponse = await responsePromiseSearch;
    const searchJson = (await searchResponse.json()) as {
      data?: Array<{ code: string; status: string }>;
    };
    const initialCode =
      searchJson.data?.find((result) => result.code === booking.code)?.code ??
      null;

    const responsePromiseStatus = page.waitForResponse((response) => {
      const url = response.url();
      return (
        response.request().method() === "GET" &&
        url.includes("/api/bookings") &&
        url.includes("status=CONFIRMED")
      );
    });
    await statusSelect.selectOption("CONFIRMED");
    const statusResponse = await responsePromiseStatus;
    const statusJson = (await statusResponse.json()) as {
      data?: Array<{ code: string; status: string }>;
    };
    const filteredCode = statusJson.data?.[0]?.code ?? initialCode;

    await expect(
      page.getByText(`Búsqueda: ${booking.code}`, { exact: true }),
    ).toBeVisible();
    await expect(page.getByText("Estado: CONFIRMED")).toBeVisible();
    const bookingCards = page.getByTestId("booking-card");
    await expect(bookingCards.first()).toBeVisible();
    if (filteredCode) {
      await expect(bookingCards.first()).toContainText(filteredCode);
    } else {
      await expect(bookingCards.first()).toContainText(booking.code);
    }
  });

  test("muestra mensaje amigable cuando no hay coincidencias en servicios @critical", async ({
    page,
  }, testInfo) => {
    await loginAsAdmin(page, testInfo);

    const searchInput = page.getByPlaceholder("Buscar servicios...");
    const responsePromise = page.waitForResponse((response) => {
      const url = response.url();
      return (
        response.request().method() === "GET" &&
        url.includes("/api/services") &&
        url.includes("search=sin-resultados")
      );
    });
    await searchInput.fill("sin-resultados");
    await responsePromise;

    await expect(
      page.getByText(
        "No se encontraron servicios para los filtros seleccionados.",
      ),
    ).toBeVisible();
  });

  test("restaura la lista de usuarios al limpiar todos los filtros activos", async ({
    page,
  }, testInfo) => {
    await loginAsAdmin(page, testInfo);

    const searchInput = page.getByPlaceholder("Buscar usuarios...");
    const roleSelect = page.getByLabel("Filtrar por rol");
    const statusSelect = page.getByLabel("Filtrar por estado");

    const searchResponse = page.waitForResponse((response) => {
      const url = response.url();
      return (
        response.request().method() === "GET" &&
        url.includes("/api/users") &&
        url.includes("search=ops")
      );
    });
    await searchInput.fill("ops");
    await searchResponse;

    const roleResponse = page.waitForResponse((response) => {
      const url = response.url();
      return (
        response.request().method() === "GET" &&
        url.includes("/api/users") &&
        url.includes("role=COORDINATOR")
      );
    });
    await roleSelect.selectOption("COORDINATOR");
    await roleResponse;

    const statusResponse = page.waitForResponse((response) => {
      const url = response.url();
      return (
        response.request().method() === "GET" &&
        url.includes("/api/users") &&
        url.includes("isActive=true")
      );
    });
    await statusSelect.selectOption("ACTIVE");
    await statusResponse;

    const usersSection = page.locator("section").filter({
      has: page.getByRole("heading", { name: "Gestión de usuarios" }),
    });

    await expect(
      usersSection.getByText("Búsqueda: ops", { exact: true }),
    ).toBeVisible();
    await expect(
      usersSection.getByText("Rol: COORDINATOR", { exact: true }),
    ).toBeVisible();
    await expect(
      usersSection.getByText("Estado: Activo", { exact: true }),
    ).toBeVisible();

    const clearButton = usersSection.getByRole("button", {
      name: "Limpiar todos",
    });
    const resetResponse = page.waitForResponse((response) => {
      const url = response.url();
      return (
        response.request().method() === "GET" &&
        url.includes("/api/users") &&
        !url.includes("search=") &&
        !url.includes("role=") &&
        !url.includes("isActive=")
      );
    });
    await clearButton.click();
    await resetResponse;

    const tableRows = usersSection.locator("table tbody tr");
    await expect(tableRows.first()).toBeVisible();
    await expect(
      usersSection.getByText("Búsqueda:", { exact: false }),
    ).toHaveCount(0);
  });
});
