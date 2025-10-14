# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html) where applicable.

## [0.2.6] - 2025-10-14

### Changed

- Sincronizado el índice maestro de documentación (`docs/README.md`) y el README raíz con enlaces por dominio.
- Actualizados los manuales de seguridad, quickstart y archivos `.env` para usar PostgreSQL local en `localhost:5433`.
- Referencia API revisada para reflejar endpoints vigentes (incluye `DELETE /api/services/:id`) y eliminar secciones aspiracionales.

### Fixed

- `pnpm docs:verify` vuelve a pasar tras restaurar la estructura esperada y alinear fechas de revisión (14/oct/2025).
- Checklist de regresión ahora cubre el flujo de eliminación de servicios con soft delete.

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

## [0.2.0] - 2025-10-09

- Refer to repository history for the previous release baseline.

---

For upcoming work and open items, see `docs/overview/status.md` section “Próximos pasos prioritarios”.
