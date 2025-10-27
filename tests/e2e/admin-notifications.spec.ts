import { expect, test } from "@playwright/test";

const ADMIN_EMAIL = "admin@brisacubanacleanintelligence.com";
const ADMIN_PASSWORD = "Brisa123!";

async function loginAsAdmin(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByLabel("Correo").fill(ADMIN_EMAIL);
  await page.getByLabel("Contraseña").fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Ingresar" }).click();
  await page.waitForURL(/\/panel$/);
  await expect(page.getByTestId("panel-root")).toBeVisible({
    timeout: 10_000,
  });
}

test.describe("@critical notifications – SSE en panel operativo", () => {
  test("@critical mantiene conexión SSE sin fallback", async ({ page }) => {
    await loginAsAdmin(page);

    const notificationCenter = page.getByTestId("notification-center");
    await expect(notificationCenter).toBeVisible();

    await expect
      .poll(async () => notificationCenter.getAttribute("data-stream-state"), {
        timeout: 10_000,
        message: "Se esperaba conexión SSE estable",
      })
      .toBe("connected");

    await expect(notificationCenter).not.toHaveAttribute(
      "data-stream-state",
      "polling",
    );
  });

  test("@full inicia fallback a polling tras fallas consecutivas", async ({
    page,
  }) => {
    await page.route("**/api/notifications/stream", (route) => {
      void route.abort();
    });

    await loginAsAdmin(page);

    const notificationCenter = page.getByTestId("notification-center");
    await expect(notificationCenter).toBeVisible();

    await expect
      .poll(async () => notificationCenter.getAttribute("data-stream-state"), {
        timeout: 15_000,
        message:
          "Se esperaba transición a modo polling tras reintentos fallidos",
      })
      .toBe("polling");
  });
});
