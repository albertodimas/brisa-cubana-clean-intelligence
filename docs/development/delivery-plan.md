# Delivery Plan & Release Governance

Este documento describe cómo planificar, validar y promover cambios desde desarrollo hasta producción para Brisa Cubana Clean Intelligence.

## Objetivos

- Garantizar despliegues predecibles y reversibles.
- Mantener paridad entre entornos (`dev` → `staging` → `production`).
- Aplicar las mejores prácticas publicadas por Next.js (Production Checklist 15.5.4, revisada 2025-09) y Railway (Production Readiness Checklist, actualizado 2025-08).

## Flujo de Entregas

1. **Trabajo en ramas feature**
   - Crear ramas desde `develop` con prefijo `feature/`, `fix/` o `chore/`.
   - Ejecutar `pnpm lint`, `pnpm typecheck`, `pnpm test` localmente.
   - Para cambios en UI, añadir capturas al PR o adjuntar reporte Playwright (`pnpm test:e2e`).

2. **Pull Request → `develop`**
   - PR obligatorio con checklist:
     - Tests unitarios y de integración OK (`pnpm --filter=@brisa/api exec vitest run --reporter=json`).
     - E2E relevantes (`pnpm test:e2e` con datos fake) adjuntan reporte si fallan.
     - Docs actualizadas cuando afecta API/UX (ver [Documentation Standards](documentation-standards.md)).
   - Habitat de CI: workflow `ci.yml` ejecuta lint + typecheck + test sobre Node 24.

3. **Staging**
   - Merge a `develop` dispara `deploy-staging.yml`:
     - Requiere `RAILWAY_STAGING_TOKEN` y `VERCEL_*` staging.
     - Usa variables en modo test: Stripe keys `sk_test`, `NEXT_PUBLIC_API_URL` → endpoint staging.
     - Habilitar [Check Suites de Railway](https://docs.railway.com/guides/github-autodeploys#check-suites) para que la plataforma espere a que finalicen los jobs de GitHub Actions antes de desplegar.
     - Activar [PR Environments](https://docs.railway.com/guides/environments#enable-pr-environments) cuando se necesiten demos por feature.
   - Validaciones en staging:
     - Smoke E2E (`pnpm test:e2e`) contra staging con datos seed.
     - `pnpm docs:build` sin warnings críticos.
     - Revisar rendimiento vía `next build` + Lighthouse (se ejecuta localmente o en Vercel Analytics).

4. **Promoción a Producción**
   - Merge de `develop` → `main` gatilla `deploy-production.yml` (sólo si CI pasó).
   - Revisión manual antes del merge:
     - Checklist de Next.js Production (ver [Resumen de mejores prácticas](#resumen-de-mejores-practicas)).
     - Railway Production Readiness (regiones, réplicas, backups, alertas Slack).
   - Despliegue API: `railway up --service "@brisa/api" --detach` + health check `/healthz`.
   - Despliegue Web: `vercel deploy --prod` con `NEXT_PUBLIC_API_URL=https://api.brisacubana.com`.
   - Slack notifica éxito/fracaso (`SLACK_WEBHOOK_URL`).
   - Registrar resultado en `PRODUCTION_DEPLOYMENT_GUIDE.md` y cerrar ticket.

5. **Post-Deploy**
   - Verificar dashboards de Sentry (errores) y Railway Logs.
   - Confirmar métricas básicas (`useReportWebVitals` + Vercel Web Analytics).
   - Ejecutar regresión rápida (`pnpm test:e2e`) con `NEXT_PUBLIC_USE_FAKE_API_DATA=1` si se requiere.
   - Programar retro breve para issues detectados.

## Gestión de Versiones

- **Etiquetas**: usar `vMAJOR.MINOR.PATCH` alineadas con `CHANGELOG.md`.
- **Changelog**: actualizar sección `## [x.y.z] - YYYY-MM-DD` antes de merge a `main`.
- **Hotfixes**: ramas `hotfix/*`, cherry-pick a `main`, luego merge `main` → `develop`.

## Control de Calidad

| Área                        | Práctica recomendada                                  | Referencia                                                                                                                   |
| --------------------------- | ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Lint + Typecheck            | `pnpm lint`, `pnpm typecheck` en CI y local           | [GitHub Docs - Building Node.js](https://docs.github.com/en/actions/automating-builds-and-tests/building-and-testing-nodejs) |
| Tests unitarios/integración | `pnpm --filter=@brisa/api test -- --coverage`         | idem                                                                                                                         |
| Tests E2E                   | `pnpm test:e2e` (Playwright con datos fake)           | Next.js production checklist (§Before going to production)                                                                   |
| Build                       | `pnpm build` (Turbo) antes de merge a `main`          | Next.js production checklist                                                                                                 |
| Docs                        | `pnpm docs:build` (mkdocs) sin warnings estructurales | Railway production checklist (Quality Assurance)                                                                             |
| Observabilidad              | Validar OTel + Sentry + Slack                         | Railway production checklist (Observability)                                                                                 |

## Resumen de mejores prácticas {#resumen-de-mejores-practicas}

### Next.js 15.5.4 (Production Checklist)

- Aprovechar **Server Components**, code-splitting y prefetching por defecto.
- Revisar uso de **Dynamic APIs** (`cookies`, `searchParams`) y encapsularlos en `<Suspense>` para evitar forzar renderizado dinámico global.
- Cachear datos con [`fetch`](https://nextjs.org/docs/app/guides/caching) o `unstable_cache` según corresponda.
- Asegurar formularios con Server Actions y validación server-side.
- Proteger secretos: `.env` en `.gitignore`, sólo exponer claves con `NEXT_PUBLIC_`.
- Añadir **CSP** y usar el módulo de fuentes / `<Image>` / `<Script>` para rendimiento y accesibilidad.
- Ejecutar `next build` + `next start` + Lighthouse antes de liberar.
- Analizar bundles con `@next/bundle-analyzer` para evitar regresiones de peso.

### Railway (Production Readiness Checklist, 2025-08)

- Elegir región cercana a usuarios y habilitar **private networking** entre servicios.
- Configurar **restart policy** y al menos **2 replicas** en servicios críticos.
- Verificar cuota de CPU/RAM según plan o migrar a Railway Metal si es necesario.
- Activar **check suites**, environments y PR environments.
- Mantener **config-as-code** (`railway.json` / `railway.toml`) versionado.
- Habilitar alertas: webhooks/Slack + backups automáticos.
- Considerar WAF/CDN externo (p.e. Cloudflare) para capa adicional de seguridad.

## Calendario sugerido

| Frecuencia | Actividad                                                                    | Responsable           |
| ---------- | ---------------------------------------------------------------------------- | --------------------- |
| Diario     | Revisión de PRs activos, ejecutar smoke local                                | Equipo dev            |
| Semanal    | Merge train a `develop`, despliegue a staging                                | Líder técnico         |
| Quincenal  | Release a producción tras checklist completo                                 | CTO + DevOps          |
| Mensual    | Revisión de métricas (Core Web Vitals, errores Sentry, costo Railway/Vercel) | Producto + Ingeniería |
| Trimestral | Auditoría de secretos, rotación de claves, pruebas de DR                     | DevOps                |

---

**Última actualización:** 2025-10-03 (basado en Next.js 15.5.4 y Railway docs 2025-08)
