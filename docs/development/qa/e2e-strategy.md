# Estrategia de Testing E2E

## Estado Actual (07-nov-2025)

### Métricas vigentes

- **Smoke (`pnpm test:e2e:smoke`):** 15 tests en 6 archivos (≈1.5 min con servers en frío). Cobertura: login, métricas PostHog, creación básica de servicios, acceso al calendario mensual y validaciones visuales rápidas.
- **Critical (`pnpm test:e2e:critical`):** 47 tests en 14 archivos (≈6.5 min). Incluye smoke + flujos completos de calendario (modal, drag&drop, filtros), staff assignment, portal cliente, exports CSV, dashboard y seguridad.
- **Full (`pnpm test:e2e:full`):** 91 tests en 15 archivos (≈11 min). Añade escenarios de regresión extendidos, validaciones de rate limit, estados vacíos, responsividad y suites de marketing/notifications.
- **Infra:** Cada corrida reconstruye API y Web en modo producción (`reuseExistingServer: false`) y ejecuta `pnpm db:push --force-reset && pnpm db:seed` para garantizar datos deterministas.

### Distribución por archivo (Full)

`analytics`, `auth`, `calendar.spec.ts`, `calendar-drag-drop.spec.ts`, `checkout`, `csv-export`, `dashboard`, `marketing`, `notifications`, `operations`, `portal-client`, `search-and-filters`, `security`, `staff-assignment`, `user-management`.

### Problemática actual

1. **Tiempo de feedback:** Critical tarda >6 min debido al rebuild completo (Next 16 + API). Smoke sigue siendo lo más rápido pero ya contiene 15 pruebas.
2. **Seeds especializados:** Algunas suites (calendar drag&drop, staff) dependen de seeds y helpers específicos; cualquier cambio en `db:seed` debe avisarse para no romper los tests.
3. **Rate limiting realista:** Aunque elevamos `LOGIN_RATE_LIMIT`, necesitamos monitorear que los encabezados `x-internal-remote-address` lleguen al API para habilitar Redis cuando esté disponible.
4. **Visibilidad:** Necesitamos documentar claramente qué cubre cada nivel para evitar duplicación de escenarios en futuras iteraciones.

---

## Estrategia Propuesta: Suite Piramidal

### Niveles de Testing

#### 1. **Smoke Tests** (~90s)

**Propósito:** Validación rápida de funcionalidad crítica del sistema

**Criterios de inclusión:**

- Login y autenticación básica
- Navegación principal funciona
- API responde correctamente
- Sin errores fatales en carga inicial

**Tests seleccionados (15 total / 6 archivos):**

- `analytics.spec.ts` – Inicialización PostHog con bandera headless
- `auth.spec.ts` – Login + redirección al panel
- `operations.spec.ts` – Creación rápida de servicios (valida API ↔ panel)
- `marketing.spec.ts` – Tabla comparativa y CTAs
- `calendar.spec.ts` – Acceso al calendario, navegación mensual, botón “Hoy”, leyenda y filtros
- `calendar-drag-drop.spec.ts` – Estados básicos (cursor grab, indicadores, estado de carga, vista semanal bloqueada)

**Ejecución:**

- **Cuándo:** Cada push a cualquier branch
- **Timeout:** 3 minutos (abarca build + pruebas)
- **Workers:** 1 (garantiza estabilidad con build compartida)

**Objetivo de tiempo:** < 2 minutos (build + pruebas). Actualmente 1.5 min en frío, ~60 s en caliente.

---

#### 2. **Critical Tests** (~6.5 min)

**Propósito:** Validación de flujos de negocio principales

**Criterios de inclusión:**

- Operaciones CRUD completas
- Flujos de autenticación completos (login + logout + persistencia)
- Validaciones de permisos básicas
- Casos de error comunes

**Cobertura (47 tests / 14 archivos):**

- Incluye todo Smoke +
- `calendar.spec.ts` completo (modal, filtros avanzados, permisos)
- `calendar-drag-drop.spec.ts` (drag&drop exitoso, preservación de hora, errores simulados)
- `checkout.spec.ts` – Flujo Payment Element listo para pago
- `csv-export.spec.ts` – Exportadores de bookings/customers/properties/services
- `dashboard.spec.ts` – KPIs, estados vacíos y responsividad
- `notifications.spec.ts` – SSE + acciones read/unread
- `portal-client.spec.ts` – Flujo completo enlace mágico
- `search-and-filters.spec.ts` – Buscador y filtros combinados
- `security.spec.ts` – Login negativos, rate limiting, permisos, sesión/log out
- `staff-assignment.spec.ts` – Asignar/desasignar staff y vistas específicas
- `user-management.spec.ts` – CRUD usuarios y restricciones

**Ejecución:**

- **Cuándo:**
  - Pull requests dirigidas a `main`
  - Push/merge a `main`
  - Deploys a staging / environments compartidos
- **Timeout:** 15 minutos (incluye build)
- **Workers:** 1 (para evitar duplicar builds simultáneos)

**Objetivo de tiempo:** mantenerla <7 min con servidores fríos y <5 min cuando la build está cacheada.

##### PostHog en navegadores headless

- Desde el 28-oct-2025 `PostHogAnalytics` crea un cliente _noop_ cuando detecta `navigator.webdriver` o user-agents de Lighthouse/Playwright. Esto marca `document.documentElement.dataset.brisaPosthog = "ready"` y resuelve `window.__brisaPostHogPromise`, incluso si no se envían eventos reales.
- Las pruebas que validan telemetría (ej. `analytics.spec.ts`) deben seguir comprobando el flag `data-brisa-posthog="ready"` en lugar de esperar el envío real de eventos.
- En entornos productivos/preview con navegadores “reales” seguimos capturando eventos; el fallback solo se activa para entornos automatizados.
- El preset remoto `tmp/playwright-preview.config.ts` ahora expone proyectos `smoke` y `critical`. Para ejecutar `critical` contra entornos desplegados se requiere un dataset semilla y tokens/bypass equivalentes a los usados en CI (headers `x-lhci-bypass`, cuentas QA, etc.). Sin estos permisos, las pruebas que crean/actualizan recursos (notificaciones, usuarios, portal cliente) fallarán al apuntar a producción.
- En local, exporta `E2E_LOGIN_RATE_LIMIT=100` (o mayor) antes de `pnpm test:e2e:critical` para evitar rate limits 429 generados por los múltiples logins automáticos. El `playwright.config.ts` propagará el valor tanto al API (`LOGIN_RATE_LIMIT`) como a las cabeceras de bypass.

---

#### 3. **Full Suite** (~11 min)

**Propósito:** Validación exhaustiva de todos los escenarios

**Criterios de inclusión:**

- Todos los tests disponibles
- Casos edge completos
- Validaciones exhaustivas de seguridad
- Rate limiting
- Validaciones de datos

**Cobertura:** 91 tests en 15 archivos (todos los anteriores + escenarios extendidos de dashboard, filtros vacíos, responsiveness, validaciones adicionales de seguridad y CSV, así como pruebas de marketing/notificaciones completas).

**Ejecución:**

- **Cuándo:**
  - Nightly builds (diario a las 2 AM)
  - Pre-release (antes de tags)
  - Deploys a production
  - Manualmente con `pnpm test:e2e:full`
- **Timeout:** 25 minutos (para cubrir build + tests)
- **Workers:** 2 (validado 07-nov-2025 con rate limiting elevado)

**Objetivo:** mantener <12 min totales (11 min actuales con seeds marketing/operativos).

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

### Datos sintéticos etiquetados y hooks de prueba

- **Taggea cada fixture.** `createBookingFixture` ahora acepta `notesTag` y `deleteAllBookings` recibe la misma etiqueta para limpiar sólo esos registros vía `/api/test-utils/bookings?tag=...`. Esto evita que un `beforeEach` de otra suite borre datos compartidos y cause 404/409 intermitentes.
- **Convenciones activas:** `CALENDAR_DND_NOTES_TAG = "[e2e-calendar-dnd]"` y `CALENDAR_NOTES_TAG = "[e2e-calendar]"` mantienen aislados los flujos mensuales/semanales. Sigue el mismo patrón (`[e2e-mi-suite]`) cuando crees nuevos fixtures.
- **Instrumentación condicionada:** cuando `PLAYWRIGHT_TEST_RUN="true"` (lo inyecta el config y puedes exportarlo manualmente si levantas la API para debugging local) el frontend:
  - Desactiva tours/onboarding que bloqueaban clicks (ej. `CalendarTour`).
  - Expone `window.__BRISA_TEST_RESCHEDULE__`, `__BRISA_REFRESH_COUNT__`, `__BRISA_LAST_STATUS__` y contadores visibles para que las specs comprueben refrescos.
  - Añade `data-testid` (`panel-calendar-grid`, `calendar-week-gridcell`, `calendar-booking-count`) y `statusMessage` asegurando que los `expect` se anclan a nodos deterministas.
- **Hook de refresco:** `useCalendar` admite `refreshToken`; las suites actualizan este valor cuando `router.refresh()` termina para garantizar que la UI vuelve con datos nuevos antes de continuar.
- Documenta cualquier etiqueta nueva o helper asociado en la suite correspondiente y enlaza esta sección en el PR para mantener el inventario bajo control.

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
    LOGIN_RATE_LIMIT: "100",
    LOGIN_RATE_LIMIT_WINDOW_MS: "60000",
  },
}
```

**Resultado (07-nov-2025):**

- ✅ Smoke suite: 15 tests / 6 archivos (≈90 s en frío, <60 s en caliente)
- ✅ Critical suite: 47 tests / 14 archivos (≈6.5 min con rebuild completo)
- ✅ Full suite: 91 tests / 15 archivos (≈11 min con seeds operativos/marketing)

**Mejora futura (opcional):**
Modificar el middleware de Next.js para propagar `x-forwarded-for` al backend, permitiendo usar el rate limiting real por IP.

### Reservas residuales en suites consecutivas

**Problema (nov-2025):** Tras endurecer la detección de doble booking, las suites completas que se ejecutaban en caliente podían dejar reservas activas con la misma propiedad/horario. El siguiente intento fallaba con `409 Conflict` aunque los tests seedearan nueva data.

**Solución aplicada:**

- `playwright.config.ts` ahora reinicia siempre API y Web en entornos locales (`reuseExistingServer: false`), evitando que queden procesos con datos en memoria entre corridas.
- El helper `createBookingFixture` reintenta hasta seis veces generando horarios futuros con desplazamientos aleatorios, de modo que incluso si persisten reservas anteriores, se selecciona un hueco libre.
- Cuando una suite requiera datos propios, debe pasar `notesTag` (ej. `[e2e-calendar-dnd]`) y limpiar con `deleteAllBookings(..., { notesTag })`, aprovechando el nuevo `?tag=` de `/api/test-utils/bookings`. Así mantenemos aisladas las corridas simultáneas (CI, local, nightly).
- Si se desea reutilizar servidores manualmente, ejecutar `pnpm --filter @brisa/api db:seed` (o borrar las reservas creadas) antes de relanzar la suite.

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
**Suite:** Smoke (15 tests, ~90 s + build)
**Propósito:** Feedback rápido en PRs validando funcionalidad crítica

**Configuración:**

- PostgreSQL 17
- LOGIN_RATE_LIMIT=100
- Chromium únicamente (disminuye el tiempo de instalación)
- Reporte Playwright subido solo en fallos

**Incluye:** lint, unit tests, typecheck y smoke E2E.

#### 2. Main Branch CI (`.github/workflows/ci.yml`)

**Trigger:** Push a `main`
**Suite:** Critical (47 tests, ~6.5 min con rebuild)
**Propósito:** Validar flujos principales después de merge

**Configuración:**

- PostgreSQL 17
- LOGIN_RATE_LIMIT=100 / window 60 s
- Builds productivos de API y Web (sin dev servers)
- Reporte Playwright en fallos

**Incluye:** verificación de secretos, lint, typecheck, unit/integration tests, build y suite critical.

#### 3. Nightly Full Suite (`.github/workflows/nightly.yml`)

**Trigger:**

- Cron diario a las 2:00 AM UTC
- Manual via `workflow_dispatch`

**Suite:** Full (91 tests, ~11 min)
**Propósito:** Cobertura completa incluyendo rate limiting y edge cases

**Configuración:**

- PostgreSQL 17
- LOGIN_RATE_LIMIT=100
- Chromium (el resto de navegadores no agregan cobertura en esta suite)
- Siempre adjunta reportes (retención 14 días)

**Incluye:** suite completa, upload de resultados y del reporte HTML.

---

## Matriz de Ejecución

| Evento           | Workflow      | Suite    | Tests | Duración aprox. | Trigger        |
| ---------------- | ------------- | -------- | ----- | --------------- | -------------- |
| PR a main        | pr-checks.yml | Smoke    | 15    | ~2 min          | `pull_request` |
| Push a main      | ci.yml        | Critical | 47    | ~6.5 min        | `push`         |
| Nightly / Manual | nightly.yml   | Full     | 91    | ~11 min         | `cron`/manual  |

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

1. **Tiempos objetivo realistas (con builds productivas):**
   - PR checks (smoke): mantener <2 min totales
   - Main branch (critical): estabilizar <6 min (optimizar watchers/build cache)
   - Nightly (full): mantener <12 min aun con crecimiento de la suite

2. **Cobertura mínima:**
   - Smoke: mantener login + calendario + creación servicio (no reducir)
   - Critical: conservar staff assignment, portal cliente y seguridad
   - Full: añadir nuevos módulos sólo cuando haya seeds estables documentados

3. **Confiabilidad:**
   - Flakiness rate <2% (registrar incidentes en `docs/operations/incident-runbook.md`)
   - Reincidencias deben abrir issue y, si aplica, añadir retry/fixtures específicos.
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
