import { test, expect } from "@playwright/test";
import type { TestInfo } from "@playwright/test";

const adminEmail = process.env.E2E_ADMIN_EMAIL ?? "admin@brisacubanaclean.com";
const adminPassword = process.env.E2E_ADMIN_PASSWORD ?? "Brisa123!";

function ipForTest(testInfo: TestInfo): string {
  let hash = 0;
  for (const char of testInfo.title) {
    hash = (hash * 31 + char.charCodeAt(0)) % 200;
  }
  const octet = 50 + (hash % 150);
  return `198.51.101.${octet}`;
}

test.describe("Autenticación", () => {
  test("permite iniciar sesión y acceder al panel operativo @smoke @critical", async ({
    page,
  }, testInfo) => {
    const ip = ipForTest(testInfo);
    await page.context().setExtraHTTPHeaders({ "x-forwarded-for": ip });
    await page.goto("/login");

    await page.getByLabel("Correo").fill(adminEmail);
    await page.getByLabel("Contraseña").fill(adminPassword);
    await page.getByRole("button", { name: "Ingresar" }).click();

    await page.waitForURL("/**");
    await expect(
      page.getByRole("heading", { name: "Panel operativo" }),
    ).toBeVisible();
    await expect(page.getByText("Sesión:", { exact: false })).toContainText(
      adminEmail,
    );
  });
});
