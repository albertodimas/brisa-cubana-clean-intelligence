import { expect, test } from "@playwright/test";
import { establishSession } from "./fixtures/session";

test.describe("financial alerts widget", () => {
  test("renders alerts card for finance roles when reconciliation alerts exist", async ({
    page,
    request,
  }) => {
    await establishSession(page, request, {
      email: "admin@brisacubanaclean.com",
      password: "Admin123!",
    });
    await page.goto("/dashboard");

    const alertHeading = page.getByText(/alertas de conciliación/i);
    await expect(alertHeading).toBeVisible();
    await expect(page.getByText(/pagos marcados como\s+FAILED/i)).toBeVisible();
  });

  test("remains hidden for client accounts", async ({ page, request }) => {
    await establishSession(page, request, {
      email: "client@brisacubanaclean.com",
      password: "Client123!",
    });
    await page.goto("/dashboard");

    const alertHeading = page.getByText(/alertas de conciliación/i);
    await expect(alertHeading).toHaveCount(0);
  });
});
