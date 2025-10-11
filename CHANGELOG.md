# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html) where applicable.

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
