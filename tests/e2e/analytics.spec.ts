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
      (window as unknown as { __brisaPostHogReady?: boolean })
        .__brisaPostHogReady,
    ),
  );

  const hasCaptureFn = await page.evaluate(() => {
    const posthogClient = (
      window as unknown as {
        __brisaPostHogClient?: { capture?: unknown };
      }
    ).__brisaPostHogClient;

    if (!posthogClient) {
      return false;
    }

    return typeof posthogClient.capture === "function";
  });

  expect(hasCaptureFn).toBeTruthy();
});
