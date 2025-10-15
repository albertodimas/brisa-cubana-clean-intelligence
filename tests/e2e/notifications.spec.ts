import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./support/auth";
import {
  createNotificationFixture,
  markAllNotificationsReadFixture,
} from "./support/notifications";

test.describe.serial("Notificaciones", () => {
  test("permite gestionar notificaciones desde el panel @critical", async ({
    page,
    request,
  }, testInfo) => {
    await markAllNotificationsReadFixture(request);
    await loginAsAdmin(page, testInfo);

    const bell = page.getByTestId("notification-bell");
    await expect(bell).toBeVisible();
    await expect(
      page.locator('[data-testid="notification-badge"]'),
    ).toHaveCount(0);

    await test.step("ping nuevo -> badge actualizado", async () => {
      await createNotificationFixture(request, {
        message: `Notificación E2E ${Date.now()}`,
      });
      await expect(page.getByTestId("notification-badge")).toHaveText("1", {
        timeout: 10_000,
      });
      await bell.click();
      const panel = page.getByTestId("notification-panel");
      await expect(panel).toBeVisible();
      await expect(panel.getByTestId("notification-item")).toHaveCount(1);
    });

    await test.step("marcar como leído", async () => {
      const firstNotification = page
        .getByTestId("notification-mark-read")
        .first();
      await firstNotification.click();
      await expect(
        page.locator('[data-testid="notification-badge"]'),
      ).toHaveCount(0);
      const unreadToggle = page.getByRole("button", { name: "Sólo sin leer" });
      await unreadToggle.click();
      await expect(
        page.getByTestId("notification-panel").getByTestId("notification-item"),
      ).toHaveCount(0);
      await expect(
        page
          .getByTestId("notification-panel")
          .getByText("¡Todo al día! No hay notificaciones pendientes."),
      ).toBeVisible();
      await page.getByRole("button", { name: "Ver todas" }).click();
    });

    await test.step("limpiar todas", async () => {
      await page.getByTestId("notification-close").click();
      await createNotificationFixture(request, {
        message: `Notificación masiva ${Date.now()}-1`,
      });
      await createNotificationFixture(request, {
        message: `Notificación masiva ${Date.now()}-2`,
      });
      await bell.click();
      const panel = page.getByTestId("notification-panel");
      await expect(panel).toBeVisible();
      await expect(page.getByTestId("notification-badge")).toHaveText("2");
      const markAllButton = page.getByRole("button", { name: "Marcar todas" });
      await expect(markAllButton).toBeEnabled();
      await markAllButton.click();
      await expect(
        page.locator('[data-testid="notification-badge"]'),
      ).toHaveCount(0);
      await page.getByRole("button", { name: "Sólo sin leer" }).click();
      await expect(
        panel.getByText("¡Todo al día! No hay notificaciones pendientes."),
      ).toBeVisible();
    });
  });
});
