# 🚀 Guía de Despliegue a Producción

**Objetivo**: documentar el camino recomendado para promover Brisa Cubana Clean Intelligence desde el repositorio actual hacia un despliegue productivo seguro. Información verificada en la auditoría del 2025-10-03 sobre la rama `main` (`f47c7e4`).

---

## 1. Estado actual

| Área                        | Situación (2025-10-03)                                                                                                  |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Tests unitarios/integración | `pnpm --filter=@brisa/api exec vitest run --reporter=json` → ✅ 171/171 pruebas (~7s).                                  |
| Tests E2E                   | `pnpm test:e2e` → ✅ 15/15 escenarios Playwright con datos simulados.                                                   |
| Lint                        | `pnpm lint` → ✅ sin advertencias.                                                                                      |
| Build/typecheck             | `pnpm build` / `pnpm typecheck` → ✅ completados sin errores.                                                           |
| CI (`ci.yml`)               | Todos los jobs pasan salvo Codecov (paso removido por falta de `CODECOV_TOKEN`).                                        |
| Workflows de despliegue     | `deploy-production.yml` y `deploy-staging.yml` listos pero pendientes de secretos Railway/Vercel y validación de paths. |
| Infraestructura             | Plantillas en `infra/` (Railway, Vercel, GitOps, observabilidad, mesh, Terraform). Sin despliegues certificados.        |
| Documentación               | README y reportes actualizados; runbooks listos pero requieren responsables reales y tiempos definidos.                 |

---

## 2. Activos disponibles

### 2.1 Infraestructura como código

- `infra/terraform/`: módulos para Railway/Vercel y bases de datos. Requieren variables, backend remoto y pruebas.
- `infra/gitops/`, `infra/mesh/`, `infra/chaos-mesh/`, `infra/grafana/`, `infra/prometheus/`: manifiestos de referencia para fases siguientes.

### 2.2 Operaciones y runbooks

- `../runbooks/GO_LIVE.md`, `../runbooks/ROLLBACK.md`, `../runbooks/INCIDENT_RESPONSE.md`, `../runbooks/OPERATIONAL_READINESS_REVIEW.md`: guías secuenciales; necesitan asignar responsables y ventanas reales.

### 2.3 Contenedores

- `apps/api/Dockerfile` y `apps/web/Dockerfile`: multi-stage con base distroless y etiquetas OCI. Probados en local, faltan registros en registry.

### 2.4 Workflows de GitHub Actions

| Workflow                 | Propósito principal                      | Notas clave                                                                |
| ------------------------ | ---------------------------------------- | -------------------------------------------------------------------------- |
| `ci.yml`                 | Lint, typecheck, tests, build            | Paso de Codecov omitido hasta definir política oficial.                    |
| `deploy-production.yml`  | Despliegue a Railway/Vercel desde `main` | Requiere `RAILWAY_PRODUCTION_TOKEN`, `VERCEL_*`. No probado recientemente. |
| `deploy-staging.yml`     | Despliegue a entornos de staging         | Igual que producción, ajustar ramas y secretos.                            |
| `documentation.yml`      | Build MkDocs + artefactos                | Necesita token con permisos sobre `gh-pages` o almacenamiento equivalente. |
| `payments-reconcile.yml` | Conciliación Stripe                      | Depende de `STRIPE_*`.                                                     |
| `security-scan.yml`      | TruffleHog, Snyk, Trivy, Cosign, OPA     | Requiere `SNYK_TOKEN` y acceso a `ghcr.io`.                                |
| `codeql.yml`             | Análisis estático programado             | Usa configuración estándar; revisar resultados en la pestaña Security.     |

---

## 3. Plan recomendado

### 3.1 Preparación local

1. Instalar dependencias y preparar base de datos:
   ```bash
   pnpm install
   pnpm db:setup
   ```
2. Ejecutar verificaciones completas:
   ```bash
   pnpm lint
   pnpm typecheck
   pnpm build
   pnpm test
   pnpm test:e2e
   pnpm docs:build
   ```
3. Documentar cualquier desviación en `DEPLOYMENT_CHECKLIST.md`.

### 3.2 Secretos y variables

- **GitHub Actions** (`Settings → Secrets and variables → Actions`):
  - `RAILWAY_PRODUCTION_TOKEN`, `RAILWAY_STAGING_TOKEN`.
  - `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` (por entorno).
  - `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` (si se automatiza conciliación).
  - `SNYK_TOKEN`, `SLACK_WEBHOOK_URL`, `CODECOV_TOKEN` (opcional).
- **Railway/Vercel**: replicar variables de `DEPLOYMENT_CHECKLIST.md` (`DATABASE_URL`, `JWT_SECRET`, `NEXTAUTH_SECRET`, `NEXT_PUBLIC_API_URL`, etc.).
- **Repositorios privados**: registrar valores y fechas de rotación en el gestor corporativo de secretos.

### 3.3 Ajustes a pipelines

1. Revisar `ci.yml` para confirmar versión de Node (24.9.0) y caching correcto de pnpm.
2. Actualizar `deploy-*.yml` con nombres reales de servicios Railway y proyectos Vercel.
3. Habilitar entornos protegidos (GitHub Environments) si se requiere aprobación manual.
4. Configurar branch protection (`main`, `develop`) exigiendo `ci.yml` y mínimo un reviewer.

### 3.4 Primer despliegue controlado

1. **API (Railway)**

   ```bash
   cd apps/api
   pnpm build
   railway up
   ```

   Validar con `curl https://<dominio>/healthz` y `curl https://<dominio>/api/services`.

2. **Web (Vercel)**

   ```bash
   cd apps/web
   pnpm build
   vercel deploy --prod
   ```

   Confirmar que `NEXT_PUBLIC_API_URL` apunta a la API desplegada.

3. **Stripe/Webhooks**
   - Crear endpoint en Stripe Dashboard.
   - Actualizar `STRIPE_WEBHOOK_SECRET` en Railway y GitHub.
   - Probar con `./scripts/stripe_trigger.sh`.

4. Registrar resultados (URLs, responsables, incidencias) en `DEPLOYMENT_CHECKLIST.md` y `../runbooks/GO_LIVE.md`.

---

## 4. Validaciones posteriores

- **API**: `/healthz`, `/api/services`, `/api/bookings` (requiere token) responden con 200.
- **Web**: login, creación/edición de reservas y visualización de reportes funciona con datos seed.
- **Observabilidad**: logs en Railway, métricas `/metrics`, eventos Sentry si se habilita DSN.
- **Seguridad**: revisar reportes de `security-scan.yml` y resolver hallazgos críticos.

---

## 5. Pendientes conocidos

1. Definir política de cobertura (mantener reporte manual o reactivar Codecov).
2. Validar que `security-scan.yml` y `payments-reconcile.yml` cuenten con secretos y permisos necesarios.
3. Completar runbooks con nombres de responsables y ventanas de mantenimiento.
4. Configurar alertas automáticas (Slack, email) antes de abrir tráfico público.

---

## 6. Referencias

- `PRODUCTION_READINESS_REPORT.md`: snapshot completo de la auditoría.
- `PRODUCTION_AUDIT_REPORT.md`: resumen ejecutivo para stakeholders.
- `DEPLOYMENT_CHECKLIST.md`: checklist operativo a actualizar en cada release.
- `DEPLOYMENT_SETUP.md`: guía para recolectar y cargar secretos.
- `../runbooks/`: procedimientos de go-live, rollback e incidentes.

Mantén esta guía sincronizada tras cada despliegue real para facilitar auditorías futuras.

---

## 7. Checklists externas útiles

### Next.js 15.5.4

- Evita renderizado dinámico global revisando el uso de `cookies` y `searchParams`.
- Define políticas de caché (`fetch`, `revalidatePath`, `revalidateTag`).
- Asegura Server Actions con validaciones y control de acceso.
- Configura CSP, usa `next/font` y componentes `<Image>`/`<Script>` para optimizar CWV.
- Ejecuta `next build && next start` + Lighthouse antes de promover a producción.
- Analiza bundles con `@next/bundle-analyzer`.

### Railway (2025-08)

- Selecciona región adecuada y habilita _private networking_.
- Configura restart policy y al menos 2 réplicas para servicios críticos.
- Versiona configuración con `railway.toml` y aplica _config-as-code_.
- Habilita alertas (Slack/webhooks) y backups automáticos.
- Evalúa protección adicional (CDN/WAF) para endpoints públicos.
