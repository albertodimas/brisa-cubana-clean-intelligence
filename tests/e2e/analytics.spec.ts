import { expect, test } from "@playwright/test";

test("@smoke @critical inicializa PostHog cuando la key está configurada", async ({
  page,
}) => {
  page.on("console", (message) => {
    console.log(`[console:${message.type()}] ${message.text()}`);
  });

  await page.goto("/");

  await page.waitForFunction(() =>
    Boolean(
      (
        window as unknown as {
          __brisaPostHogReady?: boolean;
          posthog?: { capture?: unknown };
        }
      ).__brisaPostHogReady ||
        typeof (window as unknown as { posthog?: { capture?: unknown } })
          .posthog?.capture === "function",
    ),
  );

  const hasCaptureFn = await page.evaluate(() => {
    const posthogClient = (
      window as unknown as {
        __brisaPostHogClient?: { capture?: unknown };
        posthog?: { capture?: unknown };
      }
    ).__brisaPostHogClient;

    if (posthogClient && typeof posthogClient.capture === "function") {
      return true;
    }

    const globalClient = (
      window as unknown as { posthog?: { capture?: unknown } }
    ).posthog;
    return typeof globalClient?.capture === "function";
  });

  expect(hasCaptureFn).toBeTruthy();
});
