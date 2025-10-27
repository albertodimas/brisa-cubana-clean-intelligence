import { test, expect } from "@playwright/test";
import { loginWithCredentials } from "./support/auth";
import {
  createNotificationFixture,
  markAllNotificationsReadFixture,
} from "./support/notifications";
import {
  createUserFixture,
  deleteUserFixture,
  getUserAccessToken,
} from "./support/services";

const apiBaseUrl = process.env.E2E_API_URL || "http://localhost:3001";

test.describe.serial("Notificaciones", () => {
  test("permite gestionar notificaciones desde el panel @critical", async ({
    page,
    request,
  }, testInfo) => {
    const qaUser = await createUserFixture(request, {
      fullName: `QA Notificaciones ${Date.now()}`,
      role: "ADMIN",
    });

    try {
      const userAccessToken = await getUserAccessToken(
        request,
        qaUser.email,
        qaUser.password,
      );
      await markAllNotificationsReadFixture(request, {
        email: qaUser.email,
        password: qaUser.password,
      });

      await loginWithCredentials(page, testInfo, {
        email: qaUser.email,
        password: qaUser.password,
        retries: 6,
      });

      const bell = page.getByTestId("notification-bell");
      await expect(bell).toBeVisible({ timeout: 10_000 });

      const fastMessage = `Notificación E2E ${Date.now()}`;

      await test.step("ping nuevo -> badge actualizado", async () => {
        await createNotificationFixture(request, {
          userEmail: qaUser.email,
          message: fastMessage,
        });
        await bell.click();
        const panel = page.getByTestId("notification-panel");
        await expect(panel).toBeVisible({ timeout: 10_000 });
        await expect
          .poll(async () => {
            const response = await request.get(
              `${apiBaseUrl}/api/notifications?limit=5&unreadOnly=true`,
              {
                headers: {
                  Authorization: `Bearer ${userAccessToken}`,
                },
              },
            );
            const json = (await response.json()) as {
              data?: Array<{ message: string }>;
            };
            return json.data?.map((item) => item.message) ?? [];
          })
          .toContain(fastMessage);
        await expect(
          panel
            .getByTestId("notification-item")
            .filter({ hasText: fastMessage }),
        ).toHaveCount(1, { timeout: 10_000 });
      });

      await test.step("marcar como leído", async () => {
        const panel = page.getByTestId("notification-panel");
        await panel
          .getByTestId("notification-item")
          .filter({ hasText: fastMessage })
          .getByTestId("notification-mark-read")
          .first()
          .click();
        const unreadToggle = page.getByRole("button", {
          name: "Sólo sin leer",
        });
        await unreadToggle.click();
        await expect(
          panel
            .getByTestId("notification-item")
            .filter({ hasText: fastMessage }),
        ).toHaveCount(0, { timeout: 10_000 });
        await page.getByRole("button", { name: "Ver todas" }).click();
      });

      await test.step("limpiar todas", async () => {
        await page.getByTestId("notification-close").click();
        const massMessageOne = `Notificación masiva ${Date.now()}-1`;
        const massMessageTwo = `Notificación masiva ${Date.now()}-2`;
        await createNotificationFixture(request, {
          userEmail: qaUser.email,
          message: massMessageOne,
        });
        await createNotificationFixture(request, {
          userEmail: qaUser.email,
          message: massMessageTwo,
        });
        await bell.click();
        const panel = page.getByTestId("notification-panel");
        await expect(panel).toBeVisible();
        const markAllButton = page.getByRole("button", {
          name: "Marcar todas",
        });
        await expect(markAllButton).toBeEnabled({ timeout: 10_000 });
        await markAllButton.click();
        await page.getByRole("button", { name: "Sólo sin leer" }).click();
        await expect
          .poll(
            async () => {
              const unreadResponse = await request.get(
                `${apiBaseUrl}/api/notifications?limit=10&unreadOnly=true`,
                {
                  headers: {
                    Authorization: `Bearer ${userAccessToken}`,
                  },
                },
              );
              const unreadJson = (await unreadResponse.json()) as {
                data?: Array<{ message: string }>;
              };
              const unreadMessages =
                unreadJson.data?.map((item) => item.message) ?? [];
              return (
                unreadMessages.includes(massMessageOne) ||
                unreadMessages.includes(massMessageTwo)
              );
            },
            { timeout: 10_000 },
          )
          .toBe(false);
      });
    } finally {
      await deleteUserFixture(request, qaUser.id);
    }
  });
});
