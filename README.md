# Brisa Cubana Clean Intelligence

[![CI (Main Branch)](https://img.shields.io/github/actions/workflow/status/albertodimas/brisa-cubana-clean-intelligence/ci.yml?label=CI&logo=github&style=for-the-badge)](https://github.com/albertodimas/brisa-cubana-clean-intelligence/actions/workflows/ci.yml)
[![Nightly E2E](https://img.shields.io/github/actions/workflow/status/albertodimas/brisa-cubana-clean-intelligence/nightly.yml?label=Nightly%20E2E&logo=github&style=for-the-badge)](https://github.com/albertodimas/brisa-cubana-clean-intelligence/actions/workflows/nightly.yml)
[![CodeQL](https://img.shields.io/github/actions/workflow/status/albertodimas/brisa-cubana-clean-intelligence/codeql.yml?label=CodeQL&logo=github&style=for-the-badge)](https://github.com/albertodimas/brisa-cubana-clean-intelligence/actions/workflows/codeql.yml)

Monorepo (pnpm + Turborepo) para la plataforma operativa de **Brisa Cubana Clean Intelligence**: API Hono + Prisma y frontend Next.js 16.

> Seguimos en plan de recuperación. Antes de desplegar o comunicar estado “production ready”, revisa el [resumen vigente](docs/overview/status.md) y el [plan de recuperación](docs/overview/recovery-plan.md).

---

## Estado actual

- Release estable: `v0.4.2`.
- Deploys automatizados en Vercel (web) y API pública `https://api.brisacubanacleanintelligence.com`.
- Salud, riesgos y suites en verde: ver [`docs/overview/status.md`](docs/overview/status.md).
- Historial previo (octubre 2025) archivado en [`docs/archive/2025-10-status.md`](docs/archive/2025-10-status.md).

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

## Documentación activa

- Manual central: [`docs/README.md`](docs/README.md).
- Estado operativo: [`docs/overview/status.md`](docs/overview/status.md).
- Portal cliente y enlaces mágicos: [`docs/development/guides/portal-client.md`](docs/development/guides/portal-client.md).
- Seguridad/entornos: [`docs/operations/security.md`](docs/operations/security.md) + [`SECURITY.md`](SECURITY.md).
- Referencia API (OpenAPI): [`docs/reference/api-reference.md`](docs/reference/api-reference.md).

> **Política:** No se acepta código sin documentación actualizada. Cada PR debe incluir notas relevantes y pasar `pnpm docs:verify`.

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
