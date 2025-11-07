import {
  expect,
  request as playwrightRequest,
  type BrowserContext,
  type Page,
  type TestInfo,
} from "@playwright/test";
import { createHash } from "node:crypto";
import { deleteUserFixture, getAdminAccessToken } from "./services";

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

const apiBaseUrl = process.env.E2E_API_URL || "http://localhost:3001";
const createdUsers = new Map<
  string,
  { id: string; password: string; role: string }
>();

async function ensureUserCredentials(
  email: string,
  password: string,
  role: "ADMIN" | "COORDINATOR" | "STAFF" | "CLIENT" = "ADMIN",
  fullName = "QA Automation User",
): Promise<{ id: string }> {
  const apiContext = await playwrightRequest.newContext({
    baseURL: apiBaseUrl,
  });

  try {
    const accessToken = await getAdminAccessToken(apiContext);
    const searchResponse = await apiContext.get(
      `/api/users?limit=1&search=${encodeURIComponent(email)}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    let userId: string | undefined;
    if (searchResponse.ok()) {
      const json = (await searchResponse.json()) as {
        data?: Array<{ id: string }>;
      };
      userId = json?.data?.[0]?.id;
    }

    if (userId) {
      const updateResponse = await apiContext.patch(`/api/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        data: {
          password,
          role,
          isActive: true,
        },
      });

      if (!updateResponse.ok()) {
        throw new Error(
          `No se pudo actualizar el usuario ${email}: ${updateResponse.status()} ${updateResponse.statusText()}`,
        );
      }
    } else {
      const createResponse = await apiContext.post(`/api/users`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        data: {
          email,
          fullName,
          password,
          role,
        },
      });

      if (!createResponse.ok()) {
        throw new Error(
          `No se pudo crear el usuario ${email}: ${createResponse.status()} ${createResponse.statusText()}`,
        );
      }

      const createJson = (await createResponse.json()) as {
        data: { id: string };
      };
      userId = createJson.data.id;
    }

    if (!userId) {
      throw new Error(`No se pudo asegurar el usuario ${email}`);
    }

    createdUsers.set(email, { id: userId, password, role });
    return { id: userId };
  } finally {
    await apiContext.dispose();
  }
}

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
  }: { email: string; password: string; retries?: number },
) {
  const ip = ipForTest(testInfo);
  await page.context().setExtraHTTPHeaders({ "x-forwarded-for": ip });

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

    const stillOnLogin = (() => {
      try {
        return new URL(page.url()).pathname === "/login";
      } catch {
        return false;
      }
    })();
    if (navigationSucceeded && stillOnLogin) {
      navigationSucceeded = false;
    }
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

type CreateTestUserOptions = {
  email?: string;
  password?: string;
  fullName?: string;
  role?: "ADMIN" | "COORDINATOR" | "STAFF" | "CLIENT";
};

export async function createTestUser(
  overrides: CreateTestUserOptions = {},
): Promise<{ id: string; email: string; password: string }> {
  const email =
    overrides.email ??
    `qa-user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@brisacubanacleanintelligence.com`;
  const password = overrides.password ?? "Brisa123!";
  const role = overrides.role ?? "ADMIN";
  const fullName = overrides.fullName ?? "QA Dashboard User";

  await ensureUserCredentials(email, password, role, fullName);
  const entry = createdUsers.get(email);
  if (!entry) {
    throw new Error("No se pudo registrar el usuario de prueba");
  }

  return { id: entry.id, email, password };
}

export async function deleteTestUser(email: string): Promise<void> {
  const entry = createdUsers.get(email);
  if (!entry) {
    return;
  }

  const apiContext = await playwrightRequest.newContext({
    baseURL: apiBaseUrl,
  });

  try {
    await deleteUserFixture(apiContext, entry.id);
  } catch (error) {
    console.warn(`[e2e] Failed to delete test user ${email}:`, error);
  } finally {
    createdUsers.delete(email);
    await apiContext.dispose();
  }
}

export async function loginAsUser(
  page: Page,
  _context: BrowserContext,
  email: string,
  password: string,
): Promise<void> {
  const fakeTestInfo = { title: `login:${email}` } as TestInfo;
  await loginWithCredentials(page, fakeTestInfo, {
    email,
    password,
    retries: 4,
  });
}

export async function performLogin(
  page: Page,
  credentials: { email: string; password: string },
): Promise<void> {
  const fakeTestInfo = {
    title: `performLogin:${credentials.email}`,
  } as TestInfo;

  try {
    await loginWithCredentials(page, fakeTestInfo, {
      email: credentials.email,
      password: credentials.password,
      retries: 4,
    });
  } catch (error) {
    await ensureUserCredentials(
      credentials.email,
      credentials.password,
      "ADMIN",
      "QA Admin",
    );
    await loginWithCredentials(page, fakeTestInfo, {
      email: credentials.email,
      password: credentials.password,
      retries: 4,
    });
  }
}
