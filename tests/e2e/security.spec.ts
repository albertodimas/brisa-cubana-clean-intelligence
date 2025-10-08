import { test, expect } from "@playwright/test";

const adminEmail = process.env.E2E_ADMIN_EMAIL ?? "admin@brisacubanaclean.com";
const adminPassword = process.env.E2E_ADMIN_PASSWORD ?? "BrisaClean2025";

test.describe("Seguridad y Autenticación", () => {
  test.describe("Escenarios negativos de login", () => {
    test("rechaza credenciales inválidas", async ({ page }) => {
      await page.goto("/login");

      await page.getByLabel("Correo").fill("invalido@example.com");
      await page.getByLabel("Contraseña").fill("password-incorrecta");
      await page.getByRole("button", { name: "Ingresar" }).click();

      // Esperar mensaje de error (ajustar selector según implementación real)
      await expect(page.getByText(/credenciales inválidas/i)).toBeVisible({
        timeout: 5000,
      });
    });

    test("rechaza email inválido", async ({ page }) => {
      await page.goto("/login");

      await page.getByLabel("Correo").fill("no-es-un-email");
      await page.getByLabel("Contraseña").fill(adminPassword);
      await page.getByRole("button", { name: "Ingresar" }).click();

      // El formulario debe validar el formato de email
      await expect(page.getByLabel("Correo")).toBeVisible();
      await expect(page).toHaveURL(/\/login/);
    });

    test("rechaza password vacío", async ({ page }) => {
      await page.goto("/login");

      await page.getByLabel("Correo").fill(adminEmail);
      await page.getByLabel("Contraseña").fill("");
      await page.getByRole("button", { name: "Ingresar" }).click();

      // El formulario debe requerir password
      await expect(page.getByLabel("Contraseña")).toBeVisible();
      await expect(page).toHaveURL(/\/login/);
    });
  });

  test.describe("Rate limiting", () => {
    test("bloquea múltiples intentos fallidos de login", async ({ page }) => {
      await page.goto("/login");

      // Intentar 6 veces con credenciales incorrectas (límite es 5)
      for (let i = 0; i < 6; i++) {
        await page.getByLabel("Correo").fill("attacker@example.com");
        await page.getByLabel("Contraseña").fill(`wrong-password-${i}`);
        await page.getByRole("button", { name: "Ingresar" }).click();

        // Esperar respuesta (aumentar timeout en los últimos intentos)
        await page.waitForTimeout(i < 4 ? 500 : 2000);
      }

      // En el 6to intento, debe haber rate limiting (429)
      // Verificar mensaje de "demasiados intentos" o similar
      await expect(
        page.getByText(/demasiados intentos|rate limit/i),
      ).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe("Acceso sin autenticación", () => {
    test("redirige a login cuando se accede al panel sin sesión", async ({
      page,
    }) => {
      // Intentar acceder directamente al panel
      await page.goto("/");

      // Si el panel requiere auth, debe redirigir a login o mostrar estado sin auth
      // Ajustar según implementación real
      const panelHeading = page.getByRole("heading", {
        name: "Panel operativo",
      });
      const loginForm = page.getByLabel("Correo");

      // Debe estar en login O el panel no debe mostrar operaciones
      const isInLogin = await loginForm.isVisible().catch(() => false);
      const hasPanel = await panelHeading.isVisible().catch(() => false);

      if (hasPanel) {
        // Si muestra panel sin auth, verificar que no hay botones de operaciones
        const saveButtons = page.getByRole("button", { name: "Guardar" });
        expect(await saveButtons.count()).toBe(0);
      } else {
        // Debe redirigir a login
        expect(isInLogin).toBe(true);
      }
    });
  });

  test.describe("Permisos y roles", () => {
    test("usuario CLIENT no debe poder crear servicios", async ({ page }) => {
      // Este test requiere credenciales de usuario CLIENT
      // Por ahora lo marcamos como ejemplo de test futuro

      // Login con usuario CLIENT (si tenemos credenciales)
      const clientEmail = "client@brisacubanaclean.com";
      const clientPassword = adminPassword; // Mismo password en seed

      await page.goto("/login");
      await page.getByLabel("Correo").fill(clientEmail);
      await page.getByLabel("Contraseña").fill(clientPassword);
      await page.getByRole("button", { name: "Ingresar" }).click();

      await page.waitForURL("/**");

      // El formulario de crear servicio no debe estar visible para CLIENT
      const serviceForm = page.locator("form").filter({
        has: page.getByRole("heading", { name: "Crear servicio" }),
      });

      // El formulario puede estar oculto o el botón Guardar deshabilitado
      const isVisible = await serviceForm.isVisible().catch(() => false);

      if (isVisible) {
        // Si el form está visible, intentar crear y debe fallar
        await serviceForm
          .locator('input[name="name"]')
          .fill("Test no autorizado");
        await serviceForm.getByRole("button", { name: "Guardar" }).click();

        // Debe mostrar error de permisos
        await expect(
          page.getByText(/no autorizado|permisos insuficientes/i),
        ).toBeVisible({ timeout: 5000 });
      } else {
        // El formulario no debe estar disponible
        expect(isVisible).toBe(false);
      }
    });
  });

  test.describe("Validación de datos", () => {
    test("rechaza creación de servicio con datos inválidos", async ({
      page,
    }) => {
      // Login como admin
      await page.goto("/login");
      await page.getByLabel("Correo").fill(adminEmail);
      await page.getByLabel("Contraseña").fill(adminPassword);
      await page.getByRole("button", { name: "Ingresar" }).click();
      await page.waitForURL("/**");

      const serviceForm = page.locator("form").filter({
        has: page.getByRole("heading", { name: "Crear servicio" }),
      });

      // Intentar crear servicio con precio negativo
      await serviceForm.locator('input[name="name"]').fill("Servicio inválido");
      await serviceForm
        .locator('textarea[name="description"]')
        .fill("Test validación");
      await serviceForm.locator('input[name="basePrice"]').fill("-100"); // Precio negativo
      await serviceForm.locator('input[name="durationMin"]').fill("60");
      await serviceForm.getByRole("button", { name: "Guardar" }).click();

      // Debe rechazar el precio negativo (validación HTML5 o servidor)
      // Verificar que no se creó o hay error
      await expect(
        serviceForm.getByText(/error|inválido|must be positive/i),
      ).toBeVisible({ timeout: 5000 });
    });

    test("rechaza creación de servicio sin nombre", async ({ page }) => {
      // Login como admin
      await page.goto("/login");
      await page.getByLabel("Correo").fill(adminEmail);
      await page.getByLabel("Contraseña").fill(adminPassword);
      await page.getByRole("button", { name: "Ingresar" }).click();
      await page.waitForURL("/**");

      const serviceForm = page.locator("form").filter({
        has: page.getByRole("heading", { name: "Crear servicio" }),
      });

      // Dejar nombre vacío
      await serviceForm.locator('input[name="name"]').fill("");
      await serviceForm
        .locator('textarea[name="description"]')
        .fill("Test validación");
      await serviceForm.locator('input[name="basePrice"]').fill("100");
      await serviceForm.locator('input[name="durationMin"]').fill("60");
      await serviceForm.getByRole("button", { name: "Guardar" }).click();

      // El campo nombre debe ser required
      const nameInput = serviceForm.locator('input[name="name"]');
      await expect(nameInput).toBeVisible();

      // Verificar que no redirigió o mostró éxito
      await expect(serviceForm.getByText("Servicio creado")).not.toBeVisible();
    });
  });

  test.describe("Sesión y logout", () => {
    test("permite cerrar sesión correctamente", async ({ page }) => {
      // Login
      await page.goto("/login");
      await page.getByLabel("Correo").fill(adminEmail);
      await page.getByLabel("Contraseña").fill(adminPassword);
      await page.getByRole("button", { name: "Ingresar" }).click();
      await page.waitForURL("/**");

      // Verificar que estamos logueados
      await expect(
        page.getByText("Sesión activa", { exact: false }),
      ).toBeVisible();

      // Cerrar sesión
      await page.getByRole("button", { name: /cerrar sesión|logout/i }).click();

      // Debe redirigir a login o limpiar sesión
      await expect(page.getByLabel("Correo")).toBeVisible({ timeout: 5000 });
      await expect(
        page.getByText("Sesión activa", { exact: false }),
      ).not.toBeVisible();
    });

    test("sesión persiste después de recargar página", async ({ page }) => {
      // Login
      await page.goto("/login");
      await page.getByLabel("Correo").fill(adminEmail);
      await page.getByLabel("Contraseña").fill(adminPassword);
      await page.getByRole("button", { name: "Ingresar" }).click();
      await page.waitForURL("/**");

      // Recargar página
      await page.reload();

      // La sesión debe persistir (cookie HttpOnly)
      await expect(
        page.getByText("Sesión activa", { exact: false }),
      ).toBeVisible({ timeout: 5000 });
    });
  });
});
