# Estrategia de Testing E2E

## Estado Actual (Baseline)

### Métricas

- **Total de tests (`pnpm test:e2e:full`, 31-oct-2025):** 20
- **Duración total (full suite):** ~4.5 min con servers en frío (~3.8 min con servers en caliente)
- **Archivos:** 9 (`analytics`, `auth`, `checkout`, `marketing`, `notifications`, `operations`, `portal-client`, `search-and-filters`, `security`, `user-management`)
- **Ejecución:** Paralela (1 worker en local por defecto; CI usa 2 workers para smoke y 1 para critical/full debido a logística de build)
- **Distribución actual (31-oct-2025):**
  - `analytics.spec.ts`: 1 test (PostHog listo en entornos automatizados)
  - `auth.spec.ts`: 1 test (login operativo)
  - `checkout.spec.ts`: 1 test (flujo Payment Element)
  - `marketing.spec.ts`: 2 tests (tabla comparativa + métricas de mercado reales)
  - `notifications.spec.ts`: 1 test (panel notificaciones SSE)
  - `operations.spec.ts`: 3 tests (CRUD servicio, filtros, validaciones de datos)
  - `portal-client.spec.ts`: 1 test (flujo portal end-to-end)
  - `search-and-filters.spec.ts`: 4 tests (búsquedas combinadas en panel operativo)
  - `security.spec.ts`: 5 tests (negativos login, permisos, sesión)
  - `user-management.spec.ts`: 2 tests (creación y activación de usuarios)

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
- `marketing.spec.ts`:
  - "muestra tabla comparativa y CTAs instrumentados"
  - "muestra métricas de mercado con datos reales"

**Ejecución:**

- **Cuándo:**
  - Pull requests a `main`
  - Merges a `main`
  - Deploys a staging
- **Timeout:** 60 segundos
- **Workers:** 1-2 (limitado por build Next 16)

**Objetivo de tiempo:** < 4 minutos (incluye build Next 16 + arranque API)

##### PostHog en navegadores headless

- Desde el 28-oct-2025 `PostHogAnalytics` crea un cliente _noop_ cuando detecta `navigator.webdriver` o user-agents de Lighthouse/Playwright. Esto marca `document.documentElement.dataset.brisaPosthog = "ready"` y resuelve `window.__brisaPostHogPromise`, incluso si no se envían eventos reales.
- Las pruebas que validan telemetría (ej. `analytics.spec.ts`) deben seguir comprobando el flag `data-brisa-posthog="ready"` en lugar de esperar el envío real de eventos.
- En entornos productivos/preview con navegadores “reales” seguimos capturando eventos; el fallback solo se activa para entornos automatizados.
- El preset remoto `tmp/playwright-preview.config.ts` ahora expone proyectos `smoke` y `critical`. Para ejecutar `critical` contra entornos desplegados se requiere un dataset semilla y tokens/bypass equivalentes a los usados en CI (headers `x-lhci-bypass`, cuentas QA, etc.). Sin estos permisos, las pruebas que crean/actualizan recursos (notificaciones, usuarios, portal cliente) fallarán al apuntar a producción.
- En local, exporta `E2E_LOGIN_RATE_LIMIT=50` (o mayor) antes de `pnpm test:e2e:critical` para evitar rate limits 429 generados por los múltiples logins automáticos. El `playwright.config.ts` propagará el valor tanto al API (`LOGIN_RATE_LIMIT`) como a las cabeceras de bypass.

---

#### 3. **Full Suite** (~240-270s)

**Propósito:** Validación exhaustiva de todos los escenarios

**Criterios de inclusión:**

- Todos los tests disponibles
- Casos edge completos
- Validaciones exhaustivas de seguridad
- Rate limiting
- Validaciones de datos

**Tests incluidos:**

- 20 tests (smoke + critical + escenarios extendidos de seguridad, filtros, usuarios y portal)

**Ejecución:**

- **Cuándo:**
  - Nightly builds (diario a las 2 AM)
  - Pre-release (antes de tags)
  - Deploys a production
  - Manualmente con `pnpm test:e2e:full`
- **Timeout:** 120 segundos
- **Workers:** 1-2 (para evitar condiciones de carrera con seeds y rate limits)

**Objetivo de tiempo:** < 5 minutos (servidores en frío) / < 4 minutos (servidores en caliente)

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

### Playwright con builds de producción (oct-2025)

**Contexto:** en GitHub Actions los comandos `pnpm --filter @brisa/api dev` y `pnpm --filter @brisa/web dev` se veían afectados por ports aleatorios (cuando 3000/3001 estaban ocupados) y por watchers que quedaban colgados tras los tests. El resultado era una suite `critical` inestable y pipelines que terminaban en timeout.

**Ajustes aplicados:**

- Antes de lanzar Playwright se ejecuta:

  ```bash
  pnpm db:push --force-reset && pnpm db:seed \
    && pnpm --filter @brisa/api build && pnpm --filter @brisa/api start
  ```

  y de forma análoga para la web (`pnpm --filter @brisa/web build && pnpm --filter @brisa/web start`).

- Se respetan los nuevos puertos configurables mediante `API_PORT` y `WEB_PORT` (por defecto 3001/3000).
- `PLAYWRIGHT_BASE_URL` debe apuntar al host/puerto real (habitualmente `http://localhost:3000`).

**Resultado (19-oct-2025):**

- 🚀 Arranque determinista de los servidores en CI (sin fallback a 3002/3100).
- ✅ Suites críticas estables tanto en local como en Actions.
- 📄 Procedimiento documentado en `docs/operations/runbook-daily-monitoring.md` (sección Analytics) y reforzado con los scripts `pnpm posthog:test-event` / `pnpm sentry:test-event`.

### Estabilidad del panel de notificaciones (oct-2025)

**Problema:** La nightly `full` fallaba de forma intermitente porque el panel de notificaciones refrescaba la lista antes de que el backend confirmara el `PATCH /api/notifications/:id/read`, dejando ítems “fantasma” en la UI.

**Solución (commit 17-oct-2025):**

- Bloquear la UI mientras se procesa `markNotificationReadAction` (`pendingNotificationId`).
- Evitar que el usuario aplique filtros o “Marcar todas” hasta que la operación actual termine.
- Ignorar respuestas de paginación obsoletas en `usePaginatedResource` mediante un token por petición.

**Resultado:** Nightly Playwright `full` en verde; suite crítica estable con SSE + filtros simultáneos.

---

### Validación de error boundaries del checkout (oct-2025)

**Objetivo:** Asegurar que fallos inesperados en el checkout público (Stripe.js, Payment Element, intent API) no rompan la experiencia y generen telemetría accionable.

**Implementación:**

- `apps/web/app/checkout/error.tsx` captura cualquier excepción de la ruta y muestra un fallback accesible con botones de reintento, contacto por correo/teléfono y detalles técnicos.
- Logging dual:
  - Sentry (`captureException` con tags `component=checkout`, `boundary=checkout-error-boundary`).
  - PostHog (`recordCheckoutEvent` con eventos `checkout_error_boundary_triggered` y `checkout_error_boundary_retry`).
- Prevención de loops infinitos: máximo 3 reintentos en una ventana de 10s (el botón se deshabilita si se supera).
- Boundary interno en el Payment Element (`PaymentElementErrorBoundary`) que notifica al boundary principal ante errores de renderizado.

**Unit tests:** `apps/web/app/checkout/error.test.tsx`

- ✅ Render del fallback con mensaje amable y accesible.
- ✅ Botón "Reintentar carga" llama a `reset()` (hasta 3 veces).
- ✅ Deshabilita el botón tras exceder el límite.
- ✅ Verifica logging en Sentry y PostHog mediante mocks.

**Checklist manual posterior a deploy:**

1. **Fallo en intent:** desconectar red antes de “Continuar con pago” → debe mostrarse el fallback y permitir reintentar tras reconectar.
2. **Stripe bloqueado:** bloquear `js.stripe.com` en DevTools → el boundary debe activarse, registrar error y permitir contacto con soporte.
3. **Errores persistentes:** intentar reintentar 4 veces seguidas → botón deshabilitado con mensaje “Límite de reintentos alcanzado”.
4. **Telemetría:** confirmar en Sentry (proyecto web) y PostHog que se registraron los eventos con el digest del error.

**Cobertura en CI:**

- Los unit tests se ejecutan en PR checks y en la pipeline principal (`pnpm --filter @brisa/web test`).
- No se automatiza en Playwright por la dificultad de simular fallas de Stripe; se documenta checklist manual para QA.

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
