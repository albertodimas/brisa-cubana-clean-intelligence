# Inventario de Código y Herramientas

**Última actualización:** 31 de octubre de 2025  
**Responsables:** Plataforma · Producto · QA  
**Estado:** ⚠️ En recuperación (ver [recovery-plan.md](recovery-plan.md))

Este inventario resume los artefactos activos del monorepo para acelerar handoffs y auditorías.

## 1. Aplicaciones

| Ruta       | Stack clave                              | Descripción                                                                                    | Build                            |
| ---------- | ---------------------------------------- | ---------------------------------------------------------------------------------------------- | -------------------------------- |
| `apps/web` | Next.js 16.0.0, React 19, Auth.js 5 beta | Frontend (landing, checkout, portal cliente, panel operativo).                                 | `pnpm --filter @brisa/web build` |
| `apps/api` | Hono 4.10.3, Prisma 6.17.1, Stripe       | API REST + webhooks (`/api/payments/stripe/webhook`), seeds operativos/demo, OpenAPI expuesto. | `pnpm --filter @brisa/api build` |

## 2. Librerías y utilidades compartidas

- `apps/web/lib/*`: cliente HTTP, helpers de paginación, web vitals.
- `apps/api/src/lib/*`: contenedor DI, validaciones Zod, helpers JWT/Bcrypt.
- No existen paquetes en `packages/*` en esta versión; los módulos compartidos viven dentro de cada aplicación.

## 3. Datos y migraciones

- Prisma schema en `apps/api/prisma/schema.prisma`.
- Seeds:
  - `prisma/seed.operativo.ts`: usuarios internos (admin/coordinator) + contraseñas `Brisa123!`.
  - `prisma/seed.demo.ts`: servicios, propiedades, reservas demo, cliente piloto.
- Comandos relevantes (root):
  - `pnpm db:push`, `pnpm db:seed`, `pnpm --filter @brisa/api db:seed:operativo`, `pnpm --filter @brisa/api db:seed:demo`.

## 4. QA y pruebas

- **Vitest Web:** `apps/web` (104 tests) ejecutados con `pnpm --filter @brisa/web test`.
- **Vitest API:** unit (`vitest.unit.config.ts`) + integración (`vitest.integration.config.ts`) – 126 tests totales
  - Comandos: `pnpm --filter @brisa/api test:unit`, `pnpm --filter @brisa/api test:integration`
  - Ubicación integration: `apps/api/tests/integration/**`
- **Playwright:** suites en `tests/e2e/*.spec.ts` (smoke, critical, full) con soporte en `tests/e2e/support`. Incluye verificación de métricas de landing y flujo portal cliente.
- **Stripe tests:** `apps/api/tests/integration/routes/payments.integration.test.ts` usa `Stripe.webhooks.generateTestHeaderString`.
- **LHCI:** nightly (`.lighthouserc.preview.json`) sobre despliegue Vercel.
- **Checklist manual:** [`docs/development/qa/regression-checklist.md`](../development/qa/regression-checklist.md) (actualizada con escenarios Stripe).

## 5. Operaciones y despliegue

- Pipelines GitHub Actions: `ci.yml`, `pr-checks.yml`, `nightly.yml`, `codeql.yml`, `post-deploy-seed.yml` (Nightly invoca `enable-test-utils: "false"` para endurecer el portal cliente en CI).
- Husky hooks:
  - `pre-commit`: verifica secretos (`scripts/verify-secret-leaks.sh`), `verify:versions`, `lint-staged`.
  - `pre-push`: lint, typecheck, test.
- Deploy:
  - Web → Vercel proyecto `brisa-cubana-clean-intelligence` (`apps/web` root).
  - API → Vercel proyecto `brisa-cubana-clean-intelligence-api` (`apps/api`).
  - Variables Stripe modo test (`*_brisa_demo_20251015`) cargadas en Dev/Preview/Prod (ver `docs/operations/deployment.md` §2).

## 6. Observabilidad

- Sentry configurado en web (`@sentry/nextjs`) y API (`@sentry/node`, `@sentry/profiling-node`).
- Logs Pino + `pino-http`.
- Web Vitals y Speed Insights integrados en `apps/web`.
- Nightly Lighthouse (Performance objetivo ≥ 90).

## 7. Documentación de referencia

- `docs/overview/status.md`: estado del proyecto y health checks.
- `docs/development/guides/quickstart.md`: setup local, seeds, Stripe CLI.
- `docs/operations/deployment.md` y `docs/operations/security.md`: deploy y manejo de secrets.
- `docs/archive/product/phase-2-roadmap.md`: roadmap histórico de producto (referencia legacy).
- `docs/archive/product/rfc-public-components.md`: arquitectura pública Fase 2 (archivada).

## 8. Scripts y utilidades

- `scripts/verify-versions.mjs`: mantiene coherencia de dependencias entre apps.
- `scripts/verify-doc-structure.sh`: valida índice de documentación.
- `scripts/env/sync.mjs`: verifica `.env.local` frente al manifest y sirve como base para sincronización con Vercel/GitHub.
- `scripts/prisma-deploy-or-baseline.sh`: encapsula `pnpm --filter @brisa/api db:deploy` con fallback `P3005` para automatizar baselines en producción.
- `pnpm stripe:listen`: wrapper CLI Stripe apuntando a webhook local.

## 9. Herramientas externas

- Stripe CLI (modo test) configurada.
- GitHub CLI (`gh`) autenticada para `albertodimas`.
- Vercel CLI 48.3.0 vinculada a ambos proyectos.
- Base de datos Neon (producción) + Docker Compose local (`docker-compose.yml`).

Mantener este inventario al día tras incorporar paquetes, servicios o herramientas nuevas para evitar deuda operacional.
