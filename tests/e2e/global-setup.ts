import path from "node:path";
import { existsSync, mkdirSync } from "node:fs";
import { request, type FullConfig } from "@playwright/test";

const STATE_RELATIVE_PATH = "tests/e2e/.auth/admin.json";

async function waitForHealth(
  requestContext: Awaited<ReturnType<typeof request.newContext>>,
  healthUrl: string,
) {
  for (let attempt = 0; attempt < 30; attempt++) {
    try {
      const healthResponse = await requestContext.get(healthUrl, {
        timeout: 2_000,
      });
      if (healthResponse.ok()) {
        return;
      }
    } catch {
      // ignore and retry
    }
    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }
  throw new Error(
    `Tiempo agotado esperando a que el endpoint de salud responda en ${healthUrl}`,
  );
}

export default async function globalSetup(_config: FullConfig) {
  const statePath = path.resolve(STATE_RELATIVE_PATH);

  if (existsSync(statePath)) {
    return;
  }

  const apiBaseUrl =
    process.env.E2E_API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://localhost:3001";
  const healthUrl = `${apiBaseUrl.replace(/\/$/, "")}/health`;
  const loginUrl = `${apiBaseUrl.replace(/\/$/, "")}/api/authentication/login`;
  const adminEmail =
    process.env.E2E_ADMIN_EMAIL ?? "admin@brisacubanacleanintelligence.com";
  const adminPassword = process.env.E2E_ADMIN_PASSWORD ?? "Brisa123!";

  const requestContext = await request.newContext();

  try {
    await waitForHealth(requestContext, healthUrl);

    const loginResponse = await requestContext.post(loginUrl, {
      data: {
        email: adminEmail,
        password: adminPassword,
      },
      timeout: 10_000,
    });

    if (!loginResponse.ok()) {
      const bodyText = await loginResponse.text();
      throw new Error(
        `No se pudo generar storage state inicial (status ${loginResponse.status()}): ${bodyText}`,
      );
    }

    const stateDir = path.dirname(statePath);
    if (!existsSync(stateDir)) {
      mkdirSync(stateDir, { recursive: true });
    }

    await requestContext.storageState({ path: statePath });
  } catch (error) {
    console.warn(
      "[globalSetup] No fue posible pre-generar el storage state de admin:",
      error,
    );
  } finally {
    await requestContext.dispose();
  }
}
