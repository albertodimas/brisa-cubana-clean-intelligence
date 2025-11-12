# Brisa OS – Manual de Documentación

**Última revisión:** 12 de noviembre de 2025

> ℹ️ El repositorio ahora opera como producto SaaS (“Brisa OS”). La visión completa está en [`product/saas-vision.md`](product/saas-vision.md) y el estado vigente en [`overview/status.md`](overview/status.md). El plan de recuperación histórico permanece en [`overview/recovery-plan.md`](overview/recovery-plan.md) y el histórico 2025-10 en `docs/archive/2025-10-status.md`.

Ejecuta `pnpm docs:verify` antes de abrir un PR; el flujo `CI (Main Branch)` bloquea merges si la documentación queda desactualizada.

## Política de documentación

- Ningún cambio funcional se acepta sin actualizar la documentación relacionada (o justificar explícitamente por qué no aplica).
- Si modificas suites Playwright ejecuta `node scripts/qa/update-playwright-docs.mjs --write`.
- Marca contenido legado con `⚠️ actualizar` y muévelo a `docs/archive/` cuando deje de ser referencia activa.
- Verificación obligatoria: `pnpm docs:verify` debe figurar en la descripción del PR junto con los comandos de test.

## Índice por dominio

| Área                       | Archivos principales                                                                                                                                                                                                                                                                                                                                                | Contenido resumido                                                                                                               |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **Producto / Visión SaaS** | [`product/saas-vision.md`](product/saas-vision.md)                                                                                                                                                                                                                                                                                                                  | Cliente ideal, propuesta de valor, planes/pricing y roadmap del SaaS.                                                            |
| **Overview**               | [`overview/status.md`](overview/status.md) · [`overview/inventory.md`](overview/inventory.md) · [`overview/recovery-plan.md`](overview/recovery-plan.md)                                                                                                                                                                                                            | Estado operativo vigente, inventario del stack y plan de recuperación histórico.                                                 |
| **Development & QA**       | [`development/guides/quickstart.md`](development/guides/quickstart.md) · [`development/guides/portal-client.md`](development/guides/portal-client.md) · [`development/qa/e2e-strategy.md`](development/qa/e2e-strategy.md) · [`development/ui-ux/guide.md`](development/ui-ux/guide.md)                                                                             | Guías de desarrollo, portal cliente, estrategia de pruebas, lineamientos UI/UX y seguimiento técnico.                            |
| **Operations & Runbooks**  | [`operations/deployment.md`](operations/deployment.md) · [`operations/env-sync.md`](operations/env-sync.md) · [`operations/observability.md`](operations/observability.md) · [`operations/security.md`](operations/security.md) · [`operations/incident-runbook.md`](operations/incident-runbook.md) · [`operations/email-routing.md`](operations/email-routing.md) | Procedimientos de despliegue, sincronización de entornos, observabilidad, seguridad, routing de correo y respuesta a incidentes. |
| **Reference**              | [`reference/api-reference.md`](reference/api-reference.md) · [`reference/openapi.yaml`](reference/openapi.yaml)                                                                                                                                                                                                                                                     | Especificación OpenAPI y documentación formal de la API (Scalar).                                                                |
| **Archive & Legacy**       | [`archive/`](archive/) (marketing, negocio, templates, roadmap histórico, etc.)                                                                                                                                                                                                                                                                                     | Material histórico; no referenciar para tareas actuales salvo correcciones puntuales.                                            |

## Checklist de sincronización documental

| Tipo de cambio                       | Actualiza                                                                                                                 | Comandos mínimos                                                |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Endpoint/contrato API                | `docs/reference/api-reference.md`, `docs/overview/status.md`, `CHANGELOG.md`                                              | `pnpm docs:verify`, `pnpm test --filter @brisa/api`             |
| Funcionalidad Web / UX               | Guías correspondientes (`development/guides/*.md`), `docs/overview/status.md`, capturas en `docs/development/ui-ux/`      | `pnpm lint --filter @brisa/web`, `pnpm test:e2e:critical`       |
| Operaciones / Deploy / Infra         | `docs/operations/deployment.md`, `docs/operations/env-sync.md`, runbooks o `docs/operations/observability.md`             | `pnpm docs:verify`, `pnpm env:status`                           |
| Seguridad / Credenciales             | `SECURITY.md`, `docs/operations/security.md`, notas en `docs/overview/status.md`                                          | `pnpm docs:verify`, validar rotaciones en Vercel/GitHub Secrets |
| Marketing / Portal / Cliente externo | `CHANGELOG.md`, `docs/development/guides/portal-client.md`, `docs/overview/status.md`, activos en `apps/web/public/`      | `pnpm test:e2e:full`, `pnpm docs:verify`                        |
| Producto / Visión SaaS               | `docs/product/saas-vision.md`, `README.md`, `docs/overview/status.md`                                                     | `pnpm docs:verify`, documentar decisiones en el PR              |
| Scripts, seeds, migraciones          | `docs/development/guides/quickstart.md`, `docs/operations/deployment.md` (sección migraciones), `docs/overview/status.md` | `pnpm db:push`, `pnpm db:seed`, `pnpm docs:verify`              |

> Si un documento **no** aplica, explícalo en el PR. La regla es “documentar o justificar explícitamente”.

## Documentos raíz obligatorios

- [`../CHANGELOG.md`](../CHANGELOG.md) — cronología de cambios visibles para usuarios.
- [`../SECURITY.md`](../SECURITY.md) — política de divulgación responsable y guías de hardening.

## Scripts de mantenimiento

- `node scripts/qa/update-playwright-docs.mjs --write`: sincroniza tabla Playwright (`docs/overview/status.md`) y el checklist de regresión.
- `node scripts/status/generate.mjs` (`pnpm status:update`): refresca el bloque automático de estado si se requiere.
- `node scripts/performance/update-bundle-doc.mjs --write`: actualiza métricas de bundle tras correr `pnpm --filter @brisa/web analyze` (modo JSON).

Mantén este README como entrada principal al sistema de documentación. Cada equipo debe mantener su subsección alineada con los entregables del plan de recuperación.
