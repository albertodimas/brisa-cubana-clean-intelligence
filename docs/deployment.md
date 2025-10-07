# Guía de despliegue

Esta guía describe el pipeline CI/CD y cómo desplegar la aplicación en Vercel (frontend) y Railway (API + PostgreSQL).

## 1. GitHub Actions

El workflow `.github/workflows/ci.yml` ejecuta en cada push/PR:

1. `pnpm install --frozen-lockfile`
2. `pnpm --filter @brisa/api db:push --force-reset`
3. `pnpm --filter @brisa/api db:seed`
4. `pnpm lint`
5. `pnpm typecheck`
6. `pnpm test`
7. `pnpm build`

### Servicios
- Postgres 16 se levanta como servicio (`postgres:16-alpine`) y se usa el `DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/brisa_ci`.

### Secretos requeridos
Configura en **Repository Settings → Secrets and variables → Actions**:

| Clave         | Descripción |
| ------------- | ----------- |
| `API_TOKEN`   | Token interno para operaciones server-to-server |
| `JWT_SECRET`  | Secreto de firma JWT (64+ chars) |
| `VERCEL_TOKEN` *(opcional)* | Para despliegues automáticos desde CI |
| `RAILWAY_TOKEN` *(opcional)* | Para despliegues automáticos desde CI |

> Si un secreto no está definido, el pipeline usará valores vacíos y los pasos seguirán ejecutándose, pero las acciones autenticadas (login/panel) fallarán, por lo que se recomienda configurarlos antes de abrir PRs.

## 2. Vercel (Frontend)

1. `vercel link` y selecciona `apps/web` como directorio raíz.
2. Variables en Vercel:
   - `NEXT_PUBLIC_API_URL` → URL pública de la API (Railway/Vercel serverless).
   - `API_TOKEN` → mismo valor definido en GitHub.
3. Comando de build: `pnpm --filter @brisa/web build`
4. Output: `.next`

## 3. Railway (API + PostgreSQL)

1. Crea un proyecto con dos servicios:
   - **PostgreSQL** (plan gratuito o pago según demanda)
   - **Node** para la API (`apps/api`)
2. Variables de entorno en el servicio API:
   | Variable       | Valor |
   | -------------- | ----- |
   | `DATABASE_URL` | URL provista por Railway |
   | `API_TOKEN`    | Token compartido con frontend |
   | `JWT_SECRET`   | Secreto JWT |
   | `NODE_ENV`     | `production` |
3. Nixpacks build commands (definidos en `railway.toml`):
   - Install: `pnpm install --frozen-lockfile --filter @brisa/api`
   - Build: `pnpm --filter @brisa/api build`
   - Start: `pnpm --filter @brisa/api start`
4. Añade step `pnpm --filter @brisa/api db:push && pnpm --filter @brisa/api db:seed` como _Deployment Hook_ tras cada build.

## 4. Flujo recomendado

1. Merge en `main` → CI debe quedar en verde.
2. Ejecuta `pnpm db:push` y `pnpm db:seed` en staging/producción según corresponda.
3. Despliega:
   - Frontend: `vercel --prod` (o a través de GitHub integration).
   - API: Railway auto-deploy tras push.
4. Validaciones post despliegue:
   - `GET /health` debe responder `{ status: "pass" }`.
   - Autenticarse en `/login` y crear un servicio en el panel.
5. Documenta la versión en `Releases` (tag opcional `vX.Y.Z`).

## 5. Checklist previo a producción

- [ ] CI en verde (lint, typecheck, tests, build)
- [ ] Base de datos migrada (`pnpm db:push`)
- [ ] Seeds ejecutados (`pnpm db:seed`)
- [ ] Secrets actualizados (`API_TOKEN`, `JWT_SECRET`, claves externas)
- [ ] Verificación en staging de creación de servicio, propiedad y reserva
- [ ] Monitoreo/alertas activadas (OTel/Grafana pendiente)
