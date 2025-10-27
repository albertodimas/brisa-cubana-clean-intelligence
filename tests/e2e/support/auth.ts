import { expect, type Page, type TestInfo } from "@playwright/test";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";

export const adminEmail =
  process.env.E2E_ADMIN_EMAIL ?? "admin@brisacubanacleanintelligence.com";
export const adminPassword = process.env.E2E_ADMIN_PASSWORD ?? "Brisa123!";
export const coordinatorEmail =
  process.env.E2E_COORDINATOR_EMAIL ??
  "operaciones@brisacubanacleanintelligence.com";
export const coordinatorPassword =
  process.env.E2E_COORDINATOR_PASSWORD ?? "Brisa123!";
export const ADMIN_STORAGE_STATE_PATH =
  process.env.E2E_ADMIN_STATE_PATH ?? "tests/e2e/.auth/admin.json";

export function ipForTest(testInfo: TestInfo): string {
  // Derive a deterministic but non-guessable octet from the test title to avoid Math.random().
  const digest = createHash("sha256").update(testInfo.title).digest();
  const octet = 50 + (digest[0] % 150);
  return `198.51.101.${octet}`;
}

export async function loginWithCredentials(
  page: Page,
  testInfo: TestInfo,
  {
    email,
    password,
    retries = 4,
    useStorageState = true,
  }: {
    email: string;
    password: string;
    retries?: number;
    useStorageState?: boolean;
  },
) {
  const ip = ipForTest(testInfo);
  await page.context().setExtraHTTPHeaders({ "x-forwarded-for": ip });

  if (useStorageState && email === adminEmail) {
    try {
      const rawState = await fs.readFile(ADMIN_STORAGE_STATE_PATH, "utf8");
      const state = JSON.parse(rawState) as {
        cookies?: Array<Parameters<Page["context"]["addCookies"]>[0][number]>;
      };
      if (state.cookies && state.cookies.length > 0) {
        await page.context().addCookies(
          state.cookies.map((cookie) => ({
            ...cookie,
            expires: cookie.expires ?? -1,
          })),
        );
      }
      await page.goto("/panel", {
        waitUntil: "domcontentloaded",
      });
      const panelHeading = page.getByRole("heading", {
        name: "Panel operativo",
      });
      const panelRoot = page.getByTestId("panel-root").first();
      await Promise.all([
        expect(panelHeading).toBeVisible({ timeout: 5_000 }),
        expect(panelRoot).toBeVisible({ timeout: 5_000 }),
      ]);
      return;
    } catch {
      // fallback to credential flow below
    }
  }

  for (let attempt = 0; attempt < retries; attempt++) {
    await page.goto("/login", { waitUntil: "domcontentloaded" });
    await page.getByLabel("Correo").fill(email);
    await page.getByLabel("Contraseña").fill(password);

    let navigationSucceeded = false;
    const loginResponsePromise = page
      .waitForResponse(
        (response) =>
          response.url().includes("/api/authentication/login") &&
          response.request().method() === "POST",
        { timeout: 15_000 },
      )
      .catch(() => null);

    await Promise.all([
      (async () => {
        try {
          await page.waitForURL(
            (url) => {
              const { pathname } = new URL(url);
              return (
                pathname === "/panel" || pathname === "/" || pathname === ""
              );
            },
            { timeout: 15_000, waitUntil: "domcontentloaded" },
          );
          navigationSucceeded = true;
        } catch {
          navigationSucceeded = false;
        }
      })(),
      page.getByRole("button", { name: "Ingresar" }).click(),
    ]);

    try {
      await page.waitForLoadState("networkidle", { timeout: 5_000 });
    } catch {
      await page.waitForLoadState("load");
    }

    const loginResponse = await loginResponsePromise;
    if (loginResponse?.ok()) {
      navigationSucceeded = true;
    }

    const chunkErrorHeading = page
      .getByRole("heading", { name: "Something went wrong!" })
      .first();
    const retryButton = page.getByRole("button", { name: "Try again" }).first();
    if (await chunkErrorHeading.isVisible().catch(() => false)) {
      if (await retryButton.isVisible().catch(() => false)) {
        await retryButton.click();
        await page.waitForLoadState("domcontentloaded");
      }
      if (attempt < retries - 1) {
        await page.waitForTimeout(500);
        continue;
      }
    }

    const panelHeading = page.getByRole("heading", {
      name: "Panel operativo",
    });
    const panelRoot = page.getByTestId("panel-root").first();

    try {
      const { pathname } = new URL(page.url());
      if (pathname !== "/panel") {
        await page.goto("/panel", {
          waitUntil: "domcontentloaded",
        });
        navigationSucceeded = true;
      }
    } catch {
      // ignore URL parsing errors and fall back to existing visibility checks
    }
    const stillOnLogin = (() => {
      try {
        return new URL(page.url()).pathname === "/login";
      } catch {
        return false;
      }
    })();
    if (
      stillOnLogin &&
      attempt < retries - 1 &&
      !(await panelHeading.isVisible().catch(() => false))
    ) {
      await page.waitForTimeout(1_000);
      continue;
    }
    if (navigationSucceeded) {
      await expect(panelHeading).toBeVisible({ timeout: 10_000 });
      await expect(panelRoot).toBeVisible({ timeout: 15_000 });
      if (useStorageState && email === adminEmail) {
        await page.context().storageState({ path: ADMIN_STORAGE_STATE_PATH });
      }
      return;
    }

    const errorBanner = page
      .getByText("No se pudo iniciar sesión", { exact: false })
      .first();

    if (
      attempt < retries - 1 &&
      (await errorBanner.isVisible().catch(() => false))
    ) {
      await page.waitForTimeout(1000);
      continue;
    }

    await expect(panelHeading).toBeVisible({ timeout: 10_000 });
    await expect(panelRoot).toBeVisible({ timeout: 15_000 });
    if (useStorageState && email === adminEmail) {
      await page.context().storageState({ path: ADMIN_STORAGE_STATE_PATH });
    }
    return;
  }
}

export async function loginAsAdmin(
  page: Page,
  testInfo: TestInfo,
  options: { retries?: number; useStorageState?: boolean } = {},
) {
  await loginWithCredentials(page, testInfo, {
    email: adminEmail,
    password: adminPassword,
    retries: options.retries ?? 4,
    useStorageState: options.useStorageState ?? true,
  });
}

export async function loginAsCoordinator(
  page: Page,
  testInfo: TestInfo,
  options: { retries?: number } = {},
) {
  await loginWithCredentials(page, testInfo, {
    email: coordinatorEmail,
    password: coordinatorPassword,
    retries: options.retries ?? 4,
  });
}
