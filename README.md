# Brisa Cubana Clean Intelligence

[![CI (Main Branch)](https://img.shields.io/github/actions/workflow/status/albertodimas/brisa-cubana-clean-intelligence/ci.yml?label=CI&logo=github&style=for-the-badge)](https://github.com/albertodimas/brisa-cubana-clean-intelligence/actions/workflows/ci.yml)
[![Nightly E2E](https://img.shields.io/github/actions/workflow/status/albertodimas/brisa-cubana-clean-intelligence/nightly.yml?label=Nightly%20E2E&logo=github&style=for-the-badge)](https://github.com/albertodimas/brisa-cubana-clean-intelligence/actions/workflows/nightly.yml)
[![CodeQL](https://img.shields.io/github/actions/workflow/status/albertodimas/brisa-cubana-clean-intelligence/codeql.yml?label=CodeQL&logo=github&style=for-the-badge)](https://github.com/albertodimas/brisa-cubana-clean-intelligence/actions/workflows/codeql.yml)

Monorepo (pnpm + Turborepo) para la plataforma operativa de **Brisa Cubana Clean Intelligence**: API en Hono + Prisma y frontend en Next.js 16.

> ⚠️ Estamos en fase de recuperación. La UI/UX aún presenta inconsistencias visuales/performance y parte de la documentación histórica está desactualizada. Consulta el plan antes de confiar en cualquier afirmación de “Production Ready”.

---

## Instantánea (31-oct-2025)

- Release etiquetada: `v0.4.2`.
- CI/CD en verde (ver acciones recientes en GitHub → Actions).
- Producción: Vercel (`apps/web`) + Neon (PostgreSQL 17) + API pública en `https://api.brisacubanacleanintelligence.com`.
- Foco del equipo: [Plan de recuperación](docs/overview/recovery-plan.md) con tres frentes activos (UI/UX, performance/observabilidad y limpieza documental).

---

## Cómo levantar el stack

```bash
pnpm install
docker compose up -d
pnpm db:push && pnpm db:seed
pnpm dev          # web:3000, api:3001
pnpm lint && pnpm typecheck && pnpm test:e2e:smoke
```

- Variables: usa `.env.local` en la raíz (ver `docs/operations/env-sync.md`).
- Usuarios demo: `admin@brisacubanacleanintelligence.com / Brisa123!`, `operaciones@… / Brisa123!`, `cliente@… / Brisa123!`.

---

## Trabajo en curso

- **UI/UX Refresh** – Storybook + design tokens + componentes productivos (ver issues `ui-refresh`).
- **Performance & Observabilidad** – Métricas reales en la landing (CountUp/market stats), tests Playwright que validen datos, Lighthouse en CI.
- **Docs & Procesos** – Depurar docs duplicados, automatizar estado del proyecto, unificar variables de entorno y workflows.

Participa revisando los issues etiquetados como `recovery-plan` o mediante el tablero del proyecto.

---

## Directorio rápido

```
apps/
  api/     # Hono + Prisma
  web/     # Next.js + Auth.js + componentes UI
docs/      # Runbooks, guías y decisiones (ver secciones marcadas como “⚠️ actualizar”)
scripts/   # utilidades (Prisma, verificación de docs, seeds)
tests/     # Playwright (smoke/critical/full)
```

Referencias clave:

- [Quickstart detallado](docs/guides/quickstart.md)
- [Portal cliente](docs/guides/portal-client.md)
- [Sincronización de entornos](docs/operations/env-sync.md)
- [Plan de recuperación](docs/overview/recovery-plan.md)

---

## Seguridad y soporte

- Política: [`SECURITY.md`](SECURITY.md)
- Reportes urgentes: `seguridad@brisacubanacleanintelligence.com`
- Contacto operativo: `operaciones@brisacubanacleanintelligence.com`

---

Hecho en Miami. Mantén CI verde, evita regresiones y actualiza la documentación cuando cambies procesos. 💚
