# Estrategia de Testing E2E

## Estado Actual (Baseline)

### Métricas

- **Total de tests:** 27
- **Duración total (full suite):** ~95 segundos (incluye boot de servidores)
- **Archivos:** 8 (`auth`, `checkout`, `notifications`, `operations`, `portal-client`, `search-and-filters`, `security`, `user-management`)
- **Ejecución:** Paralela (workers ilimitados en local; 2 workers en CI para smoke, 2 críticos, 2 full)
- **Distribución actual (17-oct-2025):**
  - `auth.spec.ts`: 1 test (login operativo)
  - `checkout.spec.ts`: 1 test (flujo Payment Element)
  - `notifications.spec.ts`: 1 test (panel de notificaciones con SSE)
  - `operations.spec.ts`: 4 tests (CRUD servicios + paginación reservas)
  - `portal-client.spec.ts`: 1 test (flujo portal cliente end-to-end)
  - `search-and-filters.spec.ts`: 5 tests (búsquedas combinadas en panel operativo)
  - `security.spec.ts`: 9 tests (negativos login, rate limiting, sesión)
  - `user-management.spec.ts`: 5 tests (alta, actualización y activación de usuarios)

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

**Objetivo de tiempo:** < 30 segundos (incluye arranque de Next.js + API)

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
- `checkout.spec.ts`: "carga el checkout público y muestra flujo listo para pago"

**Ejecución:**

- **Cuándo:**
  - Pull requests a `main`
  - Merges a `main`
  - Deploys a staging
- **Timeout:** 60 segundos
- **Workers:** 4

**Objetivo de tiempo:** < 60 segundos (boot + 17 pruebas)

---

#### 3. **Full Suite** (~90-100s)

**Propósito:** Validación exhaustiva de todos los escenarios

**Criterios de inclusión:**

- Todos los tests disponibles
- Casos edge completos
- Validaciones exhaustivas de seguridad
- Rate limiting
- Validaciones de datos

**Tests incluidos:**

- 27 tests (smoke + critical + escenarios extendidos de seguridad, filtros, usuarios y portal)

**Ejecución:**

- **Cuándo:**
  - Nightly builds (diario a las 2 AM)
  - Pre-release (antes de tags)
  - Deploys a production
  - Manualmente con `pnpm test:e2e:full`
- **Timeout:** 120 segundos
- **Workers:** 6-8 (máximo paralelismo)

**Objetivo de tiempo:** < 110 segundos (máximo tolerable con servers en caliente)

---

## Implementación Técnica

### Tags en Playwright

Utilizaremos el sistema de tags de Playwright para categorizar tests:

```typescript
test("permite iniciar sesión y acceder al panel operativo @smoke @critical", async ({
  page,
}) => {
  // ...
});

test("combina búsqueda y estado en reservas mostrando los filtros activos @critical", async ({
  page,
}) => {
  // ...
});

test("pagina reservas correctamente", async ({ request }) => {
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

**Problema (sep-2025):** Al ejecutar la suite `critical` con 7 workers paralelos, los tests fallaban con error "No se pudo iniciar sesión".

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
    LOGIN_RATE_LIMIT: "20",
    LOGIN_RATE_LIMIT_WINDOW_MS: "60000",
  },
}
```

**Resultado (actualizado 17-oct-2025):**

- ✅ Critical suite: 17 tests en 8 archivos (≈60s)
- ✅ Full suite: 27 tests en 8 archivos (≈95s)
- ✅ Smoke suite: 2 tests (≈25s)

**Mejora futura (opcional):**
Modificar el middleware de Next.js para propagar `x-forwarded-for` al backend, permitiendo usar el rate limiting real por IP.

### Estabilidad del panel de notificaciones (oct-2025)

**Problema:** La nightly `full` fallaba de forma intermitente porque el panel de notificaciones refrescaba la lista antes de que el backend confirmara el `PATCH /api/notifications/:id/read`, dejando ítems “fantasma” en la UI.

**Solución (commit 17-oct-2025):**

- Bloquear la UI mientras se procesa `markNotificationReadAction` (`pendingNotificationId`).
- Evitar que el usuario aplique filtros o “Marcar todas” hasta que la operación actual termine.
- Ignorar respuestas de paginación obsoletas en `usePaginatedResource` mediante un token por petición.

**Resultado:** Nightly Playwright `full` en verde; suite crítica estable con SSE + filtros simultáneos.

---

## Integración CI/CD

### GitHub Actions Workflows Implementados

#### 1. PR Checks (`.github/workflows/pr-checks.yml`)

**Trigger:** Pull requests a `main`
**Suite:** Smoke (2 tests, ~7s)
**Propósito:** Feedback rápido en PRs validando funcionalidad crítica

**Configuración:**

- PostgreSQL 17
- LOGIN_RATE_LIMIT=20
- Solo instala Chromium
- Sube reporte de Playwright solo en fallos

**Incluye:**

- ✅ Lint
- ✅ Unit tests
- ✅ Smoke E2E tests

#### 2. Main Branch CI (`.github/workflows/ci.yml`)

**Trigger:** Push a `main`
**Suite:** Critical (7 tests, ~8s)
**Propósito:** Validar flujos principales después de merge

**Configuración:**

- PostgreSQL 17
- LOGIN_RATE_LIMIT=20
- Instala todos los browsers de Playwright
- Sube reporte solo en fallos

**Incluye:**

- ✅ Verificación de secretos
- ✅ Lint
- ✅ Typecheck
- ✅ Unit tests
- ✅ Critical E2E tests
- ✅ Build de producción

#### 3. Nightly Full Suite (`.github/workflows/nightly.yml`)

**Trigger:**

- Cron diario a las 2:00 AM UTC
- Manual via `workflow_dispatch`

**Suite:** Full (13 tests, ~8s)
**Propósito:** Cobertura completa incluyendo rate limiting y edge cases

**Configuración:**

- PostgreSQL 17
- LOGIN_RATE_LIMIT=20
- Solo Chromium
- Sube reportes siempre (14 días retención)

**Incluye:**

- ✅ Full E2E suite
- ✅ Upload de test results
- ✅ Upload de Playwright report

---

## Matriz de Ejecución

| Evento           | Workflow      | Suite    | Tests | Duración | Trigger      |
| ---------------- | ------------- | -------- | ----- | -------- | ------------ |
| PR a main        | pr-checks.yml | Smoke    | 2     | ~7s      | pull_request |
| Push a main      | ci.yml        | Critical | 7     | ~8s      | push         |
| Nightly / Manual | nightly.yml   | Full     | 13    | ~8s      | cron/manual  |

### Beneficios de la Estrategia

**Feedback Rápido:**

- PRs obtienen validación en ~7s (solo smoke)
- Reduce tiempo de espera para developers

**Validación Robusta:**

- Main branch ejecuta critical suite (7 tests)
- Cubre flujos principales de negocio

**Cobertura Completa:**

- Full suite nocturna detecta regresiones
- Incluye tests de rate limiting y edge cases

**Optimización de Recursos:**

- Solo Chromium en smoke/nightly (más rápido)
- Todos los browsers en CI main (más cobertura)

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
