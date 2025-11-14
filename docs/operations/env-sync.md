# Sincronización de Variables de Entorno

> ✅ Referencia rápida: ejecuta `pnpm env:status` para validar que `.env.local` cumple con el manifest central (`config/env.manifest.json`). Si quieres que el comando devuelva código de error cuando falte alguna variable (por ejemplo en CI), usa `pnpm env:status --strict`. Actualiza el manifest cuando añadas o elimines claves para evitar duplicados entre Vercel, GitHub Actions y desarrollo.

> ⚠️ La API ya no arranca si falta `ALLOWED_ORIGINS`. Asegúrate de que el proyecto **brisa-cubana-clean-intelligence-api** en Vercel tenga ese valor definido en `development`, `preview` y `production` antes de desplegar.

> 🔄 Para mantener protegido el health check público, sincroniza el `HEALTH_CHECK_TOKEN` de Vercel con GitHub siempre que se rote: `pnpm env:sync-health-token`. El comando descarga los envs de producción del proyecto API y actualiza automáticamente el secreto del repositorio mediante `gh secret set`.

La plataforma ejecuta automáticamente esta verificación todos los lunes a las 06:00 UTC mediante el workflow `Env Manifest Audit`. Si aparece en rojo, revisa los pasos inferiores y corrige los entornos antes de volver a ejecutar manualmente el job (`Actions → Env Manifest Audit → Run workflow`).

Pasos para alinear los valores de entorno propios del proxy web y del portal cliente después de retirar `API_TOKEN`.

## 1. Vercel – Proyecto Web (`brisa-cubana-clean-intelligence`)

1. Comprobar valores locales:
   ```bash
   grep -E "^(PROXY_ALLOWED_ORIGINS|PORTAL_MAGIC_LINK_EXPOSE_DEBUG)" .env.local
   ```
2. Propagar a cada entorno con la CLI (usa el scope del equipo):

   ```bash
   export VERCEL_ORG_ID=team_GI7iQ5ivPN36nVRB1Y9IJ9UW
   export VERCEL_PROJECT_ID=prj_n11x8GsVN5qDw0eOFAcQiOfpc0Zg

   # Producción
   vercel env rm PROXY_ALLOWED_ORIGINS production --yes || true
   echo "https://brisacubanacleanintelligence.com,https://brisa-cubana-clean-intelligence.vercel.app" | \
     vercel env add PROXY_ALLOWED_ORIGINS production

   # Preview
   vercel env rm PROXY_ALLOWED_ORIGINS preview --yes || true
   echo "https://preview.brisacubanacleanintelligence.com" | \
     vercel env add PROXY_ALLOWED_ORIGINS preview

   # Development
   vercel env rm PROXY_ALLOWED_ORIGINS development --yes || true
   echo "http://localhost:3000" | vercel env add PROXY_ALLOWED_ORIGINS development

   # Asegurar que la bandera de debug no queda activa salvo en dev
   vercel env rm PORTAL_MAGIC_LINK_EXPOSE_DEBUG production --yes || true
   vercel env rm PORTAL_MAGIC_LINK_EXPOSE_DEBUG preview --yes || true
   echo "true" | vercel env add PORTAL_MAGIC_LINK_EXPOSE_DEBUG development
   ```

3. Ajustar las URL públicas y la telemetría para evitar redirecciones a `vercel.app`:

   ```bash
   # URL canónica (sin trailing slash ni espacios)
   echo "https://brisacubanacleanintelligence.com" | vercel env add NEXT_PUBLIC_SITE_URL production --force
   echo "https://brisacubanacleanintelligence.com" | vercel env add NEXT_PUBLIC_BASE_URL production --force

   # Host de PostHog (evita cambiar a us.posthog.com)
   echo "https://us.i.posthog.com" | vercel env add NEXT_PUBLIC_POSTHOG_HOST production --force

   # Habilitar el checkout sólo cuando esté listo comercialmente
   echo "false" | vercel env add NEXT_PUBLIC_ENABLE_PUBLIC_CHECKOUT production --force

   # Slug del tenant activo para el login multi-tenant (debe coincidir con DEFAULT_TENANT_SLUG en la API)
   echo "brisa-cubana" | vercel env add NEXT_PUBLIC_DEFAULT_TENANT_SLUG production --force

   # Replay de Sentry: mantener desactivado salvo campañas aprobadas
   for env in production development; do
     echo "false" | vercel env add SENTRY_REPLAY_ENABLED "$env" --force
     echo "false" | vercel env add NEXT_PUBLIC_SENTRY_REPLAY_ENABLED "$env" --force
     echo "0" | vercel env add SENTRY_REPLAYS_SESSION_SAMPLE_RATE "$env" --force
     echo "0.1" | vercel env add SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE "$env" --force
     echo "0" | vercel env add NEXT_PUBLIC_SENTRY_REPLAYS_SESSION_SAMPLE_RATE "$env" --force
     echo "0.1" | vercel env add NEXT_PUBLIC_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE "$env" --force
   done

   # Preview habilita Replay con muestreo controlado (5% sesiones, 50% errores)
   echo "true" | vercel env add SENTRY_REPLAY_ENABLED preview --force
   echo "0.05" | vercel env add SENTRY_REPLAYS_SESSION_SAMPLE_RATE preview --force
   echo "0.5" | vercel env add SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE preview --force
   echo "true" | vercel env add NEXT_PUBLIC_SENTRY_REPLAY_ENABLED preview --force
   echo "0.05" | vercel env add NEXT_PUBLIC_SENTRY_REPLAYS_SESSION_SAMPLE_RATE preview --force
   echo "0.5" | vercel env add NEXT_PUBLIC_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE preview --force
   ```

   Repite el procedimiento para los entornos preview/development según corresponda (por ejemplo, dejar `NEXT_PUBLIC_ENABLE_PUBLIC_CHECKOUT` en `true` sólo en staging controlado).

4. Si no se usa la CLI, repetir los mismos valores desde **Settings → Environment Variables** en el panel de Vercel.

## 2. Vercel – Proyecto API (`brisa-cubana-clean-intelligence-api`)

La API valida las env vars en tiempo de arranque. Si falta alguna crítica, el deployment falla antes de exponer el endpoint. Al menos deben existir:

| Variable                                                         | Entornos             | Notas                                                                                    |
| ---------------------------------------------------------------- | -------------------- | ---------------------------------------------------------------------------------------- |
| `ALLOWED_ORIGINS`                                                | dev / preview / prod | Lista separada por comas. Debe incluir panel, portal y cualquier dominio de integración. |
| `DATABASE_URL`                                                   | dev / preview / prod | Cadena de conexión (Neon/Vercel Postgres).                                               |
| `DATABASE_URL_UNPOOLED`                                          | dev / preview / prod | Igual que la anterior pero para conexiones directas (Prisma `directUrl`).                |
| `JWT_SECRET`                                                     | dev / preview / prod | Cadena aleatoria >= 32 chars. La API se detiene si falta.                                |
| `DEFAULT_TENANT_SLUG`                                            | dev / preview / prod | Slug de tenant usado como fallback en los logins multi-tenant (ej. `brisa-cubana`).      |
| `DEFAULT_TENANT_ID`                                              | opcional             | ID persistente del tenant por defecto (`tenant_brisa_cubana` si no se define).           |
| `NOTIFICATION_SMTP_*`                                            | dev / preview / prod | Host, puerto, usuario, password y flag `SECURE` para el SMTP operativo (SendGrid).       |
| `NOTIFICATION_FROM_EMAIL`                                        | dev / preview / prod | Remitente de correos transaccionales (ej. `Brisa Cubana <notificaciones@...>`).          |
| `NOTIFICATION_STREAM_HEARTBEAT_MS`, `NOTIFICATION_STREAM_LIMIT`  | opcional             | Ajustes del stream SSE de notificaciones internas (default `10000` / `50`).              |
| `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` | opcional             | Requeridos sólo si se habilitan SMS; sin ellos la cola registra “not-configured”.        |
| `HEALTH_CHECK_TOKEN`                                             | opcional             | Token para proteger `/healthz` público.                                                  |
| `HEALTH_STRIPE_TIMEOUT_MS`                                       | opcional             | Timeout (ms) para consultas de Stripe en el health check (default 3000).                 |

Pasos sugeridos:

1. Linkear el proyecto si aún no existe la carpeta `.vercel/` en `apps/api`:
   ```bash
   cd apps/api
   vercel link --yes
   ```
2. Añadir/actualizar las env vars con la CLI:

   ```bash
   # ALLOWED_ORIGINS
   echo "https://brisacubanacleanintelligence.com,https://portal.brisacubanacleanintelligence.com" | \
     vercel env add ALLOWED_ORIGINS production
   echo "https://preview.brisacubanacleanintelligence.com" | vercel env add ALLOWED_ORIGINS preview
   echo "http://localhost:3000" | vercel env add ALLOWED_ORIGINS development

   # DATABASE_URL / DATABASE_URL_UNPOOLED / JWT_SECRET
   vercel env add DATABASE_URL production
   vercel env add DATABASE_URL_UNPOOLED production
   vercel env add JWT_SECRET production

   # Repetir para preview/development según aplique
   ```

3. Confirmar con `vercel env ls` (desde `apps/api`) que los valores aparecen en los tres entornos.
4. Repetir el procedimiento vía panel de Vercel si se prefiere interfaz web.

## 3. GitHub Actions

1. Eliminar cualquier rastro del secreto `API_TOKEN`:
   ```bash
   gh secret remove API_TOKEN || true
   gh secret remove API_TOKEN --env preview-web || true
   gh secret remove API_TOKEN --env production-web || true
   gh secret remove API_TOKEN --env preview-api || true
   gh secret remove API_TOKEN --env production-api || true
   ```
2. Confirmar que `JWT_SECRET` y `AUTH_SECRET` siguen presentes en los entornos correspondientes:
   ```bash
   gh secret list --env production-web | grep -E "(JWT_SECRET|AUTH_SECRET)"
   gh secret list --env production-api | grep -E "(JWT_SECRET|AUTH_SECRET)"
   ```

> ℹ️ Si quieres reflejar los valores de Replay en GitHub Actions por entorno (`preview-web`, etc.), crea primero las environments en Settings → Environments y luego repite `gh secret set ... --env <nombre>` con los mismos valores (`true/0.05/0.5` para preview, `false/0/0.1` para el resto).

## 3. Smoke test posterior

Una vez propagados los valores:

1. Ejecutar `pnpm test:e2e:smoke` en CI o local con envs de staging.
2. Verificar desde el navegador que:
   - Las peticiones `/api/*` funcionan desde un dominio permitido.
   - Un dominio no listado carece de cabecera `Access-Control-Allow-Origin`.
   - El portal cliente no recibe `debugToken` en la respuesta (salvo entorno dev).

Documenta en el PR o changelog el momento en que se hicieron los cambios para mantener trazabilidad.
