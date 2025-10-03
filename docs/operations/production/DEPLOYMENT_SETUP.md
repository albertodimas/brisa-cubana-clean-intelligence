# 🚀 Guía de Configuración para Despliegues Automatizados

**Objetivo**: centralizar la información y las credenciales necesarias para habilitar los despliegues automáticos (Railway + Vercel) a través de los workflows de GitHub Actions. Estado verificado al 2025-10-03 (`main@f47c7e4`).

---

## 1. Estado actual

- 🔁 **Workflows disponibles**: `deploy-staging.yml` y `deploy-production.yml` definidos, pendientes de secretos `RAILWAY_*` y `VERCEL_*`.
- 📦 **CI base**: `ci.yml` actualizado; el paso de Codecov se mantiene deshabilitado hasta definir política de cobertura.
- 🧪 **Pruebas**: Vitest (171 pruebas) y Playwright (15 escenarios) verificadas en local.
- 🧹 **Lint**: `pnpm lint` sin advertencias.
- 📚 **Documentación**: `pnpm docs:build` sin warnings.
- 🛠️ **Infra**: no se ha registrado un despliegue real en Railway/Vercel desde este repositorio clonado.

> Antes de automatizar, ejecuta `pnpm build`, `pnpm typecheck`, `pnpm test` y `pnpm test:e2e` para asegurar un baseline saludable.

---

## 2. Secretos y variables requeridos

| Destino        | Secreto / variable                   | Descripción                                                                  |
| -------------- | ------------------------------------ | ---------------------------------------------------------------------------- |
| GitHub Actions | `RAILWAY_STAGING_TOKEN`              | Token CLI con acceso al proyecto de staging.                                 |
| GitHub Actions | `RAILWAY_PRODUCTION_TOKEN`           | Token CLI con acceso al proyecto productivo.                                 |
| GitHub Actions | `VERCEL_TOKEN`                       | Token personal con permisos de deploy.                                       |
| GitHub Actions | `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` | IDs de la organización/proyecto en Vercel (por entorno).                     |
| GitHub Actions | `STRIPE_SECRET_KEY`                  | Solo si se ejecuta conciliación automática (`payments-reconcile.yml`).       |
| GitHub Actions | `STRIPE_WEBHOOK_SECRET`              | Requerido para probar webhooks Stripe en staging/prod.                       |
| GitHub Actions | `SNYK_TOKEN`, `SLACK_WEBHOOK_URL`    | Opcionales según workflows secundarios (seguridad/notificaciones).           |
| GitHub Actions | `CODECOV_TOKEN`                      | Opcional; habilita subida de cobertura si se decide reactivar Codecov.       |
| Railway        | Variables de entorno API             | `DATABASE_URL`, `JWT_SECRET`, `WEB_APP_URL`, `CORS_ORIGIN`, `STRIPE_*`, etc. |
| Vercel         | Variables de entorno Web             | `NEXTAUTH_SECRET`, `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_APP_URL`, etc.        |

Mantén un inventario privado (1Password, Vault, etc.) con valor, responsable y fecha de rotación de cada secreto.

---

## 3. Recolección de información

### 3.1 Railway

```bash
railway login
railway whoami
railway projects list
railway variables --json
railway service list
```

Registra ID/nombre de proyecto, servicios, dominios y variables actuales versus requeridas.

### 3.2 Vercel

```bash
vercel login
vercel link
vercel ls
vercel inspect <project-name>
vercel env ls --environment production
vercel env ls --environment preview
```

Obtén `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` y el listado de variables configuradas.

### 3.3 GitHub

```bash
gh secret list
```

Confirma qué secretos existen y cuáles faltan.

---

## 4. Carga de secretos en GitHub Actions

```bash
# Producción
gh secret set RAILWAY_PRODUCTION_TOKEN
gh secret set VERCEL_TOKEN
gh secret set VERCEL_ORG_ID
gh secret set VERCEL_PROJECT_ID

# Staging
gh secret set RAILWAY_STAGING_TOKEN

gh secret set STRIPE_SECRET_KEY
gh secret set STRIPE_WEBHOOK_SECRET

# Opcionales
gh secret set CODECOV_TOKEN
gh secret set SNYK_TOKEN
gh secret set SLACK_WEBHOOK_URL
```

> Usa `gh secret set --env <environment>` si prefieres gestionarlos por entorno (`staging`, `production`).

---

## 5. Ajustes en workflows

1. Validar que `ci.yml` utilice Node 24.9.0 y caché de `pnpm` en `setup-node`.
2. Revisar `deploy-*.yml` para confirmar rutas (`apps/api`, `apps/web`) y comandos de build.
3. Configurar entornos protegidos en GitHub Actions si se requiere aprobación manual previo a producción.
4. Activar branch protection en `main` y `develop` con `ci.yml` como check obligatorio.
5. Habilitar notificaciones (Slack) una vez disponible `SLACK_WEBHOOK_URL`.

---

## 6. Checklist tras cargar secretos

- [ ] Ejecutar manualmente `deploy-staging.yml` (`Actions → Deploy to Staging → Run workflow`).
- [ ] Verificar logs en Railway y Vercel; confirmar dominios y variables aplicadas.
- [ ] Probar endpoints (`/healthz`, `/api/services`) y frontend (`/auth/signin`, `/dashboard`).
- [ ] Actualizar `DEPLOYMENT_CHECKLIST.md` con resultados, responsables y fechas.
- [ ] Registrar credenciales y dominios definitivos en `../runbooks/GO_LIVE.md`.

---

## 7. Próximos pasos sugeridos

1. Definir política de cobertura y comunicarla al equipo (mantener control manual o reactivar Codecov).
2. Establecer responsables de rotación de llaves Stripe, Resend, Sentry y LLM.
3. Configurar monitoreo (Sentry DSN, Prometheus remoto, alertas) antes del primer release público.
4. Revisar `PRODUCTION_DEPLOYMENT_GUIDE.md` después de cada despliegue y actualizar fechas/indicadores.

Con estos pasos el equipo podrá habilitar despliegues automáticos de forma controlada y trazable.
