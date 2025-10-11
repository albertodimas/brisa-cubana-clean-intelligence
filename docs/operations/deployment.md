# Manual Deployment Guide

Proceso verificado para promover cambios de Brisa Cubana Clean Intelligence a los entornos gestionados en Vercel.

## 1. Pre-requisitos

- Branch `main` en verde (ver GitHub Actions: CI, CodeQL, Nightly si corresponde).
- `CHANGELOG.md` actualizado con los cambios a desplegar.
- Checklist de regresión ejecutada según [`qa/regression-checklist.md`](../qa/regression-checklist.md); adjuntar resultados en el PR.

## 2. Variables de entorno requeridas

Revisar y, si aplica, actualizar los valores en Vercel:

| Proyecto                                    | Variable                                                            | Entorno            | Notas                                                           |
| ------------------------------------------- | ------------------------------------------------------------------- | ------------------ | --------------------------------------------------------------- |
| API (`brisa-cubana-clean-intelligence-api`) | `DATABASE_URL`, `DATABASE_URL_UNPOOLED`                             | All                | Puntero a Neon (producción)                                     |
| API                                         | `JWT_SECRET`, `API_TOKEN`                                           | All                | Deben coincidir con seeds y Playwright                          |
| API                                         | `ALLOWED_ORIGINS`, `LOGIN_RATE_LIMIT`, `LOGIN_RATE_LIMIT_WINDOW_MS` | All                | Valores documentados en [`operations/security.md`](security.md) |
| Web (`brisa-cubana-clean-intelligence`)     | `NEXT_PUBLIC_API_URL`                                               | All                | Debe apuntar al dominio de la API correspondiente               |
| Web                                         | `INTERNAL_API_URL`                                                  | Production+Preview | URL interna para proxy                                          |
| Web                                         | `AUTH_SECRET`                                                       | All                | Debe coincidir con la API para sesiones válidas                 |

## 3. Despliegue

1. Merge a `main` activa automáticamente los builds en Vercel para `Production`.
2. Confirma que los pipelines (`CI (Main Branch)`, `CodeQL`) estén en verde antes de aprobar el despliegue.
3. En Vercel:
   - API: Tab **Deployments** → verifica que la última build de `main` tenga badge `Ready`.
   - Web: Mismo procedimiento. Asegúrate de que las build logs no tengan advertencias rojas.
4. Si se requiere despliegue manual (hotfix):
   ```bash
   vercel deploy --prod --scope <team> --confirm
   ```
   Usa el scope del equipo configurado (requiere `vercel login`).

## 4. Seed y migraciones

1. Migraciones Prisma se aplican automáticamente vía `prisma generate` + `tsc`. Si cambiaste el schema, sincroniza producción:
   ```bash
   pnpm --filter @brisa/api db:push
   ```
   > Ejecutar desde una máquina segura con `DATABASE_URL` apuntando a producción.
2. Después de cada schema change, corre el seed manual:
   ```bash
   pnpm --filter @brisa/api db:seed
   ```
3. Registra la ejecución en [`operations/backup-log.md`](backup-log.md) con fecha, responsable y resultado.

## 5. Verificación post-deploy

| Check           | Descripción                                                                                                 |
| --------------- | ----------------------------------------------------------------------------------------------------------- |
| Health API      | `GET https://brisa-cubana-clean-intelligence-api.vercel.app/health` devuelve `200` con estado `ok`.         |
| Admin login     | Autenticación en https://brisa-cubana-clean-intelligence.vercel.app/login con `admin@brisacubanaclean.com`. |
| Panel operativo | CRUD de servicios/propiedades/reservas visible solo para roles autorizados.                                 |
| Observabilidad  | Sentry recibe eventos de prueba (`pnpm exec sentry-cli send-event`).                                        |
| Rate limiting   | 6 intentos de login fallidos devuelven `429` en menos de 60 segundos (opcional).                            |

## 6. Rollback

1. Selecciona el deployment previo en Vercel y marca **Promote to Production**.
2. Ejecuta `pnpm --filter @brisa/api db:push` con el commit anterior si hubo cambios de schema.
3. Actualiza [`overview/status.md`](../overview/status.md) y `CHANGELOG.md` con el incidente.

## 7. Contactos

- Product Owner: `product@brisacubanaclean.com`
- DevOps Lead: `devops@brisacubanaclean.com`
- Seguridad: `security@brisacubanaclean.com`

> Mantén este documento sincronizado con cada cambio en pipelines o credenciales. Si un paso cambia, actualiza la tabla correspondiente y documenta el ajuste en el changelog.
