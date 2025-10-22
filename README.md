# Brisa Cubana Clean Intelligence

[![CI (Main Branch)](https://img.shields.io/github/actions/workflow/status/albertodimas/brisa-cubana-clean-intelligence/ci.yml?label=CI&logo=github&style=for-the-badge)](https://github.com/albertodimas/brisa-cubana-clean-intelligence/actions/workflows/ci.yml)
[![Nightly E2E](https://img.shields.io/github/actions/workflow/status/albertodimas/brisa-cubana-clean-intelligence/nightly.yml?label=Nightly%20E2E&logo=github&style=for-the-badge)](https://github.com/albertodimas/brisa-cubana-clean-intelligence/actions/workflows/nightly.yml)
[![CodeQL](https://img.shields.io/github/actions/workflow/status/albertodimas/brisa-cubana-clean-intelligence/codeql.yml?label=CodeQL&logo=github&style=for-the-badge)](https://github.com/albertodimas/brisa-cubana-clean-intelligence/actions/workflows/codeql.yml)
[![Release](https://img.shields.io/github/v/tag/albertodimas/brisa-cubana-clean-intelligence?color=0EA5E9&label=release&logo=github&style=for-the-badge)](https://github.com/albertodimas/brisa-cubana-clean-intelligence/tags)

Monorepo verificado para la plataforma operativa de **Brisa Cubana Clean Intelligence**.  
Al día **22 de octubre de 2025**, la serie `v0.4.x` está totalmente documentada, con **253 pruebas automatizadas** (204 unit/integration + 49 E2E) pasando en CI y despliegues productivos estables.

---

## 🧭 Visión general

- **Frontend (`apps/web`)**: Next.js 15.5.6 + React 19.2.0, Auth.js (NextAuth v5), server actions y proxy interno `/api/*`.
- **API (`apps/api`)**: Hono 4.9.12 sobre Node.js 22, RBAC por middleware, repositorios Prisma, rate limiting y webhook de leads.
- **Persistencia**: Prisma Client 6.17.1 → PostgreSQL 17 (Neon en producción) / PostgreSQL 16 en Docker local con soft delete en todos los modelos.
- **Observabilidad**: Pino + Sentry (web/API), Speed Insights, métricas `/health`, logs estructurados y monitoreo E2E nocturno.
- **Tooling**: pnpm 10.18 · Turborepo 2.5 · TypeScript 5.9 · Vitest 3.2 · Playwright 1.56 · Husky + lint-staged.

---

## 🗂️ Monorepo

```
apps/
  api/       # Hono + Prisma + tests de integración
  web/       # Next.js + Auth.js + componentes UI
docs/
  guides/    # Quickstart, portal y procedimientos
  marketing/ # Brand voice, assets, social
  operations/# Runbooks, despliegue, env-sync
  overview/  # Estado y métricas del proyecto
tests/       # Suites Playwright (smoke/critical/full)
scripts/     # Utilidades (Prisma, verificación docs, seeds)
```

---

## 🚀 Quick start

1. **Instala dependencias**
   ```bash
   pnpm install
   ```
2. **Configura variables**
   ```bash
   cp apps/api/.env.example apps/api/.env.local
   cp apps/web/.env.example apps/web/.env.local
   ```
3. **Levanta PostgreSQL local**
   ```bash
   docker compose up -d
   pnpm db:push
   pnpm db:seed
   ```
4. **Ejecuta el stack**

   ```bash
   pnpm dev
   ```

   - Web → <http://localhost:3000>
   - API → <http://localhost:3001>

5. **Pruebas rápidas**
   ```bash
   pnpm lint && pnpm typecheck
   pnpm test                  # Vitest
   pnpm test:e2e:smoke        # Playwright (smoke)
   ```

Usuarios seed: `admin@brisacubanacleanintelligence.com / Brisa123!`, `operaciones@... / Brisa123!`, `cliente@... / Brisa123!`.

---

## 🧪 Testing matrix

| Comando                    | Descripción                                  |
| -------------------------- | -------------------------------------------- |
| `pnpm test`                | Vitest (unit + integration) en web y API.    |
| `pnpm test:e2e:smoke`      | Playwright smoke (~40 s, 3 tests).           |
| `pnpm test:e2e:critical`   | Playwright critical (~6 min, 20 tests).      |
| `pnpm test:e2e:full`       | Playwright full (~11 min, 49 tests).         |
| `pnpm docs:verify`         | Verifica estructura mínima de documentación. |
| `pnpm db:push` / `db:seed` | Sincroniza y siembra PostgreSQL local.       |
| `pnpm build`               | Compila Next.js + API (`dist`).              |

> CI (Main Branch) ejecuta lint + typecheck + Vitest + Playwright critical.  
> Nightly Full E2E valida smoke + critical + full + Lighthouse contra producción.

---

## 🌐 Environments

| Entorno            | Host                                                                         | Estado                                          |
| ------------------ | ---------------------------------------------------------------------------- | ----------------------------------------------- |
| `Production – web` | https://brisacubanacleanintelligence.com                                     | ✅                                              |
| `Production – api` | https://api.brisacubanacleanintelligence.com                                 | ✅                                              |
| `Preview – web`    | Deploy previews automáticos (`brisa-cubana-clean-intelligence-*.vercel.app`) | ✅                                              |
| `Preview – api`    | `brisa-cubana-clean-intelligence-api-*.vercel.app`                           | ⚠️ revisar logs de Vercel cuando falle el build |

Neon (PostgreSQL 17) sirve la base productiva con seeds demo, ver `docs/operations/env-sync.md` y `docs/operations/domain-map.md` para mantener las variables entre Vercel y GitHub Actions.

---

## 📚 Documentación clave

- [Estado del proyecto](docs/overview/status.md) – métricas, despliegues y bitácora.
- [Quickstart local](docs/guides/quickstart.md) – guía paso a paso para levantar el stack.
- [Portal cliente](docs/guides/portal-client.md) – flujos y requisitos operativos.
- [Operaciones & despliegue](docs/operations/deployment.md) – pipeline, verificación y rollback.
- [Brand & marketing](docs/marketing/brand-voice.md) – tono, assets, campañas.
- [Decisiones técnicas](docs/decisions/) – histórico de migraciones y justificaciones (Tailwind v4, dependencia Stripe, etc.).
- [Referencia API](docs/reference/openapi.yaml) – especificación OpenAPI.

---

## 🔄 CI / CD

- **CI (Main Branch)** → lint + typecheck + tests + Playwright critical.
- **PR Checks** → smoke E2E + validaciones rápidas.
- **Nightly Full E2E** → suite completa + Lighthouse budgets.
- **CodeQL** → escaneo estático (JavaScript/TypeScript).
- **Post-Deploy Seed** → sincroniza Prisma en producción tras cada merge a `main`.
- **Dependabot Updates** → actualizaciones semanales (agrupadas por producción/dev/CI).

Consulta el tablero de acciones: <https://github.com/albertodimas/brisa-cubana-clean-intelligence/actions>.

---

## 🛡️ Seguridad

- Política completa: [`SECURITY.md`](SECURITY.md).
- Reportes vía `seguridad@brisacubanacleanintelligence.com` o GitHub Security Advisories.
- Tiempos objetivo: acuse ≤2 días hábiles · triage ≤5 días · parche ≤10 días (alta).

Alertas actuales: consulta <https://github.com/albertodimas/brisa-cubana-clean-intelligence/security> (Dependabot + CodeQL).

---

## 🤝 Contribuciones

1. Basar cambios en ramas descriptivas.
2. Ejecutar `pnpm lint && pnpm typecheck && pnpm test`.
3. Corridas Playwright (`pnpm test:e2e:smoke`) para cambios que toquen UI/flows.
4. Actualizar documentación (README, `docs/overview/status.md`, CHANGELOG cuando aplique).
5. Abrir PR contra `main` y esperar CI verde.
6. Coordinar con Operations/Onboarding cuando la guía cambie procesos (seeds, credenciales demo, runbooks).

> Regla de oro: **solo documentamos y desplegamos lo que existe, está probado y pasa en CI**.

---

## 📞 Contacto

- Email general: `contacto@brisacubanacleanintelligence.com`
- Operaciones: `operaciones@brisacubanacleanintelligence.com`
- Ventas: `ventas@brisacubanacleanintelligence.com`
- Facturación: `facturacion@brisacubanacleanintelligence.com`
- Soporte técnico: `devops@brisacubanacleanintelligence.com`
- Redes: [Instagram](https://instagram.com/BrisaCleanIntelligence) · [LinkedIn](https://www.linkedin.com/company/brisa-clean-intelligence) · [TikTok](https://www.tiktok.com/@brisacleanintelligence) · [YouTube](https://www.youtube.com/@BrisaCleanIntelligence)

---

Hecho con 💚 desde Miami para anfitriones premium. Mantengamos el stack limpio, la documentación viva y los despliegues en verde.
