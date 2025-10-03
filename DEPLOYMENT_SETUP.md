# 🚀 Deployment Automation Setup Guide

**Objetivo**: consolidar la información y las credenciales necesarias para activar los despliegues automáticos (Railway + Vercel) a través de los workflows de GitHub Actions. Estado reflejado al 2025-10-03 (`main@f47c7e4`).

---

## 1. Resumen del estado actual

- 🔁 **Workflows definidos**: `deploy-staging.yml` y `deploy-production.yml` existen, pero faltan secretos (`RAILWAY_*`, `VERCEL_*`).
- 📦 **CI base**: `ci.yml` actualizado para omitir Codecov hasta decidir si se reintroduce con `CODECOV_TOKEN` (2025-10-03).
- 🧪 **Pruebas**: vitest (171 pruebas) pasa localmente; Playwright listo pero sin ejecución reciente en CI.
- 🧹 **Lint**: `pnpm lint` sin advertencias tras refactor de observabilidad (2025-10-03).
- 📚 **Docs**: `pnpm docs:build` genera warnings por enlaces/nav; ver `Documentation Standards` para resolverlos.
- 🛠️ **Infra**: no se ha validado el deployment real en Railway/Vercel dentro de este repo clonado.

> Antes de automatizar, ejecuta `pnpm build`, `pnpm typecheck` y `pnpm test:e2e` para mantener consistencia con la checklist de despliegue.

---

## 2. Credenciales y variables requeridas

| Destino        | Secreto / variable                   | Notas                                                                        |
| -------------- | ------------------------------------ | ---------------------------------------------------------------------------- |
| GitHub Actions | `CODECOV_TOKEN` (opcional)           | Necesario solo si se mantiene el paso de subida a Codecov.                   |
| GitHub Actions | `RAILWAY_STAGING_TOKEN`              | Token CLI con acceso al proyecto staging.                                    |
| GitHub Actions | `RAILWAY_PRODUCTION_TOKEN`           | Token CLI con acceso al proyecto producción.                                 |
| GitHub Actions | `VERCEL_TOKEN`                       | Token personal con permisos de deploy.                                       |
| GitHub Actions | `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` | IDs correspondientes a cada entorno (staging/prod).                          |
| GitHub Actions | `SNYK_TOKEN`, `SLACK_WEBHOOK_URL`    | Opcionales según workflows secundarios.                                      |
| Railway        | Variables de entorno API             | `DATABASE_URL`, `JWT_SECRET`, `WEB_APP_URL`, `CORS_ORIGIN`, `STRIPE_*`, etc. |
| Vercel         | Variables de entorno Web             | `NEXTAUTH_SECRET`, `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_APP_URL`, etc.        |

Mantén un inventario privado (1Password, Vault, etc.) con el valor de cada secreto y la fecha de rotación.

---

## 3. Cómo recolectar la información

### 3.1 Railway

```bash
railway login
railway whoami
railway projects list
railway variables --json            # Exporta variables por entorno
railway service list
```

Documenta:

- ID/nombre de proyecto y servicio (staging/prod).
- URL expuesta por Railway.
- Variables existentes vs. requeridas (ver checklist).

### 3.2 Vercel

```bash
vercel login
vercel link
vercel ls
vercel inspect <project-name>
vercel env ls --environment production
vercel env ls --environment preview
```

Anota:

- `VERCEL_ORG_ID` y `VERCEL_PROJECT_ID` (por entorno si usas proyectos separados).
- Variables configuradas actualmente.

### 3.3 GitHub

```bash
gh secret list
```

Confirma si ya existen secretos previos o si deben crearse/rotarse.

---

## 4. Cargar secretos en GitHub Actions

Ejemplo (copia y pega el valor cuando se solicite):

```bash
# Producción
gh secret set RAILWAY_PRODUCTION_TOKEN
gh secret set VERCEL_TOKEN
gh secret set VERCEL_ORG_ID
gh secret set VERCEL_PROJECT_ID

# Staging
gh secret set RAILWAY_STAGING_TOKEN

# Opcionales
gh secret set CODECOV_TOKEN
gh secret set SNYK_TOKEN
gh secret set SLACK_WEBHOOK_URL
```

> Usa `gh secret set --env` si prefieres configurarlos en ambientes específicos (`staging` / `production`).

---

## 5. Ajustes necesarios en los workflows

1. **Codecov**: decidir si se provee `CODECOV_TOKEN` o se elimina el paso (líneas 150-165 aprox. de `.github/workflows/ci.yml`).
2. **Railway** (`deploy-*.yml`): verificar que `serviceName` y rutas `apps/api` coincidan con el proyecto real. Ajustar comando de build si el workflow falla.
3. **Vercel** (`deploy-*.yml`): confirmar `working-directory: apps/web` y que el token tenga acceso a la organización.
4. **Filtros de ramas**: adaptar triggers a tu flujo (`main`/`develop`).
5. **Notificaciones**: habilitar Slack (opcional) una vez configurado `SLACK_WEBHOOK_URL`.

---

## 6. Checklist posterior a la carga de secretos

- [ ] Ejecutar manualmente `deploy-staging.yml` (`Actions → Deploy to Staging → Run workflow`).
- [ ] Revisar logs de Railway y Vercel para confirmar dominio y variables.
- [ ] Probar endpoints (`/`, `/healthz`, `/api/services`) y la web (`/auth/signin`, `/dashboard`).
- [ ] Actualizar `DEPLOYMENT_CHECKLIST.md` con resultados.
- [ ] Registrar dominios y credenciales en `RUNBOOKS/GO_LIVE.md`.

---

## 7. Próximos pasos sugeridos

1. Resolver las advertencias ESLint en la capa de observabilidad.
2. Alinear `engines.node` (apps/web) con `.nvmrc`/CI.
3. Definir responsable para rotación de llaves Stripe/Resend/Sentry.
4. Configurar monitoreo (Sentry DSN, Prometheus remoto, etc.).
5. Revisar `PRODUCTION_DEPLOYMENT_GUIDE.md` tras el primer despliegue real y actualizar fechas/resultados.

Con esta información centralizada, cualquier miembro del equipo puede habilitar y mantener los despliegues automáticos de forma segura.
