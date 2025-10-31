# Brisa Cubana Clean Intelligence – Manual de Documentación

**Última revisión:** 31 de octubre de 2025

> ℹ️ Muchas secciones están en proceso de actualización durante el plan de recuperación. Revisa la columna “Estado” en cada documento y el [recovery-plan](overview/recovery-plan.md) para validar qué partes siguen vigentes.

Ejecuta `pnpm docs:verify` antes de abrir un PR; el flujo `CI (Main Branch)` bloquea merges si la documentación requerida queda obsoleta.

## Índice por dominio

| Área                      | Archivos principales                                                                                                                                                                                                                                                                    | Contenido resumido                                                                                                             |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **Overview**              | [`overview/status.md`](overview/status.md) · [`overview/inventory.md`](overview/inventory.md) · [`overview/recovery-plan.md`](overview/recovery-plan.md)                                                                                                                                | Estado del proyecto, inventario del stack y plan de recuperación activo.                                                       |
| **Development & QA**      | [`development/guides/quickstart.md`](development/guides/quickstart.md) · [`development/guides/portal-client.md`](development/guides/portal-client.md) · [`development/qa/e2e-strategy.md`](development/qa/e2e-strategy.md) · [`development/ui-ux/guide.md`](development/ui-ux/guide.md) | Guías de desarrollo, portal cliente, estrategia de pruebas, lineamientos UI/UX y seguimiento técnico (performance, tech-debt). |
| **Operations & Runbooks** | [`operations/deployment.md`](operations/deployment.md) · [`operations/env-sync.md`](operations/env-sync.md) · [`operations/observability.md`](operations/observability.md) · [`operations/incident-runbook.md`](operations/incident-runbook.md)                                         | Procedimientos de despliegue, sincronización de entornos, observabilidad, incident response y seguridad.                       |
| **Reference**             | [`reference/api-reference.md`](reference/api-reference.md) · [`reference/openapi.yaml`](reference/openapi.yaml)                                                                                                                                                                         | Especificación OpenAPI y documentación formal de la API (Scalar).                                                              |
| **Archive & Legacy**      | [`archive/`](archive/) (marketing, negocio, templates, assets, roadmap histórico, etc.)                                                                                                                                                                                                 | Documentos históricos y materiales no prioritarios para la fase de recuperación.                                               |

> Para navegar rápidamente desde la raíz: `pnpm docs:verify` garantiza que los archivos críticos permanezcan disponibles y que no existan referencias obsoletas.

## Scripts de mantenimiento

- `node scripts/qa/update-playwright-docs.mjs --write` sincroniza automáticamente la tabla de suites Playwright en `docs/overview/status.md` y los conteos de `docs/development/qa/regression-checklist.md`. El chequeo se ejecuta en `pnpm docs:verify`, por lo que los PR deben correr este script si agregan o mueven tests E2E.
- `pnpm --filter @brisa/web analyze -- --webpack` seguido de `ANALYZE_MODE=json pnpm --filter @brisa/web analyze -- --webpack` genera los artefactos requeridos por `node scripts/performance/update-bundle-doc.mjs --write`, que inyecta los tamaños reales del bundle en `docs/development/performance/bundle-analysis.md`.
