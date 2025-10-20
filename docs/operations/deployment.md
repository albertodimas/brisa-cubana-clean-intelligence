# Manual Deployment Guide

Proceso verificado para promover cambios de Brisa Cubana Clean Intelligence a los entornos gestionados en Vercel.

## 1. Pre-requisitos

- Branch `main` en verde (ver GitHub Actions: CI, CodeQL, Nightly si corresponde).
- `CHANGELOG.md` actualizado con los cambios a desplegar.
- Checklist de regresión ejecutada según [`qa/regression-checklist.md`](../qa/regression-checklist.md); adjuntar resultados en el PR.

## 2. Variables de entorno requeridas

Revisar y, si aplica, actualizar los valores en Vercel:

| Proyecto                                    | Variable                                                                                                                                                    | Entorno             | Notas                                                                          |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- | ------------------------------------------------------------------------------ |
| API (`brisa-cubana-clean-intelligence-api`) | `DATABASE_URL`, `DATABASE_URL_UNPOOLED`                                                                                                                     | All                 | Puntero a Neon (producción)                                                    |
| API                                         | `JWT_SECRET`, `API_TOKEN`                                                                                                                                   | All                 | Deben coincidir con seeds y Playwright                                         |
| API                                         | `ALLOWED_ORIGINS`, `LOGIN_RATE_LIMIT`, `LOGIN_RATE_LIMIT_WINDOW_MS`                                                                                         | All                 | Valores documentados en [`operations/security.md`](security.md)                |
| API/Stripe                                  | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`                                                                                                                | All                 | Modo test en Preview/Dev, modo live en Production                              |
| API (Portal cliente)                        | `PORTAL_MAGIC_LINK_FROM`, `PORTAL_MAGIC_LINK_SMTP_*`, `PORTAL_MAGIC_LINK_BASE_URL`, `PORTAL_MAGIC_LINK_CONFIRMATION_PATH`, `PORTAL_MAGIC_LINK_EXPOSE_DEBUG` | Production, Preview | SMTP obligatorio; `PORTAL_MAGIC_LINK_EXPOSE_DEBUG="false"` en producción.      |
| Web (`brisa-cubana-clean-intelligence`)     | `NEXT_PUBLIC_API_URL`                                                                                                                                       | All                 | Debe apuntar al dominio de la API correspondiente                              |
| API                                         | `HEALTH_CHECK_TOKEN`                                                                                                                                        | All                 | Token opcional para /healthz (usar en monitores externos).                     |
| Web                                         | `INTERNAL_API_URL`                                                                                                                                          | Production+Preview  | URL interna para proxy                                                         |
| Web                                         | `AUTH_SECRET`                                                                                                                                               | All                 | Debe coincidir con la API para sesiones válidas                                |
| Web (Stripe)                                | `STRIPE_PUBLISHABLE_KEY`                                                                                                                                    | All                 | Clave pública usada por Stripe.js                                              |
| Web (Leads opcional)                        | `LEAD_WEBHOOK_URL`                                                                                                                                          | Production+Preview  | Endpoint HTTPS (Slack/CRM) que recibirá payloads del formulario público        |
| Web (Log drains)                            | `LOG_DRAIN_VERIFICATION_CODE`                                                                                                                               | All                 | Código devuelto en `x-vercel-verify` para validar el endpoint `/api/logdrain`. |
| Web (Analítica)                             | `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`                                                                                                       | All                 | API key y host para PostHog (`https://us.posthog.com` por defecto).            |

## 3. Configuración de Dominios Personalizados

### Dominios de producción

> ℹ️ **Salud de la API**: `/healthz` y `/api/healthz` se reescriben desde el proyecto web hacia la API. Si usas un dominio personalizado diferente o deshabilitas las rewrites, asegúrate de mantener una regla equivalente en Vercel para evitar redirecciones a `/login`.

| Dominio                                | Proyecto | Propósito                           |
| -------------------------------------- | -------- | ----------------------------------- |
| `brisacubanacleanintelligence.com`     | Web      | Landing + Checkout + Portal + Panel |
| `www.brisacubanacleanintelligence.com` | Web      | Redirect 301 → dominio raíz         |
| `api.brisacubanacleanintelligence.com` | API      | Backend Hono + Prisma               |

**Procedimiento recomendado**

1. Desde el proyecto **web**, elimina cualquier alias previo a `api.brisacubanacleanintelligence.com` para evitar conflictos. Puedes hacerlo desde _Settings → Domains_ o ejecutando `vercel alias rm api.brisacubanacleanintelligence.com`.
2. En el proyecto **API**, añade el dominio `api.brisacubanacleanintelligence.com` (Settings → Domains o `vercel domains add api.brisacubanacleanintelligence.com`) y, una vez disponible el deployment productivo deseado, asígnalo con `vercel alias set <deployment-url> api.brisacubanacleanintelligence.com`.
3. Si administras el DNS fuera de Vercel, crea/actualiza el registro CNAME del subdominio para que apunte a `cname.vercel-dns.com`. Si usas Vercel DNS, no se requieren cambios adicionales.
4. Verifica que la respuesta `GET https://api.brisacubanacleanintelligence.com/health` devuelva `200` antes de actualizar configuraciones (por ejemplo, `NEXT_PUBLIC_API_URL`) en web, GitHub y workflows.

### Certificados SSL

Vercel genera y renueva automáticamente certificados SSL/TLS (Let's Encrypt). No se requiere acción manual.

### Verificación DNS

Los dominios utilizan los nameservers administrados por Vercel:

- `ns1.vercel-dns.com`
- `ns2.vercel-dns.com`

La propagación global suele completarse en <1 hora (máximo 48 h).

> **Estado 15-oct-2025:** Se cargaron claves de ejemplo (`stripe_test_secret_demo_20251015`, `stripe_test_publishable_demo_20251015`, `stripe_test_webhook_demo_20251015`) en los entornos Development/Preview/Production del proyecto API. Reemplazar por las credenciales oficiales del equipo antes de activar modo live.

> **Portal cliente:** Configura SMTP con proveedor confiable. En producción establece `PORTAL_MAGIC_LINK_EXPOSE_DEBUG="false"` y elimina `ENABLE_TEST_UTILS` para evitar tokens de depuración.

> **Captura de leads:** Si no configuras `LEAD_WEBHOOK_URL` el formulario en `/` seguirá funcionando pero solo registrará un log server-side. Para integraciones con Slack o CRM usa un webhook HTTPS (por ejemplo, Slack Incoming Webhook) y verifica la entrega con el comando (o ejecuta `scripts/test-lead-webhook.sh` tras exportar la variable):
>
> ```bash
> curl -X POST "$LEAD_WEBHOOK_URL" \
>   -H "Content-Type: application/json" \
>   -d '{"event":"landing_lead.test","payload":{"name":"qa","email":"qa@example.com","propertyCount":"1-5 unidades"}}'
> ```

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

> **Rotación 18-oct-2025:** Se cargaron las credenciales live etiquetadas como `stripe/live/2025-10-20/example` en Vercel y GitHub, y se coordinó la validación del flujo live para el 20-oct-2025.
>
> **Validación 20-oct-2025 (10:05 ET):**
>
> - Se reemplazaron las llaves placeholder por las credenciales live almacenadas en 1Password (entrada “Stripe Live Keys · 2025-10-20”) en Vercel (development/preview/production) y en los secretos de GitHub Actions.
> - Comandos ejecutados desde Stripe CLI:
>   - `stripe trigger checkout.session.completed`
>   - `stripe trigger payment_intent.payment_failed`
> - Resultados: ambos eventos registrados como `200 OK` en `/api/payments/stripe/webhook`; se observaron logs en Vercel (`checkout.session.completed`, `payment_intent.payment_failed`) y breadcrumbs en Sentry sin errores.

- Se revocaron las llaves antiguas en el dashboard de Stripe y se adjuntó evidencia en 1Password (nota “Stripe Live Keys · 2025-10-20”).
- **Rotación 19-oct-2025 (22:40 UTC):** Se regeneró la firma live del webhook desde Stripe CLI y se actualizó el secreto `STRIPE_WEBHOOK_SECRET` en GitHub Actions con el nuevo valor. Falta replicar la actualización en Vercel y revocar la firma previa en el dashboard de Stripe.

### 2.2 Log drains en Vercel

1. **Definir código de verificación.** Configura `LOG_DRAIN_VERIFICATION_CODE` en Development, Preview y Production del proyecto web en Vercel. Replica el valor como secreto en GitHub Actions.
2. **Verificar endpoint.** Comprueba que `/api/logdrain` responde el header correcto: `curl -I https://brisa-cubana-clean-intelligence.vercel.app/api/logdrain | grep -i x-vercel-verify`.
3. **Crear el drain.** Ejecuta:
   ```bash
   export VERCEL_TOKEN="tu_token"
   curl -X POST "https://api.vercel.com/v2/log-drains?teamId=team_GI7iQ5ivPN36nVRB1Y9IJ9UW" \
     -H "Authorization: Bearer $VERCEL_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "name": "brisa-prod-logdrain",
       "url": "https://brisa-cubana-clean-intelligence.vercel.app/api/logdrain",
       "secret": "rotar-este-secreto",
       "deliveryFormat": "json",
       "projectIds": ["prj_n11x8GsVN5qDw0eOFAcQiOfpc0Zg"],
       "sources": ["edge", "lambda", "build", "static"],
       "environments": ["production"]
     }'
   ```
4. **Consumir registros.** Configura el colector externo para validar `x-vercel-signature` con el `secret`. Al rotar la clave, actualiza primero Vercel/GitHub antes de recrear el drain.

### 2.3 Secretos usados en CI/CD

| Secreto                                                                                      | Uso                                                                   |
| -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `API_TOKEN`, `JWT_SECRET`, `AUTH_SECRET`                                                     | Seeds y autenticación en suites Playwright.                           |
| `LOG_DRAIN_VERIFICATION_CODE`                                                                | Verificación del endpoint `/api/logdrain` en CI y creación de drains. |
| `E2E_ADMIN_EMAIL`, `E2E_ADMIN_PASSWORD`, `E2E_COORDINATOR_EMAIL`, `E2E_COORDINATOR_PASSWORD` | Credenciales sembradas para smoke/critical.                           |
| `PORTAL_MAGIC_LINK_*`                                                                        | Flujos de enlaces mágicos (Nightly).                                  |
| `PRODUCTION_DATABASE_URL`, `PRODUCTION_DATABASE_URL_UNPOOLED`                                | Workflow `Post-Deploy Seed`.                                          |

## 4. Despliegue

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

## 5. Seed y migraciones

1. Migraciones Prisma se aplican automáticamente vía `prisma generate` + `tsc`. Si cambiaste el schema, sincroniza producción ejecutando las migraciones generadas:
   ```bash
   pnpm --filter @brisa/api db:deploy
   ```
   > Ejecuta el comando desde una máquina segura con `DATABASE_URL` apuntando a producción. Evita `db:push` en entornos productivos.
   >
   > **Nueva herramienta:** el workflow `post-deploy-seed.yml` llama a `scripts/prisma-deploy-or-baseline.sh`, que reintenta `db:deploy` marcando las migraciones existentes como aplicadas cuando Prisma detecta el error `P3005` (base ya inicializada). Usa el script manualmente en incidentes similares:
   >
   > ```bash
   > ./scripts/prisma-deploy-or-baseline.sh
   > ```
   >
   > Revisa la salida para confirmar si se ejecutó el fallback y documenta el resultado en `operations/backup-log.md`.
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

## 6. Verificación post-deploy

| Check           | Descripción                                                                                                                                                                                       |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Health API      | `GET https://api.brisacubanacleanintelligence.com/health` devuelve `200` con estado `ok`.                                                                                                         |
| Admin login     | Autenticación en https://brisacubanacleanintelligence.com/login con `admin@brisacubanaclean.com`.                                                                                                 |
| Lighthouse CI   | Ejecuta `pnpm exec lhci autorun --config=.lighthouserc.preview.json`; ignora solo las advertencias conocidas (`legacy-javascript`, `render-blocking-insight`, `network-dependency-tree-insight`). |
| Robots/Sitemap  | `curl -I https://brisacubanacleanintelligence.com/robots.txt` y `.../sitemap.xml` → deben responder `200` sin redirecciones a `/login`.                                                           |
| Panel operativo | CRUD de servicios/propiedades/reservas visible solo para roles autorizados.                                                                                                                       |
| Observabilidad  | Sentry recibe eventos de prueba (`pnpm exec sentry-cli send-event`).                                                                                                                              |
| Rate limiting   | 6 intentos de login fallidos devuelven `429` en menos de 60 segundos (opcional).                                                                                                                  |

## 7. Rollback

1. Selecciona el deployment previo en Vercel y marca **Promote to Production**.
2. Ejecuta `pnpm --filter @brisa/api db:deploy` con el commit anterior si hubo cambios de schema.
3. Actualiza [`overview/status.md`](../overview/status.md) y `CHANGELOG.md` con el incidente.

## 7. Contactos

- Product Owner: `product@brisacubanaclean.com`
- DevOps Lead: `devops@brisacubanaclean.com`
- Seguridad: `security@brisacubanaclean.com`

> Mantén este documento sincronizado con cada cambio en pipelines o credenciales. Si un paso cambia, actualiza la tabla correspondiente y documenta el ajuste en el changelog.

## 8. Automatización post-deploy

- El workflow `post-deploy-seed.yml` se ejecuta automáticamente cuando `CI (Main Branch)` finaliza en verde sobre `main`.
- Ejecuta `pnpm --filter @brisa/api db:deploy` seguido de `pnpm --filter @brisa/api db:seed:operativo` contra la base de datos de producción.
- Requiere configurar los secretos en GitHub:
  - `PRODUCTION_DATABASE_URL`
  - `PRODUCTION_DATABASE_URL_UNPOOLED` (opcional, usa el valor anterior si no está definido)
  - `API_TOKEN`, `JWT_SECRET`, `AUTH_SECRET` para mantener coherencia con los seeds.
- Los resultados quedan registrados en la pestaña **Actions**. Ante un fallo, revisar la salida y ejecutar manualmente el procedimiento descrito en este documento.
- La Nightly (`nightly.yml`) invoca la pipeline con `enable-test-utils: "false"` para validar el portal cliente con envío real de correos; replica este valor en despliegues manuales cuando quieras simular producción a partir de CI.
