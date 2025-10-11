import { test, expect, Page } from "@playwright/test";
import type { TestInfo } from "@playwright/test";

const adminEmail = process.env.E2E_ADMIN_EMAIL ?? "admin@brisacubanaclean.com";
const adminPassword = process.env.E2E_ADMIN_PASSWORD ?? "Brisa123!";

function ipForTest(testInfo: TestInfo): string {
  let hash = 0;
  for (const char of testInfo.title) {
    hash = (hash * 31 + char.charCodeAt(0)) % 200;
  }
  const octet = 10 + (hash % 200);
  return `198.51.100.${octet}`;
}

async function login(page: Page, testInfo: TestInfo) {
  const ip = ipForTest(testInfo);
  await page.context().setExtraHTTPHeaders({ "x-forwarded-for": ip });
  await page.goto("/login");
  await page.getByLabel("Correo").fill(adminEmail);
  await page.getByLabel("Contraseña").fill(adminPassword);
  await page.getByRole("button", { name: "Ingresar" }).click();
  await page.waitForURL("/**");
  await expect(
    page.getByRole("heading", { name: "Panel operativo" }),
  ).toBeVisible();
}

test.describe("Operaciones", () => {
  test("permite crear un nuevo servicio @smoke @critical", async ({
    page,
  }, testInfo) => {
    await login(page, testInfo);

    const uniqueName = `Servicio E2E ${Date.now().toString().slice(-6)}`;
    const serviceForm = page.getByTestId("service-create-form");

    await serviceForm.locator('input[name="name"]').fill(uniqueName);
    await serviceForm
      .locator('textarea[name="description"]')
      .fill("Servicio generado en pruebas E2E");
    await serviceForm.locator('input[name="basePrice"]').fill("199");
    await serviceForm.locator('input[name="durationMin"]').fill("120");
    await serviceForm.getByRole("button", { name: "Guardar" }).click();

    // Toast notification appears outside the form
    await expect(page.getByText("Servicio creado")).toBeVisible();
    await expect(page.getByText(uniqueName).first()).toBeVisible();
  });

  test("filtra reservas por estado @critical", async ({ page }, testInfo) => {
    await login(page, testInfo);

    const statusSelect = page.getByTestId("booking-status-filter");
    await statusSelect.selectOption("CONFIRMED");

    const reservationCards = page.getByTestId("booking-card");

    await expect(reservationCards.first()).toBeVisible();
    await expect(
      reservationCards.first().locator('select[name="bookingStatus"]'),
    ).toHaveValue("CONFIRMED");
  });

  test("pagina reservas correctamente", async ({ request }, testInfo) => {
    const ip = ipForTest(testInfo);
    // Use localhost API for E2E tests (starts on port 3001)
    const apiUrl = process.env.E2E_API_URL || "http://localhost:3001";

    // Test 1: Default pagination
    const res1 = await request.get(`${apiUrl}/api/bookings`, {
      headers: { "x-forwarded-for": ip },
    });
    expect(res1.ok()).toBeTruthy();
    const json1 = await res1.json();
    expect(json1.pagination).toBeDefined();
    expect(json1.pagination.limit).toBe(20);
    expect(json1.data).toBeDefined();
    expect(Array.isArray(json1.data)).toBe(true);

    // Test 2: Custom limit
    const res2 = await request.get(`${apiUrl}/api/bookings?limit=5`, {
      headers: { "x-forwarded-for": ip },
    });
    expect(res2.ok()).toBeTruthy();
    const json2 = await res2.json();
    expect(json2.pagination.limit).toBe(5);
    expect(json2.data.length).toBeLessThanOrEqual(5);

    // Test 3: Pagination with cursor (if there are more results)
    if (json2.pagination.hasMore && json2.pagination.nextCursor) {
      const res3 = await request.get(
        `${apiUrl}/api/bookings?limit=5&cursor=${json2.pagination.nextCursor}`,
        {
          headers: { "x-forwarded-for": ip },
        },
      );
      expect(res3.ok()).toBeTruthy();
      const json3 = await res3.json();
      expect(json3.pagination.cursor).toBe(json2.pagination.nextCursor);
      expect(json3.data.length).toBeGreaterThan(0);
      // Verify we got different results
      const firstPageIds = json2.data.map((b: any) => b.id);
      const secondPageIds = json3.data.map((b: any) => b.id);
      const overlap = firstPageIds.filter((id: string) =>
        secondPageIds.includes(id),
      );
      expect(overlap.length).toBe(0);
    }

    // Test 4: Validate limit boundaries
    const res4 = await request.get(`${apiUrl}/api/bookings?limit=0`, {
      headers: { "x-forwarded-for": ip },
    });
    expect(res4.status()).toBe(400);

    const res5 = await request.get(`${apiUrl}/api/bookings?limit=101`, {
      headers: { "x-forwarded-for": ip },
    });
    expect(res5.status()).toBe(400);
  });
});
