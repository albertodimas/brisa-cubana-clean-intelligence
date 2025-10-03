# 🚀 Guía de Despliegue a Producción

**Objetivo**: documentar el camino recomendado para promover Brisa Cubana Clean Intelligence desde el estado actual del repositorio hacia un despliegue productivo seguro. La información refleja la auditoría local realizada el 2025-10-03 sobre la rama `main` (`f47c7e4`).

---

## 1. Estado Actual

| Área                        | Situación (2025-10-03)                                                                                                   |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Tests unitarios/integración | `pnpm --filter=@brisa/api exec vitest run --reporter=json` → ✅ 171/171 pruebas pasando (~7s).                           |
| Tests E2E                   | `pnpm test:e2e` → ✅ 15/15 escenarios Playwright con datos fake (2025-10-03).                                            |
| Lint                        | `pnpm lint` → ✅ sin advertencias tras refactor de observabilidad.                                                       |
| Build/typecheck             | `pnpm build` / `pnpm typecheck` → ✅ ejecutados 2025-10-03; Turbo + TSC sin errores.                                     |
| CI (`.github/workflows/ci`) | Último histórico reportó fallo en subida a Codecov por falta de `CODECOV_TOKEN`. Resto de jobs pasan localmente.         |
| Deploy workflows            | `deploy-production.yml` y `deploy-staging.yml` definidos pero requieren secretos Railway/Vercel y verificación de paths. |
| Infraestructura             | Carpetas `infra/` (Railway, Vercel, GitOps, observabilidad, Mesh, Terraform) con plantillas. Ningún despliegue validado. |
| Documentación               | README + reportes actualizados; runbooks y manuales listos para seguir, pero muchos pasos siguen como pendientes.        |

---

## 2. Activos Disponibles en el Repositorio

### 2.1 Infraestructura como Código

- `infra/terraform/`: módulos para Railway/Vercel y bases de datos. Son plantillas, requieren variables, backend remoto y pruebas antes de usarse.
- `infra/gitops/`, `infra/mesh/`, `infra/chaos-mesh/`, `infra/grafana/`, `infra/prometheus/`: manifiestos de referencia para fases futuras (no desplegados).

### 2.2 Operaciones y Runbooks

- `RUNBOOKS/GO_LIVE.md`, `RUNBOOKS/ROLLBACK.md`, `RUNBOOKS/INCIDENT_RESPONSE.md`, `RUNBOOKS/OPERATIONAL_READINESS_REVIEW.md`: guías paso a paso still en borrador; seguirlas requiere ajustar timings y responsables reales.

### 2.3 Dockerfiles endurecidos

- `apps/api/Dockerfile` y `apps/web/Dockerfile`: multi-stage + base distroless + etiquetas OCI. Probados localmente pero no publicados en registry.

### 2.4 Workflows de GitHub Actions (7)

| Workflow                 | Propósito principal                          | Notas clave                                                               |
| ------------------------ | -------------------------------------------- | ------------------------------------------------------------------------- |
| `ci.yml`                 | Lint, typecheck, tests, build                | Paso de Codecov deshabilitado; activar solo si se define `CODECOV_TOKEN`. |
| `deploy-production.yml`  | Despliegue a Railway/Vercel desde `main`     | Requiere `RAILWAY_PRODUCTION_TOKEN`, `VERCEL_*`, etc. No probado.         |
| `deploy-staging.yml`     | Despliegue a entornos staging                | Igual que producción, ajustar ramas y secretos.                           |
| `documentation.yml`      | Build MkDocs + artefactos                    | Necesita token con permisos para `gh-pages` o storage propio.             |
| `payments-reconcile.yml` | Script de conciliación Stripe                | Depende de variables `STRIPE_*`.                                          |
| `security-scan.yml`      | TruffleHog, Snyk, Trivy, Cosign, CodeQL, OPA | Algunos pasos requieren `SNYK_TOKEN` y acceso a ghcr.io.                  |
| `codeql.yml`             | Análisis CodeQL programado                   | Usa configuración estándar; verificar resultados en Security tab.         |

---

## 3. Pasos Recomendados para Despliegue

### 3.1 Preparación Local

1. Instalar dependencias: `pnpm install` + `pnpm db:setup` (Docker debe estar activo).
2. Ejecutar verificaciones completas:
   ```bash
   pnpm lint            # ESLint + markdownlint + cspell
   pnpm typecheck       # TypeScript en API/UI empaquetadas
   pnpm build           # Turbo build (API, UI, packages)
   pnpm test            # Vitest completo
   pnpm test:e2e        # Playwright con datos fake
   pnpm docs:build      # MkDocs sin warnings estructurales
   ```
3. Actualizar la documentación con resultados reales si difieren.

### 3.2 Configurar Secretos y Variables

- **GitHub Actions** (`Settings → Secrets and variables → Actions`):
  - `CODECOV_TOKEN` (opcional; quitar paso si no se usará).
  - `RAILWAY_PRODUCTION_TOKEN`, `RAILWAY_STAGING_TOKEN`.
  - `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` (prod/staging según corresponda).
  - `SNYK_TOKEN`, `SLACK_WEBHOOK_URL`, `STRIPE_SECRET_KEY`, etc., si se requiere cada workflow.
- **Railway/Vercel**: replicar variables listadas en `DEPLOYMENT_CHECKLIST.md` (`DATABASE_URL`, `JWT_SECRET`, `NEXTAUTH_SECRET`, `NEXT_PUBLIC_API_URL`, etc.).
- **API env files**: asegurarse de que `apps/api/.env` y `apps/web/.env.local` contengan credenciales válidas para staging/production.

### 3.3 Ajustar Pipelines

1. En `ci.yml`, deja registrado si deseas reactivar Codecov: el paso está eliminado y solo debe volver con `CODECOV_TOKEN` disponible.
2. Verifica que los jobs de GitHub Actions instalen Node 24.9.0, alineado con `.nvmrc` y `apps/web/package.json` (ver [GitHub Docs](https://docs.github.com/en/actions/automating-builds-and-tests/building-and-testing-nodejs)).
3. Revisa `deploy-production.yml` / `deploy-staging.yml` para confirmar nombre de servicio Railway, comandos de build y dependencias de secretos; considera usar entornos protegidos y revisores obligatorios.

### 3.4 Primer Despliegue Manual (Recomendado)

1. **API (Railway)**

   ```bash
   cd apps/api
   pnpm build
   railway up
   # Configurar variables -> railway variables set KEY=value
   ```

   Validar con `curl https://<domain>/healthz`.

2. **Web (Vercel)**

   ```bash
   cd apps/web
   pnpm build
   vercel deploy --prod
   ```

   Revisar logs y confirmar que `NEXT_PUBLIC_API_URL` apunta al dominio de la API.

3. **Stripe y Webhooks**
   - Crear endpoint en dashboard y actualizar `STRIPE_WEBHOOK_SECRET`.
   - Probar con `./scripts/stripe_trigger.sh` si se dispone de claves.

4. Documentar resultados en `DEPLOYMENT_CHECKLIST.md` y runbooks.

---

## 4. Validaciones Posteriores

- **API**: `/`, `/healthz`, `/api/services`, `/api/bookings` (autenticado) responden correctamente.
- **Web**: login, creación de propiedad, flujo de booking funcionan con datos seed.
- **Observabilidad**: confirmar logs en Railway, métricas `/metrics`, eventos Sentry si se activa.
- **Seguridad**: revisar reportes de `security-scan.yml` y resolver hallazgos críticos.

---

## 5. Pendientes Conocidos

1. Monitorear y resolver los warnings de `pnpm docs:build` (enlaces/nav en MkDocs).
2. Definir política de cobertura: mantener el paso removido de Codecov o volver a activarlo con `CODECOV_TOKEN` documentado.
3. Verificar que los workflows de despliegue no sobrescriban variables sensibles ni falten secretos requeridos.
4. Registrar dominios, credenciales y responsables en `RUNBOOKS/GO_LIVE.md` y sincronizar `DEPLOYMENT_CHECKLIST.md` tras el primer despliegue.

---

## 6. Referencias Útiles

- `PRODUCTION_READINESS_REPORT.md`: snapshot de auditoría 2025-10-03.
- `PRODUCTION_AUDIT_REPORT.md`: resumen ejecutivo y próximos pasos.
- `DEPLOYMENT_CHECKLIST.md`: checklist operativo detallado (actualizar conforme se avance).
- `RUNBOOKS/`: procedimientos de go-live, incidentes y rollback.
- `infra/README.md`: índice de plantillas de infraestructura.

> Mantener este documento sincronizado después de cada despliegue real: registrar fechas, commits y responsables facilita auditorías futuras.

---

## 7. Checklist complementaria (referencias externas)

### Next.js 15.5.4 Production Checklist

- Revisar uso de **Dynamic APIs** (`cookies`, `searchParams`) para evitar forzar renderizado dinámico global; encapsular en `<Suspense>` donde sea necesario.
- Confirmar estrategias de **caching** (`fetch`, `unstable_cache`) y definir revalidaciones apropiadas.
- Asegurar **Server Actions** con validaciones y controles de acceso.
- Aplicar **Content Security Policy**, optimizar fuentes con `next/font` y usar `<Image>`/`<Script>` para mejorar Core Web Vitals.
- Ejecutar `next build` + `next start` y Lighthouse antes de promover a producción.
- Analizar bundles con `@next/bundle-analyzer` y monitorear impacto de dependencias externas.

Fuente: [Next.js Guides – Production Checklist (2025-09)](https://nextjs.org/docs/app/guides/production-checklist)

### Railway Production Readiness Checklist (2025-08)

- Seleccionar la región más cercana y habilitar **private networking** entre servicios.
- Configurar **restart policy** y al menos **2 replicas** para servicios críticos.
- Activar **Check Suites** y entornos diferenciados (staging/PR) antes de auto-desplegar.
- Versionar configuración con **config-as-code** (`railway.json` / `railway.toml`).
- Configurar alertas (Slack/webhooks) y **backups** automáticos.
- Considerar WAF o CDN (p.e. Cloudflare) para protección adicional de la capa pública.

Fuente: [Railway Docs – Production Readiness Checklist](https://docs.railway.com/reference/production-readiness-checklist)
