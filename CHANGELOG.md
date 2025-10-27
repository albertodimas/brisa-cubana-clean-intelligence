# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html) where applicable.

## [Unreleased]

### Added

- Hero comercial con imagen aprobada por marketing y sección portal actualizada con assets finales (`apps/web/app/page.tsx`, `public/images/landing/*`).
- Prueba Playwright `analytics.spec.ts` que verifica la inicialización de PostHog desde la landing pública.
- Scripts de verificación `pnpm posthog:test-event` y `pnpm sentry:test-event` para validar ingestión y alertas desde la CLI.
- Wrapper `SpeedInsightsClient` que omite la carga de Speed Insights en corridas Lighthouse (`apps/web/components/analytics/speed-insights-client.tsx`).
- Archivo `.browserslistrc` para forzar targets modernos en la app web.
- Verificación automatizada de `robots.txt`/`sitemap.xml` en el workflow compuesto (`.github/workflows/project-pipeline.yml`).
- Script `scripts/verify-lhci-warnings.sh` para controlar el allowlist de advertencias Lighthouse dentro de CI.

### Changed

- Middleware público ahora permite acceder a `/` sin autenticación para exponer la landing en producción (`apps/web/middleware.ts`).
- Configuración Playwright propaga `NEXT_PUBLIC_POSTHOG_KEY`/`HOST` por defecto en entornos de prueba.
- Suite Playwright crítica ahora usa builds de producción (`pnpm build && pnpm start`) para API y web, con puertos configurables (`API_PORT`, `WEB_PORT`) y `PLAYWRIGHT_BASE_URL` definido.
- Test de seguridad `gestiona sesión (persistencia y logout)` refactorizado con selectores específicos, timeouts explícitos y sincronización `Promise.all`, eliminando cuelgues en CI (`tests/e2e/security.spec.ts`).
- Workflows (`project-pipeline.yml`, `ci.yml`, `pr-checks.yml`, `nightly.yml`) reenvían `NEXT_PUBLIC_POSTHOG_*` a la acción compuesta para estabilizar la verificación `analytics.spec.ts` en CI.
- `apps/web` integra `@sentry/nextjs` (`sentry.*.config.ts` y `withSentryConfig`) con tasas de muestreo configurables desde entorno.
- Cliente analítico migra a `posthog-js-lite`, deshabilitando carga en entornos Lighthouse y exponiendo `window.__brisaPostHogPromise` compartido (`apps/web/components/analytics/posthog-analytics.tsx`, `apps/web/lib/marketing-telemetry.ts`).
- Middleware permite acceso público a `robots.txt`/`sitemap.xml` y el pipeline principal levanta `next start` para validarlos tras el build.

### Docs

- `docs/product/phase-2-roadmap.md` y `docs/product/analytics-decision.md` actualizados con el estado de la integración PostHog y el plan de rotación de claves.
- `docs/operations/observability.md`, `docs/operations/runbook-daily-monitoring.md` y `docs/operations/alerts.md` ahora incluyen los nuevos scripts y pasos de verificación para alertas PostHog/Sentry.
- `docs/operations/observability-setup.md` documenta la creación de reglas Sentry (correo) y próximos pasos para Slack.
- `docs/qa/e2e-strategy.md` documenta el uso de builds de producción y las variables `API_PORT`/`WEB_PORT`/`PLAYWRIGHT_BASE_URL` para entornos locales y CI.
- `docs/overview/status.md` registra la verificación del 27-oct-2025 y la resiliencia del cliente PostHog.
- `docs/operations/deployment.md` amplía la verificación post-deploy con Lighthouse y robots, y `docs/operations/observability.md` documenta el bypass `/?lhci=1` más el playbook de alertas PostHog.
- `docs/operations/incident-2025-10-20-vercel-deployment-failure.md` documenta el incidente con Vercel (`temporary_failure` en `patchBuild`) y su resolución (21-oct-2025 01:30 UTC, despliegues Ready de web y API).

## [0.4.1] - 2025-10-18

### Added

- Landing hero relanzado con copy comercial, secciones de FAQ y planes (`apps/web/components/landing`) enlazado con telemetría dedicada.
- Formulario de captura de leads con webhook documentado, script CLI (`scripts/test-lead-webhook.sh`) y eventos de marketing centralizados.
- Panel operativo accesible vía `/panel` con layout dedicado, fallback de carga y credenciales sembradas para el CI.

### Changed

- `apps/web/app/page.tsx` y `checkout-client.tsx` envían cobertura analítica adicional para compras y enlaces de marketing.
- `apps/web/components/admin-panel.tsx` y `panel/page.tsx` reorganizados para hidratar datos de manera progresiva y ofrecer estados de error más claros.
- Workflows de CI/CD reciben seeds operativos por ambiente para mantener pruebas E2E consistentes.

### Testing

- Helper Playwright asegura que los flujos de login redirigen correctamente al panel (`tests/e2e/support/auth.ts`).
- Suite landing (`apps/web/app/page.test.tsx`) actualizada con asserts para la nueva experiencia de marketing y enlaces de seguimiento.

### Docs

- `docs/operations/deployment.md` registra la rotación Stripe en vivo y la guía para probar el webhook de leads.
- `docs/operations/observability.md`, `docs/overview/status.md` y reportes QA documentan la cobertura de analítica y el lanzamiento comercial.

## [0.4.0] - 2025-10-18

### Added

- Checkout público (`/checkout`) con formulario multipaso, integración Stripe Payment Element y fallback de configuración.
- Endpoint `POST /api/payments/stripe/intent` para generar PaymentIntent con metadatos de servicio y cliente.
- Ruta Next `/api/checkout/intent` como proxy seguro hacia la API y test E2E `checkout.spec.ts`.
- Portal cliente: landing y dashboard beta estilizados, componentes compartidos (`PortalStatCard`, `PortalBookingCard`, `PortalTimelineItem`, `PortalCallout`) y flujo de enlace mágico (`/api/portal/auth/request`, `/verify`).
- Envío de enlaces mágicos vía SMTP configurable (`PORTAL_MAGIC_LINK_*`) con plantilla HTML y logs dedicados.
- Endpoint `GET /api/portal/bookings` protegido por `portal_token` para exponer reservas y metadatos del cliente.
- Endpoint `POST /api/portal/auth/logout` para invalidar sesiones y limpiar cookies del portal cliente.
- Frontend portal guarda la sesión en la cookie httpOnly `portal_token`, añade redirecciones seguras, botón de cierre de sesión y telemetría (`portal.link.requested`, `portal.link.verify`, `portal.logout`).
- Dashboard del portal hidrata datos iniciales con SWR (`/api/portal/bookings`) y ofrece refresco manual con indicadores de estado.
- Política de divulgación responsable en `SECURITY.md` y `docs/README.md` con el enlace al índice.
- Roadmap Fase 2 (`docs/product/phase-2-roadmap.md`) para landing comercial, checkout público y portal cliente.
- Suite Playwright `tests/e2e/search-and-filters.spec.ts` con cobertura crítica para búsqueda, filtros combinados y mensajes sin resultados.
- Seeds operativos (`prisma/seed.operativo.ts`) y demo (`prisma/seed.demo.ts`) con comandos `pnpm --filter @brisa/api db:seed:operativo` y `db:seed:demo` documentados en quickstart/despliegue.
- Webhook `/api/payments/stripe/webhook` con verificación de firma y pruebas de integración sobre Stripe modo test.
- Portal cliente expone callout de expiración de sesión con contador visible y CTA para renovar acceso; la API entrega `session.expiresAt` en `/api/portal/bookings`.
- Backend del portal responde con `Set-Cookie` para `portal_token` (HttpOnly) y `portal_customer_id` tras verificar enlaces mágicos; utilidades compartidas para formatear/medir expiración (`apps/web/lib/portal-session.ts`) con pruebas unitarias.
- Endpoints `POST /api/portal/bookings/:id/cancel` y `POST /api/portal/bookings/:id/reschedule` para autoservicio de clientes, con logs y validación de pertenencia.
- Suite Playwright `tests/e2e/portal-client.spec.ts` que cubre solicitud de enlace, verificación, dashboard, reagendado, cancelación y logout.
- Notificaciones operativas automáticas cuando un cliente cancela o reagenda desde el portal (tipo `BOOKING_CANCELLED`/`BOOKING_RESCHEDULED`).
- Página `/clientes/[customerId]/reservas/[bookingId]` para detalle de reserva con timeline, acciones y CTA de soporte.

### Changed

- README y `docs/overview/status.md` actualizados con el run CI `18542267689`, la estandarización en Node.js 22.13.0 y el alcance real del release `v0.3.0` (búsqueda/filtros).
- `scripts/verify-doc-structure.sh` exige `SECURITY.md` y la nueva documentación de producto para mantener la verificación.
- Workflow `nightly.yml` ahora ejecuta Lighthouse CI sobre la URL de Vercel, alineado con `.lighthouserc.preview.json` y los budgets documentados.
- Eliminada la ruta `/api/authentication/verify` del OpenAPI para reflejar la implementación actual.
- Documentación actualizada (`docs/product/rfc-public-components.md`, `docs/operations/deployment.md`, `docs/operations/security.md`, `docs/overview/status.md`) con wireframes, rotación Stripe y seguimiento de checkout.
- `docs/qa/regression-checklist.md` incorpora el flujo del portal (cookies, endpoint de reservas) para smoke tests manuales.
- `docs/operations/security.md` documenta cookies `portal_token`/`portal_customer_id` y el endpoint de logout.
- `POST /api/portal/auth/request` envía correo real cuando SMTP está configurado y deja de exponer el `debugToken` en producción (`PORTAL_MAGIC_LINK_EXPOSE_DEBUG=false`).
- `docs/operations/security.md`, `docs/product/rfc-public-components.md`, `docs/overview/status.md` y `docs/qa/regression-checklist.md` actualizados con validaciones de expiración de sesión y nuevos escenarios QA.
- Portal dashboard incorpora skeletons, CTA enriquecidos y acciones inline con mensajes accesibles para reagendar/cancelar reservas.

### Fixed

- Dependabot alert `GHSA-52f5-9888-hmc6` resuelta fijando `tmp@0.2.5` vía override pnpm.
- Componente `SearchBar` con debounce interno y botón de limpieza reutilizado en servicios, propiedades, reservas y clientes (`apps/web/components/ui/search-bar.tsx`).
- Componente `FilterChips` para visualizar y limpiar filtros activos en los paneles operativos.
- Nuevas pruebas unitarias (SearchBar, FilterChips, managers y `usePaginatedResource`) elevan la suite web a 60 tests.
- Panel de notificaciones bloquea acciones mientras procesa lectura, evita filtros concurrentes y descarta respuestas obsoletas (`notification-bell.tsx`, `usePaginatedResource`), estabilizando la nightly Playwright `full`.

### Updated

- Endpoints `/api/services`, `/api/properties`, `/api/bookings`, `/api/customers` y `/api/users` soportan parámetros `search` y filtros combinables manteniendo paginación cursor-based.
- `usePaginatedResource` expone `currentQuery`, `resetQuery` y normaliza queries para evitar resets innecesarios.
- Documentación actualizada (`README`, `docs/overview/status.md`, `docs/product/pagination.md`, `docs/decisions/search-filters-plan.md`, `docs/reference/*`) para reflejar la Fase 2 de búsquedas y filtros.
- El panel de usuarios (`AdminPanel`) ahora integra `UsersManager` con búsqueda debounced, filtros por rol/estado y chips visuales.
- `docs/overview/status.md` y `docs/qa/e2e-strategy.md` reflejan 27 pruebas Playwright (smoke/critical/full), el fallo nightly 18581096720 y la mitigación del panel de notificaciones (17-oct-2025).

### Testing

- `pnpm --filter @brisa/web test` (66 pruebas) ✅
- `pnpm --filter @brisa/api test` (95 pruebas) ✅

## [0.3.1] - 2025-10-17

### Added

- Guía operativa del portal cliente (`docs/guides/portal-client.md`) con prerrequisitos, flujos y checklist de QA.
- Reporte de accesibilidad del portal (`docs/qa/portal-accessibility.md`) y placeholders iniciales en `docs/assets/public-components/` para capturas de Fase 2.

### Changed

- Migración completa a Tailwind CSS 4.1.0 (`apps/web`): dependencias actualizadas, `@config "../tailwind.config.ts"`, `tailwind.config.ts` simplificado y adopción de `@tailwindcss/postcss`.
- Eliminado `autoprefixer` como dependencia directa; PostCSS se apoya en el plugin oficial de Tailwind v4.
- Documentación actualizada (README, `docs/overview/status.md`, `docs/decisions/tailwind-v4-plan.md`, `docs/decisions/dependency-updates.md`, `docs/decisions/tailwind-v4-deferral.md`) para reflejar la migración y nuevos artefactos.

### Testing

- `pnpm docs:verify`
- `pnpm --filter @brisa/web build`

## [0.3.0] - 2025-10-14

### Added

- Componente UI `Pagination` (`apps/web/components/ui/pagination.tsx`) con botón “Cargar más”, contador de elementos mostrados y mensaje final.
- Prueba unitaria dedicada del componente y nuevas coberturas para los managers (`services`, `properties`, `bookings`, `customers`).

### Changed

- Panel operativo muestra controles de paginación visibles en servicios, propiedades, reservas y clientes, con loaders esqueléticos durante refresh.
- `AdminPanel` reutiliza `usePaginatedResource` para sincronizar datos tras altas/actualizaciones y mantener la paginación consistente.
- Documentación actualizada (`docs/product/pagination.md`, `docs/overview/status.md`, README) para reflejar la UI de paginación y nuevos conteos de pruebas.

### Testing

- `pnpm --filter @brisa/web test` (Vitest, 44 pruebas) ✔️
- `pnpm test:e2e:smoke` (Playwright) ✔️

## [0.2.9] - 2025-10-14

### Added

- Suite completa de tests E2E para gestión de usuarios (`tests/e2e/user-management.spec.ts`) con 5 casos críticos.
- Plan de implementación de búsqueda y filtros documentado (`docs/decisions/search-filters-plan.md`, Fase 6).

### Changed

- Suite E2E expandida: 19 tests totales (2 smoke, ~8 critical, 19 full).
- Optimizaciones E2E: token compartido de admin, IPs únicas, selectores refinados.
- Documentación sincronizada con nueva Fase 6 (búsqueda/filtros) en roadmap.

### Testing

- +5 pruebas E2E en `user-management.spec.ts` (crear, actualizar rol, activar/desactivar, guards).
- Optimización de suite crítica para evitar rate limiting y mejorar estabilidad.
- Total: **129 tests unitarios/integración + 19 tests E2E = 148 tests totales**.

## [0.2.8] - 2025-10-14

### Added

- Endpoints `DELETE` para propiedades, reservas y usuarios (soft delete) con pruebas de integración y actualización de OpenAPI/Scalar.
- Validación de cuentas desactivadas en `POST /api/authentication/login` (respuesta 403).
- Nueva cobertura documental para el plan de migración Tailwind v4 (`docs/decisions/tailwind-v4-plan.md`).

### Changed

- Versiones `@brisa/api`, `@brisa/web` y monorepo actualizadas a 0.2.8.
- CORS habilitado para métodos `DELETE` en la API.
- OpenAPI `info.version`, README y overview sincronizados con el release `v0.2.8`.

### Testing

- +5 pruebas Vitest en `app.integration.test.ts` (soft delete y guardas de autenticación), totalizando **129** tests unitarios/integración.

## [0.2.6] - 2025-10-14

### Added

- Nueva entrada en `docs/operations/backup-log.md` con verificación local de `scripts/verify-backup.sh` (14/oct/2025).

### Changed

- Sincronizado el índice maestro de documentación (`docs/README.md`) y el README raíz con enlaces por dominio.
- Actualizados los manuales de seguridad, quickstart y archivos `.env` para usar PostgreSQL local en `localhost:5433`.
- Referencia API revisada para reflejar endpoints vigentes (incluye `DELETE /api/services/:id`) y eliminar secciones aspiracionales.
- Versiones internas `@brisa/api` y `@brisa/web` alineadas a 0.2.6 para mantener semver homogéneo.

### Fixed

- `pnpm docs:verify` vuelve a pasar tras restaurar la estructura esperada y alinear fechas de revisión (14/oct/2025).
- Checklist de regresión ahora cubre el flujo de eliminación de servicios con soft delete.

### Infrastructure

- **Phase 1:** paquetes de producción actualizados con cambios seguros (`next` 15.5.5, `hono` 4.9.12, `pino-pretty` 13.1.2) manteniendo pipelines verdes.
- **Phase 2:** stack de testing/desarrollo actualizado (`@testing-library/react` 16.3.0 + `@testing-library/dom`, `@types/node` 24.7.2, `eslint-config-next` 15.5.5).
- **Phase 3:** Prisma Client 6.17.1 y bcryptjs 3.0.2 integrados en API, regenerando cliente y verificando suites existentes.
- **Phase 4:** Zod migrado a 4.1.12 con actualización de `required_error` → `message` en validaciones de API (PR #39).

## [0.2.5] - 2025-10-12

### Added

- Shared libraries para manejo de errores, serialización y autenticación E2E:
  - `apps/api/src/lib/prisma-error-handler.ts`
  - `apps/api/src/lib/serializers.ts`
  - `tests/e2e/support/auth.ts`
- Repository pattern completo en la API:
  - `property-repository.ts`, `user-repository.ts`, `customer-repository.ts`
  - Nuevas suites unitarias (10 tests) para los repositories
- Validación automática de contratos OpenAPI incorporada en `app.integration.test.ts`
- Escenario Playwright crítico que valida la creación inválida de servicios

### Changed

- Rutas de negocio refactorizadas para delegar en repositories y helpers compartidos:
  - `routes/services.ts`, `routes/bookings.ts`, `routes/properties.ts`, `routes/users.ts`, `routes/customers.ts`
- Playwright crítico (`auth.spec.ts`, `operations.spec.ts`, `security.spec.ts`) ahora reutiliza storage state persistente
- Documentación actualizada con 92 pruebas unitarias/integración (91 API + 1 Web)
- Improved web proxy error handling and session management

### Fixed

- Eliminated additional 30 lines of duplicate code from `users.ts`
- Improved type safety in booking serialization with nested relations
- Stabilized E2E authentication with IP-based rate limiting avoidance

## [0.2.4] - 2025-10-12

### Added

- 6 shared utility libraries to eliminate code duplication:
  - `apps/web/lib/types.ts`: Centralized TypeScript types (PaginatedResult, User, Service, Property, Booking, Customer)
  - `apps/web/lib/api-client.ts`: Reusable HTTP client with consistent error handling
  - `apps/web/hooks/use-update-handler.ts`: Custom hook for handling updates with debounce and toast notifications
  - `apps/api/src/lib/pagination.ts`: Shared cursor-based pagination logic
  - `apps/api/src/lib/validation.ts`: Common Zod validation schemas
  - `apps/api/src/lib/bcrypt-helpers.ts`: Password hashing utilities

### Changed

- Refactored 10 files to use shared libraries, eliminating 450+ lines of duplicate code:
  - `apps/web/app/actions.ts`: Extracted API client logic and types
  - `apps/api/src/routes/services.ts`, `properties.ts`, `users.ts`: Migrated to shared pagination
  - `apps/web/components/*-manager.tsx`: Using shared hooks and types
- Updated documentation to reflect new architecture and test counts (56 tests total: 55 API + 1 Web)

### Fixed

- Achieved 60% reduction in code duplication across the codebase
- Improved maintainability with single source of truth for pagination, validation, and API client logic
- All 56 tests passing with 0 lint errors and 0 type errors

## [0.2.3] - 2025-10-11

### Added

- `BookingsManager` con paginación real y botón "Cargar más" para las reservas del panel operativo, reutilizando los nuevos tokens de diseño (`ui-field`, `ui-input`, `ui-panel-surface`).
- Workflow `post-deploy-seed.yml` que sincroniza el esquema y ejecuta el seed de producción tras cada merge exitoso en `main`.

### Changed

- Refactor del módulo `@/lib/api` para devolver resultados paginados (`fetchBookingsPage`, `fetchServicesPage`, etc.) y exponer `PaginatedResult` y `PaginationInfo`.
- Reorganización del panel de reservas para consumir la API paginada, con filtros que actualizan los datos en el backend en lugar de hacerlo en memoria.
- Documentación de despliegue actualizada con la automatización post-deploy y tokens UI documentados en el handbook.

### Removed

- Uso del componente `InfiniteList` en el panel operativo; la paginación ahora depende de la API.

## [0.2.2] - 2025-10-11

### Added

- Domain-based documentation layout (`docs/guides`, `docs/operations`, `docs/product`, `docs/qa`, `docs/reference`, `docs/overview`, `docs/archive`) with a curated handbook index.
- Operational manuals for deployment (`docs/operations/deployment.md`) and backup logging (`docs/operations/backup-log.md`).
- `scripts/verify-doc-structure.sh` and the `pnpm docs:verify` command, integrated into the reusable CI pipeline to block regressions in documentation structure.

### Changed

- Updated references across the repository (README, status report, regression checklist, API reference) to point to the new verified documentation paths and correct access scopes.

### Removed

- Legacy markdown files at the root of `docs/` and outdated references to deprecated filenames.

## [0.2.1] - 2025-10-11

### Added

- Reusable GitHub Actions workflow (`project-pipeline.yml`) that standardizes checkout, dependency installation, Prisma preparation, linting, type checking, unit tests, build, and Playwright execution across PR, main, and nightly runs.
- Composite Action `.github/actions/setup-project` to configure Node.js, pnpm, Prisma, Playwright, and runtime environment variables with consistent fallbacks.
- Security automation with dedicated `codeql.yml` (push/PR/scheduled static analysis) and `dependency-review.yml` (PR dependency diff scanning).

### Changed

- Updated `ci.yml`, `pr-checks.yml`, and `nightly.yml` to consume the reusable pipeline, enabling secret scanning, database preparation toggles, and conditional Playwright artifact uploads without duplicated YAML.
- Refreshed `docs/overview/status.md` to describe the new workflow topology, CodeQL coverage, and dependency review gate.

### Removed

- Duplicate workflow steps for pnpm setup, Prisma generation, environment variable exporting, and repeated build commands in individual workflows.

## [Unreleased]

### Added

- Documento `docs/operations/env-sync.md` con los comandos para alinear `PROXY_ALLOWED_ORIGINS`, retirar `API_TOKEN` y controlar la bandera de debug de enlaces mágicos en todos los entornos.
- Guía `docs/qa/portal-magic-link-testing.md` para QA segura del portal usando SMTP sandbox o flags locales controladas.

### Changed

- Endurecido el middleware de autenticación y las rutas críticas (`/api/bookings`, `/api/properties`, proxy `/app/api/*`) para requerir JWT y restringir CORS, actualizando los tests de integración correspondientes.
- Restaurado `apps/api/pnpm-lock.yaml` y ajustado `apps/api/vercel.json` para que Vercel construya la API usando `pnpm install --frozen-lockfile` + `pnpm run build` desde el workspace.
- Desplegada nuevamente la API (`brisa-cubana-clean-intelligence-pypq2bql1`) y reasignado `api.brisacubanacleanintelligence.com` al nuevo deployment tras validar `/health`.

### Removed

- Variable `API_TOKEN` y dependencias asociadas en Vercel, GitHub Actions y documentación; las integraciones deben autenticarse solo con JWT emitidos por la API.

## [0.2.0] - 2025-10-09

- Refer to repository history for the previous release baseline.

---

For upcoming work and open items, see `docs/overview/status.md` section “Próximos pasos prioritarios”.
