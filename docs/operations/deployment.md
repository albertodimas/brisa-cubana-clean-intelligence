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
| API/Stripe                                  | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`                        | All                | Modo test en Preview/Dev, modo live en Production               |
| Web (`brisa-cubana-clean-intelligence`)     | `NEXT_PUBLIC_API_URL`                                               | All                | Debe apuntar al dominio de la API correspondiente               |
| Web                                         | `INTERNAL_API_URL`                                                  | Production+Preview | URL interna para proxy                                          |
| Web                                         | `AUTH_SECRET`                                                       | All                | Debe coincidir con la API para sesiones válidas                 |
| Web (Stripe)                                | `STRIPE_PUBLISHABLE_KEY`                                            | All                | Clave pública usada por Stripe.js                               |

> **Estado 15-oct-2025:** Se cargaron claves de ejemplo `sk_test_brisa_demo_20251015`, `pk_test_brisa_demo_20251015` y `whsec_brisa_demo_20251015` en los entornos Development/Preview/Production del proyecto API. Reemplazar por las credenciales oficiales del equipo antes de activar modo live.

### 2.1 Rotación de claves Stripe (modo live)

1. **Preparar nuevas llaves**
   - Genera claves live (`Publishable`, `Secret`, `Webhook signing secret`) en el dashboard de Stripe.
   - Documenta los valores en el vault del equipo (1Password) con fecha de generación.
2. **Actualizar secretos (ventana de mantenimiento corta)**
   - `vercel env add STRIPE_SECRET_KEY production`
   - `vercel env add STRIPE_PUBLISHABLE_KEY production`
   - `vercel env add STRIPE_WEBHOOK_SECRET production`
   - Repite el proceso para `preview` y `development` si corresponde.
3. **Reconfigurar GitHub Actions post-deploy**
   - `gh secret set STRIPE_SECRET_KEY --env production`
   - `gh secret set STRIPE_WEBHOOK_SECRET --env production`
4. **Validar**
   - Ejecuta `stripe trigger checkout.session.completed` y `payment_intent.payment_failed` apuntando al endpoint `/api/payments/stripe/webhook`.
   - Verifica en `/checkout` que la clave pública live esté activa (inspecciona `window.Stripe`).
   - Revisa logs en Vercel y Sentry para confirmar recepción de eventos.
5. **Revocar claves antiguas**
   - En el dashboard de Stripe marca como "revoke" las claves anteriores para evitar uso accidental.
   - Actualiza la tabla de variables en este documento con fecha de rotación.
6. Consulta el [runbook detallado](stripe-rotation-checklist.md) para checklist previo/post evento y comandos de validación.

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

1. Migraciones Prisma se aplican automáticamente vía `prisma generate` + `tsc`. Si cambiaste el schema, sincroniza producción ejecutando las migraciones generadas:
   ```bash
   pnpm --filter @brisa/api db:deploy
   ```
   > Ejecuta el comando desde una máquina segura con `DATABASE_URL` apuntando a producción. Evita `db:push` en entornos productivos.
2. Después de cada schema change, corre los seeds en este orden:

   ```bash
   pnpm --filter @brisa/api db:seed:operativo
   pnpm --filter @brisa/api db:seed:demo
   ```

   - **Producción:** ejecuta únicamente `db:seed:operativo` (credenciales internas). Usa `db:seed:demo` solo en entornos de demo/preview.
   - **Staging/Local:** ejecuta ambos para contar con datos ficticios del landing y checkout.

3. Registra la ejecución en [`operations/backup-log.md`](backup-log.md) con fecha, responsable y resultado.

### Stripe CLI (modo test)

Para validar los webhooks en local o staging:

```bash
pnpm stripe:listen
```

En otra terminal puedes disparar eventos de prueba, por ejemplo:

```bash
stripe trigger checkout.session.completed
```

Los eventos se reenviarán a `http://localhost:3001/api/payments/stripe/webhook` y quedarán registrados en la consola.

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

## 8. Automatización post-deploy

- El workflow `post-deploy-seed.yml` se ejecuta automáticamente cuando `CI (Main Branch)` finaliza en verde sobre `main`.
- Ejecuta `pnpm --filter @brisa/api db:push` seguido de `pnpm --filter @brisa/api db:seed` contra la base de datos de producción.
- Requiere configurar los secretos en GitHub:
  - `PRODUCTION_DATABASE_URL`
  - `PRODUCTION_DATABASE_URL_UNPOOLED` (opcional, usa el valor anterior si no está definido)
  - `API_TOKEN`, `JWT_SECRET`, `AUTH_SECRET` para mantener coherencia con los seeds.
- Los resultados quedan registrados en la pestaña **Actions**. Ante un fallo, revisar la salida y ejecutar manualmente el procedimiento descrito en este documento.
