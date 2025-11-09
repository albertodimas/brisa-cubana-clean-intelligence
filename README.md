# Brisa Cubana Clean Intelligence

[![CI (Main Branch)](https://img.shields.io/github/actions/workflow/status/albertodimas/brisa-cubana-clean-intelligence/ci.yml?label=CI&logo=github&style=for-the-badge)](https://github.com/albertodimas/brisa-cubana-clean-intelligence/actions/workflows/ci.yml)
[![Nightly E2E](https://img.shields.io/github/actions/workflow/status/albertodimas/brisa-cubana-clean-intelligence/nightly.yml?label=Nightly%20E2E&logo=github&style=for-the-badge)](https://github.com/albertodimas/brisa-cubana-clean-intelligence/actions/workflows/nightly.yml)
[![CodeQL](https://img.shields.io/github/actions/workflow/status/albertodimas/brisa-cubana-clean-intelligence/codeql.yml?label=CodeQL&logo=github&style=for-the-badge)](https://github.com/albertodimas/brisa-cubana-clean-intelligence/actions/workflows/codeql.yml)

Monorepo (pnpm + Turborepo) para la plataforma operativa de **Brisa Cubana Clean Intelligence**: API Hono + Prisma y frontend Next.js 16.

> Seguimos en plan de recuperación. Antes de desplegar o comunicar estado “production ready”, revisa el [resumen vigente](docs/overview/status.md) y el [plan de recuperación](docs/overview/recovery-plan.md).

---

## Estado actual

- Release estable `v0.4.2`; roadmap y riesgos siempre actualizados en [`docs/overview/status.md`](docs/overview/status.md).
- Deploys automatizados (web/API) en Vercel; producción apunta a `https://app.brisacubanacleanintelligence.com` y `https://api.brisacubanacleanintelligence.com`.
- Cambios funcionales (calendario operativo, dashboard/marketing y notificaciones multi‑canal) documentados en [`CHANGELOG.md`](CHANGELOG.md) → sección **Unreleased**.
- Histórico previo (octubre 2025) archivado en [`docs/archive/2025-10-status.md`](docs/archive/2025-10-status.md).

---

## Arranque rápido

```bash
pnpm install
docker compose up -d
pnpm db:push && pnpm db:seed
pnpm dev          # web:3000, api:3001
```

- Usuarios demo: `admin@brisacubanacleanintelligence.com / Brisa123!`, `operaciones@… / Brisa123!`, `cliente@… / Brisa123!`.
- Variantes, scripts y troubleshooting: [Guía completa](docs/development/guides/quickstart.md).
- Sincronización de variables: [docs/operations/env-sync.md](docs/operations/env-sync.md).

---

## Sistema de documentación

| Dominio           | Punto de entrada                                                                                                                                                                               | Qué cubre                                                                             |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Manual general    | [`docs/README.md`](docs/README.md)                                                                                                                                                             | Política de documentación, inventario de carpetas activas y scripts de mantenimiento. |
| Estado & roadmap  | [`docs/overview/status.md`](docs/overview/status.md) · [`docs/overview/recovery-plan.md`](docs/overview/recovery-plan.md)                                                                      | Salud operativa, riesgos y plan integral por sprint.                                  |
| Desarrollo & QA   | [`docs/development/guides/quickstart.md`](docs/development/guides/quickstart.md) · [`docs/development/qa/e2e-strategy.md`](docs/development/qa/e2e-strategy.md)                                | Setup local, portal cliente, estrategia de pruebas y lineamientos UI/UX.              |
| Operaciones       | [`docs/operations/deployment.md`](docs/operations/deployment.md) · [`docs/operations/security.md`](docs/operations/security.md) · [`docs/operations/env-sync.md`](docs/operations/env-sync.md) | Despliegues, seguridad, env-sync, observabilidad y runbooks.                          |
| Referencia formal | [`docs/reference/api-reference.md`](docs/reference/api-reference.md) · [`docs/reference/openapi.yaml`](docs/reference/openapi.yaml)                                                            | OpenAPI actualizada y contratos compartidos.                                          |
| Documentos raíz   | [`CHANGELOG.md`](CHANGELOG.md) · [`SECURITY.md`](SECURITY.md)                                                                                                                                  | Cambios visibles para usuarios y política de divulgación responsable.                 |

> **Regla:** toda entrega debe explicitar qué documentos tocó y ejecutar `pnpm docs:verify`. El CI bloquea merges si el árbol de documentación queda incongruente.

---

## Contribuciones

1. Vincula tu trabajo a un hito del plan (`recovery-plan`, `ui-refresh`, etc.).
2. Corre la batería mínima: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:e2e:critical`.
3. Actualiza docs y ejecuta `pnpm docs:verify`.
4. Resume en el PR qué documentación tocaste y cómo validar.

Guías QA/regresión: [`docs/development/qa/e2e-strategy.md`](docs/development/qa/e2e-strategy.md) y [`docs/development/qa/regression-checklist.md`](docs/development/qa/regression-checklist.md).

---

## Seguridad y soporte

- Política de divulgación: [`SECURITY.md`](SECURITY.md)
- Reportes urgentes: `seguridad@brisacubanacleanintelligence.com`
- Operaciones: `operaciones@brisacubanacleanintelligence.com`

---

Hecho en Miami. Mantén CI verde, evita regresiones y documenta cada cambio. 💚
