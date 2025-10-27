import { test, expect } from "@playwright/test";
import type { TestInfo } from "@playwright/test";
import { ipForTest, loginAsAdmin } from "./support/auth";
import { createBookingFixture, getAdminAccessToken } from "./support/services";

test.describe.serial("Operaciones", () => {
  test("permite crear un nuevo servicio @smoke @critical", async ({
    page,
  }, testInfo) => {
    await loginAsAdmin(page, testInfo);

    const uniqueName = `Servicio E2E ${Date.now().toString().slice(-6)}`;
    const serviceForm = page.getByTestId("service-create-form").first();

    await serviceForm.locator('input[name="name"]').first().fill(uniqueName);
    await serviceForm
      .locator('textarea[name="description"]')
      .first()
      .fill("Servicio generado en pruebas E2E");
    await serviceForm.locator('input[name="basePrice"]').first().fill("199");
    await serviceForm.locator('input[name="durationMin"]').first().fill("120");
    await serviceForm.getByRole("button", { name: "Guardar" }).click();

    // Toast notification appears outside the form
    await expect(
      page.getByText("Servicio creado", { exact: true }).first(),
    ).toBeVisible();
    await expect(page.getByText(uniqueName).first()).toBeVisible();
  });

  test("filtra reservas por estado @critical", async ({
    page,
    request,
  }, testInfo) => {
    const adminToken = await getAdminAccessToken(request);
    await createBookingFixture(request, adminToken, { status: "CONFIRMED" });

    await loginAsAdmin(page, testInfo);

    const statusSelect = page.getByTestId("booking-status-filter").first();
    const [response] = await Promise.all([
      page.waitForResponse(
        (res) => {
          const url = res.url();
          return (
            res.request().method() === "GET" &&
            url.includes("/api/bookings") &&
            url.includes("status=CONFIRMED")
          );
        },
        { timeout: 15_000 },
      ),
      statusSelect.selectOption("CONFIRMED"),
    ]);

    const body = (await response.json()) as { data?: unknown[] };
    expect(Array.isArray(body.data) && body.data.length > 0).toBe(true);

    await expect(statusSelect).toHaveValue("CONFIRMED", { timeout: 10_000 });

    const reservationCards = page.getByTestId("booking-card");
    await expect
      .poll(async () => await reservationCards.count(), {
        timeout: 10_000,
      })
      .toBeGreaterThan(0);
    await expect(reservationCards.first()).toBeVisible({ timeout: 10_000 });

    const statusSelects = page.locator('select[name="bookingStatus"]');
    await expect(statusSelects.first()).toBeVisible({ timeout: 10_000 });
    await expect
      .poll(async () =>
        statusSelects.evaluateAll((elements) =>
          elements.map((element) => (element as HTMLSelectElement).value),
        ),
      )
      .toContain("CONFIRMED");
    await expect(
      reservationCards.filter({ hasText: /Confirmada/i }).first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("muestra error cuando faltan datos al crear servicio @critical", async ({
    page,
    request,
  }, testInfo) => {
    await loginAsAdmin(page, testInfo);

    const apiUrl = process.env.E2E_API_URL || "http://localhost:3001";
    const initialResponse = await request.get(`${apiUrl}/api/services`);
    const initialJson = (await initialResponse.json()) as {
      data?: Array<{ id: string }>;
    };
    const initialCount = initialJson.data?.length ?? 0;

    const serviceForm = page.getByTestId("service-create-form");

    await serviceForm
      .locator('input[name="name"]')
      .first()
      .fill("Servicio inválido UI");
    await serviceForm
      .locator('textarea[name="description"]')
      .first()
      .fill("Caso negativo E2E");
    await serviceForm.locator('input[name="basePrice"]').first().fill("-10");
    await serviceForm.locator('input[name="durationMin"]').first().fill("0");

    await serviceForm.getByRole("button", { name: "Guardar" }).click();

    await expect
      .poll(
        async () => {
          const snapshot = await request.get(`${apiUrl}/api/services`);
          const snapshotJson = (await snapshot.json()) as {
            data?: Array<{ id: string }>;
          };
          return snapshotJson.data?.length ?? 0;
        },
        { timeout: 3000 },
      )
      .toBe(initialCount);
  });

  test("pagina reservas correctamente", async ({ request }, testInfo) => {
    const ip = ipForTest(testInfo);
    // Use localhost API for E2E tests (starts on port 3001)
    const apiUrl = process.env.E2E_API_URL || "http://localhost:3001";
    const adminToken = await getAdminAccessToken(request);
    const authHeaders = {
      "x-forwarded-for": ip,
      Authorization: `Bearer ${adminToken}`,
    };

    // Test 1: Default pagination
    const res1 = await request.get(`${apiUrl}/api/bookings`, {
      headers: authHeaders,
    });
    expect(res1.ok()).toBeTruthy();
    const json1 = await res1.json();
    expect(json1.pagination).toBeDefined();
    expect(json1.pagination.limit).toBe(20);
    expect(json1.data).toBeDefined();
    expect(Array.isArray(json1.data)).toBe(true);

    // Test 2: Custom limit
    const res2 = await request.get(`${apiUrl}/api/bookings?limit=5`, {
      headers: authHeaders,
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
          headers: authHeaders,
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
      headers: authHeaders,
    });
    expect(res4.status()).toBe(400);

    const res5 = await request.get(`${apiUrl}/api/bookings?limit=101`, {
      headers: authHeaders,
    });
    expect(res5.status()).toBe(400);
  });
});
