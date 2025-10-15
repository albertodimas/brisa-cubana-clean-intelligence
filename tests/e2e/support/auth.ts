import { expect, type Page, type TestInfo } from "@playwright/test";

export const adminEmail =
  process.env.E2E_ADMIN_EMAIL ?? "admin@brisacubanaclean.com";
export const adminPassword = process.env.E2E_ADMIN_PASSWORD ?? "Brisa123!";
export const coordinatorEmail =
  process.env.E2E_COORDINATOR_EMAIL ?? "ops@brisacubanaclean.com";
export const coordinatorPassword =
  process.env.E2E_COORDINATOR_PASSWORD ?? "Brisa123!";
export const ADMIN_STORAGE_STATE_PATH =
  process.env.E2E_ADMIN_STATE_PATH ?? "tests/e2e/.auth/admin.json";

export function ipForTest(testInfo: TestInfo): string {
  let hash = 0;
  for (const char of testInfo.title) {
    hash = (hash * 31 + char.charCodeAt(0)) % 200;
  }
  const octet = 50 + (hash % 150);
  return `198.51.101.${octet}`;
}

export async function loginWithCredentials(
  page: Page,
  testInfo: TestInfo,
  {
    email,
    password,
    retries = 4,
  }: { email: string; password: string; retries?: number },
) {
  const ip = ipForTest(testInfo);
  await page.context().setExtraHTTPHeaders({ "x-forwarded-for": ip });

  for (let attempt = 0; attempt < retries; attempt++) {
    await page.goto("/login", { waitUntil: "domcontentloaded" });
    await page.getByLabel("Correo").fill(email);
    await page.getByLabel("Contraseña").fill(password);

    let navigationSucceeded = false;
    await Promise.all([
      (async () => {
        try {
          await page.waitForURL(
            (url) => {
              const { pathname } = new URL(url);
              return pathname === "/" || pathname === "";
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

    const panelHeading = page.getByRole("heading", {
      name: "Panel operativo",
    });
    if (navigationSucceeded) {
      await expect(panelHeading).toBeVisible({ timeout: 10_000 });
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
    return;
  }
}

export async function loginAsAdmin(
  page: Page,
  testInfo: TestInfo,
  options: { retries?: number } = {},
) {
  await loginWithCredentials(page, testInfo, {
    email: adminEmail,
    password: adminPassword,
    retries: options.retries ?? 4,
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
