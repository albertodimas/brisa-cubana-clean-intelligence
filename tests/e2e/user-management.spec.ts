import { expect, test } from "@playwright/test";
import { loginAsAdmin, loginAsCoordinator } from "./support/auth";

test.describe.serial("Gestión de usuarios", () => {
  let createdUser: {
    id: string;
    email: string;
  } | null = null;

  async function createUserViaApi(
    page: Parameters<typeof test>[0]["page"],
    payload: {
      email: string;
      fullName: string;
      password: string;
      role: string;
    },
  ) {
    return await page.evaluate(async (userPayload) => {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(userPayload),
      });
      const body = await response.json();
      return { status: response.status, body };
    }, payload);
  }

  async function deleteUserViaApi(
    page: Parameters<typeof test>[0]["page"],
    userId: string,
  ) {
    await page.evaluate(async (id) => {
      await fetch(`/api/users/${id}`, {
        method: "DELETE",
        headers: { "content-type": "application/json" },
      });
    }, userId);
  }

  test("Admin can create new user @critical", async ({ page }, testInfo) => {
    await loginAsAdmin(page, testInfo);

    const uniqueSuffix = Date.now().toString(36);
    const email = `qa.user+${uniqueSuffix}@brisacubanaclean.test`;
    const fullName = `QA User ${uniqueSuffix}`;

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

    await page.reload({ waitUntil: "networkidle" });

    const row = page.getByRole("row", { name: new RegExp(email, "i") });
    await expect(row).toBeVisible();
    await expect(row.getByText("STAFF").first()).toBeVisible();
  });

  test("Admin can update user role @critical", async ({ page }, testInfo) => {
    test.skip(!createdUser, "Usuario de prueba no disponible");
    await loginAsAdmin(page, testInfo);

    const row = page.getByRole("row", {
      name: new RegExp(createdUser!.email, "i"),
    });
    await expect(row).toBeVisible();

    const roleSelect = row.getByRole("combobox").first();
    await roleSelect.selectOption("COORDINATOR");
    await row.getByRole("button", { name: /actualizar/i }).click();
    await expect(row.getByText("COORDINATOR").first()).toBeVisible();

    // Revert to STAFF so subsequent tests operate on the original state.
    await roleSelect.selectOption("STAFF");
    await row.getByRole("button", { name: /actualizar/i }).click();
    await expect(row.getByText("STAFF").first()).toBeVisible();
  });

  test("Admin can activate and deactivate users @critical", async ({
    page,
  }, testInfo) => {
    test.skip(!createdUser, "Usuario de prueba no disponible");
    await loginAsAdmin(page, testInfo);

    const row = page.getByRole("row", {
      name: new RegExp(createdUser!.email, "i"),
    });
    await expect(row).toBeVisible();

    const checkbox = row.getByRole("checkbox", { name: "Activo" });
    await expect(checkbox).toBeChecked();

    await checkbox.click();
    await expect(checkbox).not.toBeChecked();
    await expect(row.getByText("Inactivo")).toBeVisible();

    await checkbox.click();
    await expect(checkbox).toBeChecked();
    await expect(row.getByText("Activo")).toBeVisible();

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
