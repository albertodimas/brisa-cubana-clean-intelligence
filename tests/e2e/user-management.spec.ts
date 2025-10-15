import { expect, test } from "@playwright/test";
import {
  adminEmail,
  adminPassword,
  loginAsAdmin,
  loginAsCoordinator,
} from "./support/auth";

let cachedAdminToken: string | null = null;

test.describe.serial("Gestión de usuarios", () => {
  let createdUser: {
    id: string;
    email: string;
  } | null = null;

  async function getAdminToken(page: Parameters<typeof test>[0]["page"]) {
    if (cachedAdminToken) {
      return cachedAdminToken;
    }
    const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
    const response = await page.request.post(
      `${apiBase}/api/authentication/login`,
      {
        data: { email: adminEmail, password: adminPassword },
      },
    );
    expect(response.status(), "admin login for API token").toBe(200);
    const body = await response.json();
    cachedAdminToken = body?.token as string;
    return cachedAdminToken;
  }

  async function createUserViaApi(
    page: Parameters<typeof test>[0]["page"],
    payload: {
      email: string;
      fullName: string;
      password: string;
      role: string;
    },
  ) {
    const token = await getAdminToken(page);
    const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
    const response = await page.request.post(`${apiBase}/api/users`, {
      data: payload,
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await response.json();
    return { status: response.status(), body };
  }

  async function deleteUserViaApi(
    page: Parameters<typeof test>[0]["page"],
    userId: string,
  ) {
    const token = await getAdminToken(page);
    const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
    await page.request.delete(`${apiBase}/api/users/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  async function getUserByEmailViaApi(
    page: Parameters<typeof test>[0]["page"],
    email: string,
  ) {
    const token = await getAdminToken(page);
    const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
    const response = await page.request.get(
      `${apiBase}/api/users?search=${encodeURIComponent(email)}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    const body = await response.json();
    const users = (body?.data ?? []) as Array<{
      email: string;
      isActive: boolean;
      role: string;
    }>;
    return users.find((user) => user.email === email) ?? null;
  }

  test("Admin can create new user @critical", async ({ page }, testInfo) => {
    await loginAsAdmin(page, testInfo);

    const uniqueSuffix = Date.now().toString(36);
    const email = `qa.user+${uniqueSuffix}@brisacubanaclean.test`;
    const fullName = `QA User ${uniqueSuffix}`;
    const escapedEmail = email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const { status, body } = await createUserViaApi(page, {
      email,
      fullName,
      password: "Temporal123!",
      role: "STAFF",
    });

    expect(status).toBe(201);
    expect(body?.data?.email).toBe(email);

    createdUser = {
      id: body?.data?.id as string,
      email,
    };

    await page.reload({ waitUntil: "domcontentloaded" });

    const row = page.getByRole("row", { name: new RegExp(escapedEmail, "i") });
    await expect(row).toBeVisible();
    await expect(row.getByText("STAFF").first()).toBeVisible();
  });

  test("Admin can update user role @critical", async ({ page }, testInfo) => {
    test.skip(!createdUser, "Usuario de prueba no disponible");
    await loginAsAdmin(page, testInfo);

    const escapedEmail = createdUser!.email.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&",
    );
    const row = page.getByRole("row", {
      name: new RegExp(escapedEmail, "i"),
    });
    await expect(row).toBeVisible();

    const roleSelect = row.getByRole("combobox").first();
    await roleSelect.selectOption("COORDINATOR");
    await row.getByRole("button", { name: /actualizar/i }).click();
    await expect
      .poll(async () => {
        const user = await getUserByEmailViaApi(page, createdUser!.email);
        return user?.role;
      })
      .toBe("COORDINATOR");
    await expect(row.getByRole("combobox").first()).toHaveValue("COORDINATOR");

    // Revert to STAFF so subsequent tests operate on the original state.
    await row.getByRole("combobox").first().selectOption("STAFF");
    await row.getByRole("button", { name: /actualizar/i }).click();
    await expect
      .poll(async () => {
        const user = await getUserByEmailViaApi(page, createdUser!.email);
        return user?.role;
      })
      .toBe("STAFF");
    await expect(row.getByRole("combobox").first()).toHaveValue("STAFF");
  });

  test("Admin can activate and deactivate users @critical", async ({
    page,
  }, testInfo) => {
    test.skip(!createdUser, "Usuario de prueba no disponible");
    await loginAsAdmin(page, testInfo);

    const escapedEmail = createdUser!.email.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&",
    );
    const rowLocator = () =>
      page.getByRole("row", {
        name: new RegExp(escapedEmail, "i"),
      });
    await expect(rowLocator()).toBeVisible();

    const checkboxLocator = () =>
      rowLocator()
        .getByRole("checkbox", { name: "Activo", exact: true })
        .first();
    await expect(checkboxLocator()).toBeChecked();

    const waitForUserActive = async (expected: boolean) =>
      await expect
        .poll(
          async () => {
            const user = await getUserByEmailViaApi(page, createdUser!.email);
            return user?.isActive;
          },
          { timeout: 10000 },
        )
        .toBe(expected);

    // Desactivar usuario
    await checkboxLocator().click();
    await waitForUserActive(false);
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(rowLocator().locator("td").nth(3)).toHaveText(/Inactivo/i);
    await expect(checkboxLocator()).not.toBeChecked();

    // Reactivar usuario
    await checkboxLocator().click();
    await waitForUserActive(true);
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(rowLocator().locator("td").nth(3)).toHaveText(/Activo/i);
    await expect(checkboxLocator()).toBeChecked();

    await deleteUserViaApi(page, createdUser!.id);
    createdUser = null;
  });

  test("Admin cannot deactivate themselves", async ({ page }, testInfo) => {
    await loginAsAdmin(page, testInfo);
    const adminRow = page.getByRole("row", {
      name: /admin@brisacubanaclean\.com/i,
    });
    await expect(adminRow).toBeVisible();
    const adminToggle = adminRow.getByRole("checkbox", { name: "Activo" });
    await expect(adminToggle).toBeDisabled();
  });

  test("Non-admin users cannot access user management", async ({
    page,
  }, testInfo) => {
    await loginAsCoordinator(page, testInfo);
    await expect(
      page.getByRole("heading", { name: "Gestión de usuarios" }),
    ).toHaveCount(0);
  });
});
