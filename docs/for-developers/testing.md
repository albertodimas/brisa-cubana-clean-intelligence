# Testing Guide

Guía completa de testing para Brisa Cubana Clean Intelligence. Este proyecto usa **Vitest** para tests unitarios y de integración del backend, y **Playwright** para tests E2E del frontend.

---

## Tabla de Contenidos

- [Stack de Testing](#stack-de-testing)
- [Estructura de Tests](#estructura-de-tests)
- [Tests Unitarios (Vitest)](#tests-unitarios-vitest)
- [Tests E2E (Playwright)](#tests-e2e-playwright)
- [Mocking y Test Doubles](#mocking-y-test-doubles)
- [Code Coverage](#code-coverage)
- [CI/CD Testing](#cicd-testing)
- [Best Practices](#best-practices)

---

## Stack de Testing

### Backend (API)

- **Framework:** [Vitest 3.2.4](https://vitest.dev/)
- **Coverage:** `@vitest/coverage-v8`
- **Assertions:** Built-in Vitest expect
- **Mocking:** `vi` from Vitest

### Frontend (Web)

- **E2E Framework:** [Playwright 1.55.1](https://playwright.dev/)
- **Browser:** Chromium (Desktop Chrome)
- **Reporters:** List + HTML

### Test Database

- **PostgreSQL 17** (Docker)
- **Migrations:** Prisma
- **Seeding:** [apps/api/prisma/seed.ts](https://github.com/albertodimas/brisa-cubana-clean-intelligence/blob/main/apps/api/prisma/seed.ts)

---

## Estructura de Tests

```
brisa-cubana-clean-intelligence/
├── apps/
│   ├── api/
│   │   ├── src/
│   │   │   ├── app.test.ts              # Tests de la app Hono
│   │   │   └── routes/
│   │   │       ├── auth.test.ts         # Tests de autenticación
│   │   │       ├── users.test.ts        # Tests de usuarios
│   │   │       ├── services.test.ts     # Tests de servicios
│   │   │       ├── bookings.test.ts     # Tests de reservas
│   │   │       ├── payments.test.ts     # Tests de pagos
│   │   │       ├── alerts.test.ts       # Tests de alertas
│   │   │       └── reconciliation.test.ts  # Tests de conciliación
│   │   └── vitest.config.ts             # Configuración Vitest
│   │
│   └── web/
│       ├── e2e/
│       │   └── home.spec.ts             # Test E2E de landing page
│       └── scripts/
│           └── start-e2e.js             # Script para iniciar servidor E2E
│
└── playwright.config.ts                 # Configuración Playwright global
```

---

## Tests Unitarios (Vitest)

### Comandos

```bash
# Desde la raíz del proyecto
cd apps/api

# Ejecutar todos los tests
pnpm test

# Ejecutar en modo watch (desarrollo)
pnpm test:watch

# Ejecutar con coverage
pnpm test -- --coverage

# Ejecutar tests específicos
pnpm test auth.test.ts
pnpm test users
```

### Configuración Vitest

El archivo [apps/api/vitest.config.ts](https://github.com/albertodimas/brisa-cubana-clean-intelligence/blob/main/apps/api/vitest.config.ts) contiene la configuración actual del proyecto.

**Configuración actual:**

```typescript
// apps/api/vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    env: {
      DATABASE_URL:
        process.env.DATABASE_URL ||
        "postgresql://postgres:postgres@localhost:5432/brisa_cubana_test",
      JWT_SECRET:
        process.env.JWT_SECRET ||
        "test-secret-key-for-vitest-testing-only-do-not-use-in-production",
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      exclude: [
        "node_modules/",
        "src/generated/**",
        "**/*.test.ts",
        "**/*.config.ts",
        "dist/",
      ],
      thresholds: {
        lines: 75,
        functions: 70,
        branches: 70,
        statements: 75,
      },
    },
    include: ["src/**/*.test.ts"],
    exclude: [
      "node_modules",
      "dist",
      "src/generated",
      "src/test/integration/**",
    ],
  },
});
```

> **Nota:** Mantén la cobertura en ≥75 % (líneas/estadísticas) y ≥70 % (funciones/branches). Los módulos de concierge e IA ya cuentan con pruebas, por lo que cualquier cambio debe actualizar sus suites correspondientes.

### Ejemplo: Test de Autenticación

[apps/api/src/routes/auth.test.ts](https://github.com/albertodimas/brisa-cubana-clean-intelligence/blob/main/apps/api/src/routes/auth.test.ts):

```typescript
import { describe, expect, it, beforeAll, afterAll, vi } from "vitest";
import { Hono } from "hono";

const verifyPasswordMock = vi.hoisted(() => vi.fn());

// Mockear dependencias
vi.mock("../lib/db", () => ({
  db: {
    user: {
      findUnique: vi.fn(({ where }: { where: { email: string } }) =>
        where.email === "demo@brisacubanaclean.com"
          ? {
              id: "user-demo",
              email: where.email,
              name: "Demo User",
              role: "CLIENT",
              passwordHash: "hashed-password",
            }
          : null,
      ),
    },
  },
}));

vi.mock("../lib/password", () => ({
  verifyPassword: verifyPasswordMock,
}));

import auth from "./auth";

describe("auth login route", () => {
  beforeAll(() => {
    process.env.JWT_SECRET = "test-secret";
  });

  const app = new Hono();
  app.route("/api/auth", auth);
  const handler = app.fetch;

  it("should return 400 for invalid payload", async () => {
    const res = await handler(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "invalid" }),
      }),
    );
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Invalid credentials payload");
  });

  it("should return 401 for wrong credentials", async () => {
    verifyPasswordMock.mockResolvedValue(false);

    const res = await handler(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "demo@brisacubanaclean.com",
          password: "wrongpassword",
        }),
      }),
    );

    expect(res.status).toBe(401);
  });

  it("should return token for valid credentials", async () => {
    verifyPasswordMock.mockResolvedValue(true);

    const res = await handler(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "demo@brisacubanaclean.com",
          password: "demo123",
        }),
      }),
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toHaveProperty("token");
    expect(json.email).toBe("demo@brisacubanaclean.com");
  });
});
```

### Anatomy de un Test

1. **Setup**: `beforeAll`, `beforeEach` para configurar mocks y env vars
2. **Arrange**: Preparar datos de test
3. **Act**: Ejecutar la función/endpoint
4. **Assert**: Verificar resultados con `expect()`
5. **Cleanup**: `afterAll`, `afterEach` para limpiar

### Testing de Rutas Hono

```typescript
import { Hono } from "hono";
import myRoute from "./my-route";

const app = new Hono();
app.route("/api/my-route", myRoute);
const handler = app.fetch;

it("should handle GET request", async () => {
  const res = await handler(
    new Request("http://localhost/api/my-route", {
      method: "GET",
      headers: { Authorization: "Bearer test-token" },
    }),
  );

  expect(res.status).toBe(200);
  const json = await res.json();
  expect(json).toEqual({ data: "expected" });
});
```

### Testing con Autenticación

```typescript
import { generateAccessToken } from "../lib/token";

it("should require authentication", async () => {
  // Sin token
  const res = await handler(
    new Request("http://localhost/api/bookings/mine", {
      method: "GET",
    }),
  );
  expect(res.status).toBe(401);
});

it("should allow authenticated user", async () => {
  const token = generateAccessToken({
    sub: "user-id",
    email: "user@example.com",
    role: "CLIENT",
  });

  const res = await handler(
    new Request("http://localhost/api/bookings/mine", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    }),
  );
  expect(res.status).toBe(200);
});
```

---

## Tests E2E (Playwright)

### Comandos

```bash
# Desde la raíz del proyecto
pnpm test:e2e

# Con UI mode (debugging)
pnpm playwright test --ui

# En modo headed (ver browser)
pnpm playwright test --headed

# Un solo archivo
pnpm playwright test home.spec.ts

# Con debugging
pnpm playwright test --debug
```

### Estructura de un Test E2E

[apps/web/e2e/home.spec.ts](https://github.com/albertodimas/brisa-cubana-clean-intelligence/blob/main/apps/web/e2e/home.spec.ts):

```typescript
import { test, expect } from "@playwright/test";

test.describe("Landing page", () => {
  test("shows hero metrics and CTA buttons", async ({ page }) => {
    // Navegar a la página
    await page.goto("/");

    // Verificar contenido
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "El sistema operativo inteligente para la limpieza boutique de Miami-Dade.",
    );

    // Verificar elementos visibles
    const metricCards = page.getByText("Onboarding digital promedio");
    await expect(metricCards).toBeVisible();

    // Verificar links
    await expect(
      page.getByRole("link", { name: "Agendar demo piloto" }),
    ).toBeVisible();
  });
});
```

### Configuración Playwright

[playwright.config.ts](https://github.com/albertodimas/brisa-cubana-clean-intelligence/blob/main/playwright.config.ts):

```typescript
import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.PORT ?? 3000);

export default defineConfig({
  testDir: "./apps/web/e2e",
  timeout: 60_000,
  expect: {
    timeout: 5_000,
  },
  fullyParallel: true,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  webServer: {
    command: "node apps/web/scripts/start-e2e.js",
    url: `http://127.0.0.1:${port}`,
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
```

### Playwright Best Practices

#### 1. Usar selectores semánticos

```typescript
// ✅ Bueno: Usar roles ARIA
await page.getByRole("button", { name: "Submit" }).click();
await page.getByRole("heading", { level: 1 }).textContent();

// ✅ Bueno: Usar test IDs
await page.getByTestId("submit-button").click();

// ❌ Malo: Selectores CSS frágiles
await page.locator(".btn-primary-123").click();
```

#### 2. Esperar explícitamente

```typescript
// ✅ Bueno: expect con timeout implícito
await expect(page.getByText("Success")).toBeVisible();

// ✅ Bueno: waitForSelector
await page.waitForSelector('[data-testid="dashboard"]');

// ❌ Malo: sleep arbitrario
await page.waitForTimeout(3000);
```

#### 3. Test isolation

```typescript
test.beforeEach(async ({ page }) => {
  // Cada test empieza desde cero
  await page.goto("/");
  // Opcional: login, seed data, etc.
});

test.afterEach(async ({ page }) => {
  // Cleanup después de cada test
});
```

#### 4. Testing de autenticación

```typescript
test.describe("Authenticated flows", () => {
  test.use({ storageState: "playwright/.auth/user.json" });

  test("should access dashboard", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByText("Welcome back")).toBeVisible();
  });
});

// Generar storageState con un test de setup
test("authenticate", async ({ page }) => {
  await page.goto("/auth/signin");
  await page.fill('[name="email"]', "admin@brisacubanaclean.com");
  await page.fill('[name="password"]', "Admin123!");
  await page.click('button[type="submit"]');
  await page.waitForURL("/dashboard");

  await page.context().storageState({
    path: "playwright/.auth/user.json",
  });
});
```

#### 5. Testing de formularios

```typescript
test("should create booking", async ({ page }) => {
  await page.goto("/dashboard/bookings/new");

  // Llenar formulario
  await page.selectOption('[name="serviceId"]', "service-uuid");
  await page.selectOption('[name="propertyId"]', "prop-uuid");
  await page.fill('[name="scheduledAt"]', "2025-10-15T10:00");
  await page.fill('[name="notes"]', "Test booking");

  // Submit
  await page.click('button[type="submit"]');

  // Verificar redirect o mensaje de éxito
  await expect(page.getByText("Booking created")).toBeVisible();
  await expect(page).toHaveURL(/\/dashboard\/bookings\/[a-z0-9-]+/);
});
```

---

## Mocking y Test Doubles

### Mocking con Vitest

#### Mock de módulos completos

```typescript
vi.mock("../lib/db", () => ({
  db: {
    user: {
      findMany: vi.fn(() =>
        Promise.resolve([
          { id: "1", name: "User 1" },
          { id: "2", name: "User 2" },
        ]),
      ),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));
```

#### Mock de funciones específicas

```typescript
import { vi } from "vitest";
import * as passwordLib from "../lib/password";

vi.spyOn(passwordLib, "hashPassword").mockResolvedValue("hashed-password");

vi.spyOn(passwordLib, "verifyPassword").mockResolvedValue(true);
```

#### Mock de variables de entorno

```typescript
describe("API tests", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      JWT_SECRET: "test-secret",
      DATABASE_URL: "postgresql://test",
      STRIPE_SECRET_KEY: "sk_test_mock",
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should use mocked env vars", () => {
    expect(process.env.JWT_SECRET).toBe("test-secret");
  });
});
```

#### Mock de fetch/APIs externas

```typescript
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ data: "mocked" }),
  } as Response),
);

// Cleanup
afterAll(() => {
  vi.restoreAllMocks();
});
```

---

## Code Coverage

### Generar Coverage Report

```bash
cd apps/api
pnpm test -- --coverage
```

### Ver HTML Report

```bash
open coverage/index.html
```

### Coverage en CI

El workflow `.github/workflows/ci.yml` ya genera coverage automáticamente.

### Umbrales Recomendados

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      lines: 80,
      functions: 80,
      branches: 80,
      statements: 80,
    },
  },
});
```

### Ignorar archivos del coverage

```typescript
coverage: {
  exclude: [
    "node_modules/",
    "dist/",
    "*.config.{ts,js}",
    "prisma/",
    "scripts/",
    "src/server.ts", // Entry point
  ];
}
```

---

## CI/CD Testing

### GitHub Actions Workflow

[.github/workflows/ci.yml](https://github.com/albertodimas/brisa-cubana-clean-intelligence/blob/main/.github/workflows/ci.yml):

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:17
        env:
          POSTGRES_USER: brisa_user
          POSTGRES_PASSWORD: brisa_pass
          POSTGRES_DB: brisa_cubana_db
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "24"

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 10

      - name: Install dependencies
        run: pnpm install

      - name: Run Prisma migrations
        run: cd apps/api && pnpm prisma migrate deploy

      - name: Run tests
        run: cd apps/api && pnpm test

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          files: apps/api/coverage/lcov.info

  e2e:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "24"
      - uses: pnpm/action-setup@v4

      - name: Install dependencies
        run: pnpm install

      - name: Install Playwright browsers
        run: pnpm playwright install --with-deps chromium

      - name: Run E2E tests
        run: pnpm test:e2e

      - name: Upload Playwright report
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
```

---

## Best Practices

### 1. Nomenclatura de Tests

```typescript
// ✅ Bueno: Descriptivo y claro
describe("POST /api/bookings", () => {
  it("should create booking with valid payload", async () => {});
  it("should return 400 for missing serviceId", async () => {});
  it("should return 403 if user is not CLIENT", async () => {});
});

// ❌ Malo: Vago
describe("bookings", () => {
  it("works", async () => {});
  it("test1", async () => {});
});
```

### 2. AAA Pattern (Arrange-Act-Assert)

```typescript
it("should update booking status", async () => {
  // Arrange
  const bookingId = "booking-123";
  const token = generateTestToken({ role: "STAFF" });

  // Act
  const res = await handler(
    new Request(`http://localhost/api/bookings/${bookingId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "COMPLETED" }),
    }),
  );

  // Assert
  expect(res.status).toBe(200);
  const json = await res.json();
  expect(json.status).toBe("COMPLETED");
  expect(json.completedAt).toBeDefined();
});
```

### 3. Tests Independientes

```typescript
// ✅ Bueno: Cada test es independiente
beforeEach(() => {
  vi.clearAllMocks();
  // Reset state
});

it("test A", async () => {
  // No depende de test B
});

it("test B", async () => {
  // No depende de test A
});

// ❌ Malo: Tests dependientes
let globalState;

it("test A", async () => {
  globalState = "foo";
});

it("test B", async () => {
  expect(globalState).toBe("foo"); // Falla si test A no corre
});
```

### 4. Test Data Builders

```typescript
// utils/test-builders.ts
export const buildUser = (overrides = {}) => ({
  id: "user-" + Math.random(),
  email: "test@example.com",
  name: "Test User",
  role: "CLIENT",
  ...overrides,
});

export const buildBooking = (overrides = {}) => ({
  id: "booking-" + Math.random(),
  userId: "user-id",
  serviceId: "service-id",
  propertyId: "prop-id",
  status: "PENDING",
  totalPrice: "120.00",
  scheduledAt: new Date(),
  ...overrides,
});

// En tests
it("should filter bookings by status", async () => {
  const booking = buildBooking({ status: "CONFIRMED" });
  // ...
});
```

### 5. Evitar Timeouts Arbitrarios

```typescript
// ❌ Malo
await page.waitForTimeout(5000);

// ✅ Bueno: Esperar condición específica
await page.waitForSelector('[data-testid="success-message"]');
await expect(page.getByText("Success")).toBeVisible();
```

### 6. Tests Positivos y Negativos

```typescript
describe("POST /api/users", () => {
  it("should create user with valid data", async () => {
    // Happy path
  });

  it("should return 400 for invalid email", async () => {
    // Sad path: validación
  });

  it("should return 400 for duplicate email", async () => {
    // Sad path: constraint
  });

  it("should return 403 if user is not ADMIN", async () => {
    // Sad path: autorización
  });
});
```

---

## Debugging Tests

### Vitest

```bash
# Modo watch con UI
pnpm test:watch

# Solo un test
pnpm test -t "should create booking"

# Ver output detallado
pnpm test -- --reporter=verbose

# Debug con Node inspector
node --inspect-brk ./node_modules/vitest/vitest.mjs
```

### Playwright

```bash
# UI Mode (recomendado)
pnpm playwright test --ui

# Headed mode (ver browser)
pnpm playwright test --headed

# Debug mode (pausa en breakpoints)
pnpm playwright test --debug

# Trace viewer
pnpm playwright show-trace trace.zip
```

---

## Recursos Adicionales

- **Vitest Docs:** https://vitest.dev/
- **Playwright Docs:** https://playwright.dev/
- **Testing Best Practices:** https://testingjavascript.com/
- **Test Data Builders:** https://www.martinfowler.com/bliki/ObjectMother.html

---

**Última actualización:** 30 de septiembre de 2025

Ver también:

- [API Reference](api-reference.md)
- [Quickstart Guide](quickstart.md)
- [CONTRIBUTING.md](https://github.com/albertodimas/brisa-cubana-clean-intelligence/blob/main/CONTRIBUTING.md)
