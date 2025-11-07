# Brisa Cubana Clean Intelligence – Manual de Documentación

**Última revisión:** 7 de noviembre de 2025

> ℹ️ El plan de recuperación sigue activo. Consulta el [recovery-plan](overview/recovery-plan.md) y el [resumen de estado](overview/status.md) para conocer la información vigente; el histórico de octubre está en `docs/archive/2025-10-status.md`.

Ejecuta `pnpm docs:verify` antes de abrir un PR; el flujo `CI (Main Branch)` bloquea merges si la documentación queda desactualizada.

## Política de documentación

- Ningún cambio funcional se acepta sin actualizar la documentación relacionada (o justificar explícitamente por qué no aplica).
- Si modificas suites Playwright ejecuta `node scripts/qa/update-playwright-docs.mjs --write`.
- Marca contenido legado con `⚠️ actualizar` y muévelo a `docs/archive/` cuando deje de ser referencia activa.
- Verificación obligatoria: `pnpm docs:verify` debe figurar en la descripción del PR junto con los comandos de test.

## Índice por dominio

| Área                      | Archivos principales                                                                                                                                                                                                                                                                                                                                                | Contenido resumido                                                                                                               |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **Overview**              | [`overview/status.md`](overview/status.md) · [`overview/inventory.md`](overview/inventory.md) · [`overview/recovery-plan.md`](overview/recovery-plan.md)                                                                                                                                                                                                            | Estado operativo vigente, inventario del stack y plan de recuperación.                                                           |
| **Development & QA**      | [`development/guides/quickstart.md`](development/guides/quickstart.md) · [`development/guides/portal-client.md`](development/guides/portal-client.md) · [`development/qa/e2e-strategy.md`](development/qa/e2e-strategy.md) · [`development/ui-ux/guide.md`](development/ui-ux/guide.md)                                                                             | Guías de desarrollo, portal cliente, estrategia de pruebas, lineamientos UI/UX y seguimiento técnico.                            |
| **Operations & Runbooks** | [`operations/deployment.md`](operations/deployment.md) · [`operations/env-sync.md`](operations/env-sync.md) · [`operations/observability.md`](operations/observability.md) · [`operations/security.md`](operations/security.md) · [`operations/incident-runbook.md`](operations/incident-runbook.md) · [`operations/email-routing.md`](operations/email-routing.md) | Procedimientos de despliegue, sincronización de entornos, observabilidad, seguridad, routing de correo y respuesta a incidentes. |
| **Reference**             | [`reference/api-reference.md`](reference/api-reference.md) · [`reference/openapi.yaml`](reference/openapi.yaml)                                                                                                                                                                                                                                                     | Especificación OpenAPI y documentación formal de la API (Scalar).                                                                |
| **Archive & Legacy**      | [`archive/`](archive/) (marketing, negocio, templates, roadmap histórico, etc.)                                                                                                                                                                                                                                                                                     | Material histórico; no referenciar para tareas actuales salvo correcciones puntuales.                                            |

## Documentos raíz obligatorios

- [`../CHANGELOG.md`](../CHANGELOG.md) — cronología de cambios visibles para usuarios.
- [`../SECURITY.md`](../SECURITY.md) — política de divulgación responsable y guías de hardening.

## Scripts de mantenimiento

- `node scripts/qa/update-playwright-docs.mjs --write`: sincroniza tabla Playwright (`docs/overview/status.md`) y el checklist de regresión.
- `node scripts/status/generate.mjs` (`pnpm status:update`): refresca el bloque automático de estado si se requiere.
- `node scripts/performance/update-bundle-doc.mjs --write`: actualiza métricas de bundle tras correr `pnpm --filter @brisa/web analyze` (modo JSON).

Mantén este README como entrada principal al sistema de documentación. Cada equipo debe mantener su subsección alineada con los entregables del plan de recuperación.
