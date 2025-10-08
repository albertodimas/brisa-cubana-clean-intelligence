# Estrategia de Testing E2E

## Estado Actual (Baseline)

### Métricas

- **Total de tests:** 13
- **Duración total:** ~8 segundos
- **Archivos:** 3 (auth.spec.ts, operations.spec.ts, security.spec.ts)
- **Ejecución:** Paralela con workers ilimitados en local, 2 workers en CI
- **Distribución:**
  - auth.spec.ts: 1 test (login básico)
  - operations.spec.ts: 2 tests (crear servicio, filtrar reservas)
  - security.spec.ts: 10 tests (validaciones, rate limiting, permisos, sesión)

### Problemática Identificada

1. **Feedback lento en CI:** Todos los tests se ejecutan siempre, incluso en cambios mínimos
2. **Sin priorización:** Tests críticos mezclados con tests exhaustivos
3. **Escalabilidad:** A medida que crezca la suite, los tiempos aumentarán linealmente
4. **Costos de CI:** Sin optimización de cuándo ejecutar qué tests

---

## Estrategia Propuesta: Suite Piramidal

### Niveles de Testing

#### 1. **Smoke Tests** (~2s)

**Propósito:** Validación rápida de funcionalidad crítica del sistema

**Criterios de inclusión:**

- Login y autenticación básica
- Navegación principal funciona
- API responde correctamente
- Sin errores fatales en carga inicial

**Tests seleccionados:**

- `auth.spec.ts`: "permite iniciar sesión y acceder al panel operativo"
- `operations.spec.ts`: "permite crear un nuevo servicio" (prueba que CRUD básico funciona)

**Ejecución:**

- **Cuándo:** Cada push a cualquier branch
- **Timeout:** 30 segundos
- **Workers:** 2 (para máxima velocidad)

**Objetivo de tiempo:** < 3 segundos

---

#### 2. **Critical Tests** (~5s)

**Propósito:** Validación de flujos de negocio principales

**Criterios de inclusión:**

- Operaciones CRUD completas
- Flujos de autenticación completos (login + logout + persistencia)
- Validaciones de permisos básicas
- Casos de error comunes

**Tests seleccionados:**

- Todos los **Smoke Tests** +
- `operations.spec.ts`: "filtra reservas por estado"
- `security.spec.ts`:
  - "rechaza credenciales inválidas"
  - "usuario CLIENT no debe poder crear servicios"
  - "permite cerrar sesión correctamente"
  - "sesión persiste después de recargar página"

**Ejecución:**

- **Cuándo:**
  - Pull requests a `main`
  - Merges a `main`
  - Deploys a staging
- **Timeout:** 60 segundos
- **Workers:** 4

**Objetivo de tiempo:** < 6 segundos

---

#### 3. **Full Suite** (~8-10s)

**Propósito:** Validación exhaustiva de todos los escenarios

**Criterios de inclusión:**

- Todos los tests disponibles
- Casos edge completos
- Validaciones exhaustivas de seguridad
- Rate limiting
- Validaciones de datos

**Tests incluidos:**

- **Todos los 13 tests actuales**

**Ejecución:**

- **Cuándo:**
  - Nightly builds (diario a las 2 AM)
  - Pre-release (antes de tags)
  - Deploys a production
  - Manualmente con `pnpm test:e2e:full`
- **Timeout:** 120 segundos
- **Workers:** 6-8 (máximo paralelismo)

**Objetivo de tiempo:** < 10 segundos

---

## Implementación Técnica

### Tags en Playwright

Utilizaremos el sistema de tags de Playwright para categorizar tests:

```typescript
// Smoke test
test("permite iniciar sesión @smoke", async ({ page }) => {
  // ...
});

// Critical test
test("permite cerrar sesión @critical", async ({ page }) => {
  // ...
});

// Full suite (sin tag especial, se ejecuta por defecto)
test("rechaza email inválido", async ({ page }) => {
  // ...
});
```

### Configuración de Projects

`playwright.config.ts` tendrá 3 projects:

```typescript
export default defineConfig({
  projects: [
    {
      name: "smoke",
      testMatch: /.*(spec|test)\.ts/,
      grep: /@smoke/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "critical",
      testMatch: /.*(spec|test)\.ts/,
      grep: /@(smoke|critical)/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "full",
      testMatch: /.*(spec|test)\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
```

### Comandos NPM

```json
{
  "scripts": {
    "test:e2e": "playwright test --project=full",
    "test:e2e:smoke": "playwright test --project=smoke",
    "test:e2e:critical": "playwright test --project=critical",
    "test:e2e:full": "playwright test --project=full"
  }
}
```

---

## Problemas Resueltos

### Rate Limiting en Tests Paralelos

**Problema:** Al ejecutar la suite `critical` con 7 workers paralelos, los tests fallaban con error "No se pudo iniciar sesión".

**Causa raíz:**

- El flujo de autenticación es: Navegador → Next.js → Auth Provider → API
- Los tests configuran `x-forwarded-for` en el navegador, pero este header **no se propaga** al API
- El Auth Provider hace fetch al API `/api/authentication/login` desde localhost (mismo IP para todos)
- Con 7 logins paralelos desde la misma IP (localhost), se excede el límite por defecto de `LOGIN_RATE_LIMIT=5`

**Solución aplicada:**
Aumentar el rate limit en entorno de test en `playwright.config.ts`:

```typescript
{
  command: "pnpm --filter @brisa/api dev",
  env: {
    NODE_ENV: "test",
    LOGIN_RATE_LIMIT: "50", // Increased for parallel E2E tests
    LOGIN_RATE_LIMIT_WINDOW_MS: "60000",
  },
}
```

**Resultado:**

- ✅ Critical suite: 7/7 tests passing (7.8s)
- ✅ Full suite: 13/13 tests passing
- ✅ Smoke suite: 2/2 tests passing (7.1s)

**Mejora futura (opcional):**
Modificar el middleware de Next.js para propagar `x-forwarded-for` al backend, permitiendo usar el rate limiting real por IP.

---

## Integración CI/CD

### GitHub Actions Workflows

#### 1. PR Checks (`.github/workflows/pr-checks.yml`)

```yaml
name: PR Checks

on:
  pull_request:
    branches: [main]

jobs:
  smoke-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup
        # ... setup steps
      - name: Run Smoke Tests
        run: pnpm test:e2e:smoke
```

#### 2. Main Branch (`.github/workflows/main.yml`)

```yaml
name: Main Branch Tests

on:
  push:
    branches: [main]

jobs:
  critical-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup
        # ... setup steps
      - name: Run Critical Tests
        run: pnpm test:e2e:critical
```

#### 3. Nightly Full Suite (`.github/workflows/nightly.yml`)

```yaml
name: Nightly E2E Full Suite

on:
  schedule:
    - cron: "0 2 * * *" # 2 AM UTC daily
  workflow_dispatch:

jobs:
  full-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup
        # ... setup steps
      - name: Run Full E2E Suite
        run: pnpm test:e2e:full
      - name: Upload Report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
```

---

## Matriz de Ejecución

| Evento                | Suite    | Duración Estimada | Costo CI |
| --------------------- | -------- | ----------------- | -------- |
| Push a feature branch | Smoke    | ~3s               | Bajo     |
| PR a main             | Critical | ~6s               | Medio    |
| Merge a main          | Critical | ~6s               | Medio    |
| Deploy staging        | Critical | ~6s               | Medio    |
| Deploy production     | Full     | ~10s              | Alto     |
| Nightly               | Full     | ~10s              | Alto     |
| Manual                | Full     | ~10s              | Variable |

---

## Métricas de Éxito

### Objetivos a 3 meses

1. **Reducción de tiempo de feedback:**
   - PR checks: De N/A a <5 segundos
   - Main branch: De 8s a <7 segundos
   - Nightly: Mantener <15 segundos con suite en crecimiento

2. **Cobertura:**
   - Smoke: 2 tests críticos (login + CRUD básico)
   - Critical: 6-7 tests (flujos principales)
   - Full: 13+ tests (creciendo con features)

3. **Confiabilidad:**
   - Flakiness rate: <2%
   - False positives: <5%
   - Time to detect regression: <5 minutos (smoke), <10 minutos (critical)

4. **Costos:**
   - Reducción de 40% en minutos de CI por uso selectivo de suites
   - ROI: Detección temprana de bugs en PRs

---

## Mantenimiento y Evolución

### Criterios para agregar tests

**Smoke Tests:**

- Solo agregar si es crítico para el negocio
- Si falla, el sistema es inutilizable
- Máximo 5 tests en smoke suite

**Critical Tests:**

- Flujos que el 80% de usuarios ejecutan diariamente
- Features con alto impacto en revenue
- Máximo 15 tests en critical suite

**Full Suite:**

- Cualquier test válido puede agregarse
- Sin límite, pero monitorear tiempos totales

### Revisión trimestral

Cada 3 meses revisar:

1. Duración de cada suite
2. Tests que cambiaron de categoría (ej: feature nueva ahora es crítica)
3. Tests flaky que deben investigarse
4. Oportunidades de paralelización adicional

---

## Próximos Pasos (Implementation Plan)

### Fase 1: Tagging (1 hora)

- [ ] Agregar tags `@smoke` y `@critical` a tests existentes
- [ ] Validar que tags funcionan con `--grep`

### Fase 2: Configuración (30 min)

- [ ] Actualizar `playwright.config.ts` con 3 projects
- [ ] Agregar scripts NPM
- [ ] Documentar en README.md

### Fase 3: CI/CD (1 hora)

- [ ] Crear `pr-checks.yml` con smoke tests
- [ ] Actualizar workflow existente para critical en main
- [ ] Crear `nightly.yml` para full suite

### Fase 4: Validación (30 min)

- [ ] Ejecutar cada suite localmente
- [ ] Medir tiempos reales
- [ ] Ajustar workers si es necesario
- [ ] Validar en CI con PR de prueba

---

## Referencias

- [Playwright Test Projects](https://playwright.dev/docs/test-projects)
- [Playwright Test Tags](https://playwright.dev/docs/test-annotations#tag-tests)
- [Test Pyramid Pattern](https://martinfowler.com/articles/practical-test-pyramid.html)
- [CI/CD Best Practices](https://github.com/features/actions/best-practices)

---

**Autor:** Claude + Alberto Dimas
**Fecha:** 2025-10-08
**Versión:** 1.0
**Estado:** Propuesta para implementación
