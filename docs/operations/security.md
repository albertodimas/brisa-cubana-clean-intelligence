# Guía de Seguridad - Brisa Cubana Clean Intelligence

## ⚠️ Manejo de Credenciales y Secrets

### 🚨 REGLAS CRÍTICAS

1. **NUNCA commitear archivos .env con credenciales reales**
2. **NUNCA usar credenciales de producción en desarrollo local**
3. **NUNCA compartir secrets en Slack, Discord, o herramientas no seguras**
4. **SIEMPRE usar bases de datos locales para desarrollo**

---

## 📁 Archivos de Configuración

### `.env.example`

- ✅ **SÍ commitear** - Template sin credenciales reales
- ✅ Contiene estructura y variables necesarias
- ✅ Valores de ejemplo para desarrollo local

### `.env.local` (Desarrollo Local)

- ❌ **NO commitear** (está en `.gitignore`)
- ✅ Usar para desarrollo local
- ✅ Apunta a base de datos local
- ✅ Credenciales de desarrollo (no sensibles)

### `.env` (Producción - Solo en Vercel)

- ❌ **NO debe existir en tu máquina local**
- ❌ **NO commitear NUNCA**
- ✅ Solo en Vercel (configurado manualmente)
- ✅ Contiene credenciales reales de producción

---

## 🏗️ Configuración de Desarrollo Local

### 1. Copiar template

```bash
cp apps/api/.env.example apps/api/.env.local
```

### 2. Configurar base de datos local

```bash
# En .env.local
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/brisa_cubana_dev"
```

### 3. Levantar PostgreSQL local

```bash
docker compose up -d
```

### 4. Aplicar schema

```bash
cd apps/api
pnpm db:push --force-reset
pnpm db:seed:operativo
pnpm db:seed:demo
```

---

## 🔐 Variables de Entorno en Vercel

Las credenciales de producción están configuradas en:

- Vercel Dashboard → Project → Settings → Environment Variables

**Ambientes configurados:**

- `Production` - Credenciales reales
- `Preview` - Credenciales de staging
- `Development` - Credenciales de desarrollo

**Variables críticas adicionales:**

- `STRIPE_SECRET_KEY` (modo test en Preview/Development, live en Production).
- `STRIPE_PUBLISHABLE_KEY` (se usa en la aplicación web para inicializar Stripe.js).
- `STRIPE_WEBHOOK_SECRET` (clave de firma para `/api/payments/stripe/webhook`).
- `NOTIFICATION_SMTP_HOST` / `PORT` / `USER` / `PASSWORD` / `SECURE` / `NOTIFICATION_FROM_EMAIL` (envío de correos operativos: usa la cuenta de SendGrid autenticada para `brisacubanacleanintelligence.com`).
- `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_PHONE_NUMBER` (requeridos sólo si los SMS de notificación se activan; mantener vacíos en preproducción si no se usan).
- `NOTIFICATION_STREAM_HEARTBEAT_MS` / `NOTIFICATION_STREAM_LIMIT` (ajustan el SSE de notificaciones internas; por defecto `10000`/`50`, no exponen secrets pero conviene registrarlos).
- Documenta los valores en 1Password/Vault del equipo y rota si hay fuga.

### Procedimiento de rotación seguro

1. Genera nuevas llaves live en Stripe y regístralas en el vault con fecha y responsable.
2. Actualiza variables en Vercel (`development`, `preview`, `production`) usando `vercel env add`.
3. Actualiza secretos de GitHub Actions (`gh secret set STRIPE_*`) para `post-deploy-seed.yml`.
4. Ejecuta `stripe trigger checkout.session.completed` y valida recepción en logs (`payments: PaymentIntent de Stripe creado`).
5. Revoca inmediatamente las claves previas en Stripe y documenta el cambio en `docs/operations/deployment.md` §2.1.

## 🚦 Rate Limiting

La API protege endpoints públicos y con superficie de ataque elevada utilizando el helper compartido `createRateLimiter` (`apps/api/src/lib/rate-limiter.ts`).

- **Identificador de cliente**: prioriza `x-forwarded-for` → `x-real-ip` → `cf-connecting-ip` → `fastly-client-ip` y cae en `user-agent` como último recurso.
- **Logging estructurado**: usa `rateLimitLogger` (child de `logger`) para registrar eventos `debug` en cada intento y `warn` cuando se bloquea una solicitud.
- **Mensajes consistentes**: las respuestas JSON siguen el formato `{ error: "…" }` en español.

### Limites por Endpoint (valores por defecto)

| Endpoint                           | Límite | Ventana | Variables de entorno                                                        |
| ---------------------------------- | ------ | ------- | --------------------------------------------------------------------------- |
| `POST /api/authentication/login`   | 5      | 60 s    | `LOGIN_RATE_LIMIT`, `LOGIN_RATE_LIMIT_WINDOW_MS`                            |
| `POST /api/portal/auth/request`    | 3      | 15 min  | `PORTAL_MAGIC_LINK_RATE_LIMIT`, `PORTAL_MAGIC_LINK_WINDOW_MS`               |
| `POST /api/portal/auth/verify`     | 5      | 15 min  | `PORTAL_MAGIC_LINK_VERIFY_RATE_LIMIT`, `PORTAL_MAGIC_LINK_VERIFY_WINDOW_MS` |
| `POST /api/payments/stripe/intent` | 10     | 60 s    | `CHECKOUT_PAYMENT_RATE_LIMIT`, `CHECKOUT_PAYMENT_WINDOW_MS`                 |

> Ajusta los valores en Vercel con `vercel env add VARIABLE ambiente` cuando sea necesario (ej. campañas puntuales).

### Visibilidad

Los excedentes aparecen en los logs con estructura similar a:

```json
{
  "level": "warn",
  "component": "rate-limit",
  "endpoint": "checkout-payment-intent",
  "clientId": "203.0.113.42",
  "limit": 10,
  "windowMs": 60000,
  "path": "/api/payments/stripe/intent",
  "msg": "Rate limit excedido para checkout-payment-intent"
}
```

Configura alertas en Sentry/PostHog si detectas patrones de abuso (se recomienda activarlas a partir de 5 eventos/minuto).

---

## 🛡️ Content Security Policy (CSP)

- La web sirve un encabezado `Content-Security-Policy-Report-Only` desde `apps/web/vercel.json`. Esto nos permite detectar recursos externos no declarados antes de bloquearlos.
- Política actual: `default-src 'self'; script-src 'self' https://js.stripe.com https://cdn.posthog.com https://www.googletagmanager.com https://www.gstatic.com https://js.sentry-cdn.com https://vercel.live https://vitals.vercel-insights.com; connect-src 'self' https://api.brisacubanacleanintelligence.com https://*.posthog.com https://*.ingest.sentry.io https://js.stripe.com https://api.stripe.com https://vercel.live https://vitals.vercel-insights.com; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'; font-src 'self' https://fonts.gstatic.com data:; frame-src https://js.stripe.com https://hooks.stripe.com https://vercel.live; base-uri 'self'; form-action 'self' https://api.brisacubanacleanintelligence.com; frame-ancestors 'none'`.
- Los reportes se envían a `https://brisacubanacleanintelligence.com/api/security/csp-report` mediante los encabezados `Report-To` y `Reporting-Endpoints`. La ruta (`apps/web/app/api/security/csp-report/route.ts`) normaliza el payload, anota el `user-agent` y lo envía a Sentry como mensaje `warning` (`CSP Violation`).
- Si un nuevo proveedor externo es necesario, agrégalo explícitamente en la directiva pertinente y documenta el motivo aquí. Tras estabilizar los reportes, migraremos la política a modo bloqueante (`Content-Security-Policy`).

## ✉️ Enlaces mágicos (portal cliente)

- Los tokens generados por `/api/portal/auth/request` se almacenan con hash SHA-256 y caducan en 15 minutos (configurable vía `MAGIC_LINK_TTL_MINUTES`).
- El endpoint `/api/portal/auth/verify` consume el token tras el primer uso y emite dos credenciales:
  - `portal_token`: JWT con scope `portal-client`, firmado con `JWT_SECRET` y TTL configurable vía `PORTAL_ACCESS_TOKEN_TTL_SECONDS`.
  - `portal_refresh_token`: token aleatorio almacenado como hash en la tabla `PortalSession`; su vigencia depende de `PORTAL_REFRESH_TOKEN_TTL_DAYS` y se rota en cada refresh/logout.
- La API adjunta automáticamente las cookies `portal_token`, `portal_refresh_token` (ambas HttpOnly) y `portal_customer_id` tras una verificación exitosa; la UI sólo debe propagarlas mediante los proxys `/app/api/portal/*`.
- Endpoints de autoservicio `POST /api/portal/bookings/:id/cancel|reschedule` validan pertenencia del cliente, registran logs (`Portal booking cancellation/reschedule processed`) y limitan estados permitidos.
- Configura el canal SMTP (`PORTAL_MAGIC_LINK_*`) para enviar correos reales desde producción. Actualmente se usa SendGrid (`smtp.sendgrid.net`, puerto 465 con `secure=true` y usuario `apikey`) con el dominio `brisacubanacleanintelligence.com` autenticado (DKIM + SPF).
- El buzón `cliente@brisacubanacleanintelligence.com` se gestiona vía ImprovMX (ver `docs/operations/email-routing.md`) para recibir smoke tests del portal.
  - `PORTAL_MAGIC_LINK_FROM`
  - `PORTAL_MAGIC_LINK_SMTP_HOST`
  - `PORTAL_MAGIC_LINK_SMTP_PORT`
  - `PORTAL_MAGIC_LINK_SMTP_USER`
  - `PORTAL_MAGIC_LINK_SMTP_PASSWORD`
  - `PORTAL_MAGIC_LINK_SMTP_SECURE`
  - `PORTAL_MAGIC_LINK_BASE_URL`
- Define `PORTAL_MAGIC_LINK_EXPOSE_DEBUG="false"` en producción para evitar que el API incluya el `debugToken` en la respuesta una vez que el envío por correo esté habilitado.
- Asegura que `ENABLE_TEST_UTILS="false"` en producción y preview; este flag activa bypasses de seguridad (omisión de correo y exposición de tokens) pensados solo para entornos locales/CI.
- El frontend confía en las cookies emitidas por la API (`portal_token`, `portal_refresh_token` y `portal_customer_id`). Sus expiraciones (`expiresAt`/`refreshExpiresAt`) deben coincidir con los valores devueltos por el backend y tratarse como credenciales de sesión.
- El endpoint `POST /api/portal/auth/logout` invalida la sesión actual (requiere token de portal) y debe invocarse desde la UI al cerrar sesión para limpiar cookies. `POST /api/portal/auth/refresh` (llamado mediante `app/api/portal/refresh/route.ts`) rota ambos tokens y crea una fila nueva en `PortalSession`.
- Checklist manual tras cualquier cambio:
  1. Verificar en DevTools (Application → Storage → Cookies) que `portal_token` y `portal_refresh_token` son HttpOnly y `SameSite=Strict` en producción (o `Lax` en local).
  2. Confirmar que los atributos `Expires` coinciden con `expiresAt`/`refreshExpiresAt` devueltos por la API.
  3. Ejecutar `POST /api/portal/auth/refresh` y validar que las cookies se rotan y que la fila anterior en `PortalSession` queda con `revokedAt`/`revocationReason="rotated"`.
  4. Validar que tras `POST /api/portal/auth/logout` las tres cookies (`portal_token`, `portal_refresh_token`, `portal_customer_id`) se eliminan en el browser y en la respuesta HTTP.
- Las solicitudes de cancelación/reagendo desde el portal generan notificaciones `BOOKING_CANCELLED`/`BOOKING_RESCHEDULED` dirigidas a usuarios activos con rol `ADMIN` o `COORDINATOR`, para que operaciones pueda reaccionar.

## 📣 Sistema de notificaciones operativas

- Los correos salen mediante `NOTIFICATION_SMTP_*` y `NOTIFICATION_FROM_EMAIL`. En producción apunta a SendGrid (`smtp.sendgrid.net`, puerto 465/587) con autenticación por API key (`user=apikey`, `password=<API_KEY>`).
- Si `NOTIFICATION_SMTP_*` falta o es incorrecto, la cola marca cada evento como `FAILED` y registra el motivo en logs (`"Email notification skipped - SMTP not configured"`). Supervisa el stream SSE (`/api/notifications/stream`) y Sentry para detectar fallas.
- Los SMS dependen de Twilio (`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`). Mientras estén vacíos, el dispatcher degrada a `not-configured` y evita intentos. Nunca subas credenciales Twilio de producción a repositorios o entornos compartidos.
- La cola de notificaciones (in-memory) da prioridad a trabajos con `priority` más alta; documenta cualquier cambio operativo en `docs/operations/email-routing.md` o crea un runbook dedicado si se suma un broker externo (ej. Redis/BullMQ).

---

## 🧪 Testing

### Tests Unitarios

```bash
pnpm test  # Usa variables del código, no necesita .env
```

### Tests E2E (CI)

- GitHub Actions usa variables de entorno definidas en `.github/workflows/ci.yml`
- Usa PostgreSQL temporal (127.0.0.1:5432/brisa_ci)
- **NUNCA** toca la base de producción

---

## 🚨 Qué Hacer en Caso de Fuga de Credenciales

### Si commiteaste accidentalmente un `.env`:

1. **Rotar INMEDIATAMENTE** todas las credenciales expuestas:
   - `JWT_SECRET`
   - `AUTH_SECRET`
   - `DATABASE_URL` (regenerar password en Neon)

2. **Eliminar del historial de Git:**

```bash
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch apps/api/.env" \
  --prune-empty --tag-name-filter cat -- --all
```

3. **Force push (PELIGROSO - coordinar con equipo):**

```bash
git push origin --force --all
```

4. **Reportar al equipo** el incidente

---

## ✅ Checklist de Seguridad

Antes de cada commit:

- [ ] `git status` no muestra archivos `.env` o `.env.local`
- [ ] Archivos sensibles están en `.gitignore`
- [ ] No hay credenciales hardcodeadas en el código
- [ ] Variables de entorno usan valores por defecto seguros

---

## 📚 Recursos Adicionales

- [OWASP - Secrets Management](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables)
- [Neon Security Best Practices](https://neon.tech/docs/security)

---

**Última actualización:** 19 de octubre de 2025
**Mantenido por:** Equipo Brisa Cubana
