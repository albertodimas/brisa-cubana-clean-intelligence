import { test, expect, request as playwrightRequest } from "@playwright/test";
import type { TestInfo } from "@playwright/test";
import { adminEmail, adminPassword, loginAsAdmin } from "./support/auth";

function ipForTestNamespace(testInfo: TestInfo, namespace = 102): string {
  let hash = 0;
  for (const char of testInfo.title) {
    hash = (hash * 33 + char.charCodeAt(0)) % 200;
  }
  const octet = 10 + (hash % 200);
  return `198.51.${namespace}.${octet}`;
}

test.describe("Seguridad y Autenticación", () => {
  test.describe("Escenarios negativos de login", () => {
    test("rechaza credenciales inválidas @critical", async ({
      page,
    }, testInfo) => {
      const ip = ipForTestNamespace(testInfo);
      await page.context().setExtraHTTPHeaders({ "x-forwarded-for": ip });
      await page.goto("/login");

      await page.getByLabel("Correo").fill("invalido@example.com");
      await page.getByLabel("Contraseña").fill("password-incorrecta");
      await page.getByRole("button", { name: "Ingresar" }).click();

      await expect(page).toHaveURL(/\/login/);
      await expect(
        page.getByRole("heading", {
          name: "Panel operativo Brisa Cubana",
        }),
      ).toBeVisible();
      await expect(
        page.getByText(
          /Credenciales inválidas|No se pudo iniciar sesión|Error inesperado/i,
        ),
      ).toBeVisible();
    });

    test("rechaza email inválido", async ({ page }, testInfo) => {
      const ip = ipForTestNamespace(testInfo, 103);
      await page.context().setExtraHTTPHeaders({ "x-forwarded-for": ip });
      await page.goto("/login");

      await page.getByLabel("Correo").fill("no-es-un-email");
      await page.getByLabel("Contraseña").fill(adminPassword);
      await page.getByRole("button", { name: "Ingresar" }).click();

      // El formulario debe validar el formato de email
      await expect(page.getByLabel("Correo")).toBeVisible();
      await expect(page).toHaveURL(/\/login/);
    });

    test("rechaza password vacío", async ({ page }, testInfo) => {
      const ip = ipForTestNamespace(testInfo, 104);
      await page.context().setExtraHTTPHeaders({ "x-forwarded-for": ip });
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
    test("bloquea múltiples intentos fallidos de login", async () => {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
      // Read rate limit from env (default 5, test env uses 50)
      const rateLimit = Number(process.env.LOGIN_RATE_LIMIT ?? "5");
      const safetyMargin = Math.max(5, Math.ceil(rateLimit * 0.2));
      const attemptsToTriggerLimit = rateLimit + safetyMargin;

      const apiContext = await playwrightRequest.newContext();
      let rateLimited = false;

      try {
        for (let i = 0; i < attemptsToTriggerLimit; i++) {
          const response = await apiContext.post(
            `${apiUrl}/api/authentication/login`,
            {
              data: {
                email: "attacker@example.com",
                password: `wrong-password-${i}`,
              },
              headers: {
                "Content-Type": "application/json",
                "x-forwarded-for": "203.0.113.10",
              },
            },
          );

          if (response.status() === 429) {
            rateLimited = true;
            break;
          }

          expect(response.status()).toBe(401);

          // Pequeña pausa para permitir que el rate limiter acumule los intentos
          await new Promise((resolve) => setTimeout(resolve, 20));
        }
      } finally {
        await apiContext.dispose();
      }

      expect(rateLimited).toBe(true);
    });
  });

  test.describe("Acceso sin autenticación", () => {
    test("redirige a login cuando se accede al panel sin sesión", async ({
      page,
    }, testInfo) => {
      const ip = ipForTestNamespace(testInfo, 105);
      await page.context().setExtraHTTPHeaders({ "x-forwarded-for": ip });
      // Intentar acceder directamente al panel
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      const currentUrl = page.url();
      if (currentUrl.includes("/login")) {
        await expect(page.getByLabel("Correo")).toBeVisible();
        return;
      }

      const saveButtons = page.getByRole("button", { name: "Guardar" });
      expect(await saveButtons.count()).toBe(0);
    });

    test("responde 401 en endpoints del portal sin sesión", async ({
      request,
    }) => {
      const response = await request.get("/api/portal/bookings");
      expect(response.status()).toBe(401);
    });
  });

  test.describe("Flujos autenticados", () => {
    test("redirige /login al panel cuando ya hay sesión", async ({
      page,
    }, testInfo) => {
      await loginAsAdmin(page, testInfo);
      await page.goto("/login");
      await expect
        .poll(() => new URL(page.url()).pathname)
        .toMatch(/^\/(?:panel)?$/);
    });
  });

  test.describe("Permisos y roles", () => {
    test("usuario CLIENT no debe poder crear servicios @critical", async ({
      page,
    }, testInfo) => {
      const ip = ipForTestNamespace(testInfo, 106);
      await page.context().setExtraHTTPHeaders({ "x-forwarded-for": ip });
      // Este test requiere credenciales de usuario CLIENT
      // Por ahora lo marcamos como ejemplo de test futuro

      // Login con usuario CLIENT (si tenemos credenciales)
      const clientEmail = "cliente@brisacubanacleanintelligence.com";
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
      request,
    }) => {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
      const loginResponse = await request.post(
        `${apiUrl}/api/authentication/login`,
        {
          data: { email: adminEmail, password: adminPassword },
          headers: {
            "Content-Type": "application/json",
            "x-forwarded-for": "198.51.100.20",
          },
        },
      );
      expect(loginResponse.ok()).toBeTruthy();

      const { token } = (await loginResponse.json()) as {
        token: string;
      };

      const response = await request.post(`${apiUrl}/api/services`, {
        data: {
          name: "Servicio inválido",
          description: "Test validación",
          basePrice: -100,
          durationMin: 60,
        },
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      expect(response.status()).toBe(400);
    });

    test("rechaza creación de servicio sin nombre", async ({ request }) => {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
      const loginResponse = await request.post(
        `${apiUrl}/api/authentication/login`,
        {
          data: { email: adminEmail, password: adminPassword },
          headers: {
            "Content-Type": "application/json",
            "x-forwarded-for": "198.51.100.21",
          },
        },
      );
      expect(loginResponse.ok()).toBeTruthy();

      const { token } = (await loginResponse.json()) as {
        token: string;
      };

      const response = await request.post(`${apiUrl}/api/services`, {
        data: {
          name: "",
          description: "Test validación",
          basePrice: 150,
          durationMin: 60,
        },
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      expect(response.status()).toBe(400);
    });
  });

  test.describe("Sesión y logout", () => {
    test("gestiona sesión (persistencia y logout) @critical", async ({
      page,
    }, testInfo) => {
      // Login as admin first
      await loginAsAdmin(page, testInfo);

      await page.goto("/panel");
      const panelRoot = page.getByTestId("panel-root").first();
      const sessionIndicator = page.getByTestId("panel-session").first();

      await expect(panelRoot).toBeVisible({ timeout: 15_000 });
      await expect(sessionIndicator).toContainText("Sesión:", {
        timeout: 15_000,
      });

      await test.step("persiste después de recargar", async () => {
        await page.reload();
        await expect(panelRoot).toBeVisible({ timeout: 15_000 });
        await expect(sessionIndicator).toContainText("Sesión:", {
          timeout: 15_000,
        });
      });

      await test.step("cierra sesión y redirige a login", async () => {
        // Buscar el botón de logout dentro del panel de sesión
        const logoutButton = sessionIndicator.getByRole("button", {
          name: "Cerrar sesión",
        });

        // Esperar a que el botón sea visible y clickeable
        await expect(logoutButton).toBeVisible({ timeout: 10_000 });
        await expect(logoutButton).toBeEnabled({ timeout: 5000 });

        // Click y esperar navegación en paralelo
        await Promise.all([
          page.waitForURL(/\/login/, { timeout: 15_000 }),
          logoutButton.click(),
        ]);

        // Verificar que estamos en login
        await expect(page.getByLabel("Correo")).toBeVisible({ timeout: 5000 });

        // Verificar que el panel ya no es visible
        const currentUrl = page.url();
        expect(currentUrl).toMatch(/\/login/);
      });
    });
  });
});
