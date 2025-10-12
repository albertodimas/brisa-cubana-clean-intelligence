import { test, expect } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import {
  adminEmail,
  ADMIN_STORAGE_STATE_PATH,
  loginAsAdmin,
} from "./support/auth";

test.describe("Autenticación", () => {
  test("permite iniciar sesión y acceder al panel operativo @smoke @critical", async ({
    page,
  }, testInfo) => {
    await loginAsAdmin(page, testInfo);
    await expect(
      page.getByRole("heading", { name: "Panel operativo" }),
    ).toBeVisible();
    await expect(page.getByText("Sesión:", { exact: false })).toContainText(
      adminEmail,
    );

    mkdirSync(dirname(ADMIN_STORAGE_STATE_PATH), { recursive: true });
    await page.context().storageState({ path: ADMIN_STORAGE_STATE_PATH });
  });
});
