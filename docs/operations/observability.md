# Observabilidad y Monitoreo

**Última actualización:** 17 de octubre de 2025
**Estado actual:** ✅ Logging estructurado + Sentry configurado (habilitado según DSN)

---

## 1. Logging Estructurado (Pino)

### 1.1 Implementación

El proyecto usa **Pino** como logger estructurado para la API.

**Características:**

- Formato JSON en producción para parsing automático
- Formato pretty con colores en desarrollo
- Redacción automática de campos sensibles (passwords, tokens, cookies)
- Niveles: trace, debug, info, warn, error, fatal
- Timestamps ISO8601
- Serializers para objetos comunes (req, res, err)

**Archivos clave:**

- `apps/api/src/lib/logger.ts` - Configuración del logger
- `apps/api/src/middleware/logging.ts` - Middleware HTTP de Hono

### 1.2 Uso en Código

```typescript
import { logger, authLogger, dbLogger } from "./lib/logger.js";

// Log simple
logger.info("Operación completada");
logger.error({ err: error }, "Error al procesar");

// Log con contexto
logger.info(
  {
    userId: "123",
    action: "create_service",
    serviceId: "456",
  },
  "Usuario creó servicio",
);

// Logs especializados
authLogger.info({ userId, role }, "Usuario autenticado");
dbLogger.debug({ query: "SELECT ..." }, "Query ejecutada");
```

### 1.3 Logs HTTP Automáticos

El middleware `loggingMiddleware` registra automáticamente:

```json
{
  "level": "info",
  "time": "2025-10-08T12:00:00.000Z",
  "type": "http_response",
  "method": "POST",
  "path": "/api/bookings",
  "status": 201,
  "durationMs": 45,
  "userId": "user-id-123",
  "msg": "POST /api/bookings 201 45ms"
}
```

### 1.4 Campos Redactados

Los siguientes campos se redactan automáticamente con `[REDACTED]`:

- `req.headers.authorization`
- `req.headers.cookie`
- `res.headers['set-cookie']`
- Cualquier campo llamado `password`, `passwordHash`, `token`, `secret`

### 1.5 Telemetría del stream SSE

- `/api/notifications/stream` registra cada conexión con `logger.info` (usuario, `heartbeatInterval`, `streamLimit`, `Last-Event-ID`).
- Heartbeat (`event: ping`) cada 25 s configurable mediante `NOTIFICATION_STREAM_HEARTBEAT_MS`.
- El hook `useNotificationStream` añade breadcrumbs (`notifications.stream`) y mensajes `notifications.stream.fallback`/`notifications.stream.event.error` en Sentry.
- Usa estas métricas para configurar alertas cuando el estado cambie a `polling` o se acumulen reintentos consecutivos.

### 1.6 Checkout público

- El formulario multipaso en `/checkout` emite breadcrumbs Sentry `intent:create:start`, `payment_confirmed`, `payment_failed` y eventos `checkout.intent.created`, `checkout.payment.confirmed`, `checkout.payment.failed`.
- Errores al crear intents se reportan con `captureException` (`stage: intent:create`). Configura alertas en Sentry para monitorear spikes.
- Cuando falta `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, se registra `checkout.publishable_key.missing` (nivel warning) para detectar entornos mal configurados.
- Los endpoints de enlace mágico (`/api/portal/auth/request`/`verify`) registran eventos en logs (`Magic link solicitado para cliente`) y pueden instrumentarse con eventos Sentry adicionales cuando se integre el frontend.
- El mailer SMTP (`sendPortalMagicLinkEmail`) registra `Magic link email dispatched` cuando el correo se entrega y `Magic link email failed` cuando el proveedor rechaza el envío.
- Configura una alerta de Sentry con disparo cuando se acumulen ≥3 eventos `checkout.payment.failed` o `portal.booking.action.error` en 15 minutos y redirígela al canal `#alerts-operaciones`. Documenta el enlace del monitor en 1Password y mantenlo actualizado.

### 1.7 Alertas activas (actualizado 20-oct-2025)

- **Sentry Issue Alert – Checkout errores** (`checkout-payment-failed`):
  - Condición: ≥3 eventos `checkout.payment.failed` en 15 minutos.
  - Acción: Notificación a Slack `#alerts-operaciones` mediante la app Sentry.
  - URL monitor: `https://sentry.io/organizations/brisa-cubana/issues/?query=alert:checkout-payment-failed` (registrado en 1Password «Sentry Alerts»).
- **Sentry Issue Alert – Portal autoservicio** (`portal-booking-action-error`):
  - Condición: ≥3 eventos `portal.booking.action.error` en 10 minutos.
  - Acción: Slack `#alerts-operaciones` + email a operaciones@brisacubanaclean.com.
  - URL monitor: `https://sentry.io/organizations/brisa-cubana/issues/?query=alert:portal-booking-action-error`.
- **Sentry Cron Monitor – Nightly Full E2E** (`nightly-full-e2e-suite`):
  - Frecuencia esperada: diaria 02:00 UTC (workflow GitHub Actions `nightly.yml`).
  - Acción: Slack `#alerts-operaciones` cuando la ejecución no se recibe en 3h.
  - Configurado con `sentry-cli monitors update nightly-full-e2e-suite --schedule "0 2 * * *" --slack #alerts-operaciones`.

---

## 2. Monitoreo en Vercel

### 2.1 Logs de Runtime

**Acceso:** Vercel Dashboard → Project → Logs

**Filtros útiles:**

```bash
# Errores 5xx
status:>=500

# Requests lentas
duration:>1000

# Errores de autenticación
"401" OR "403"

# Rate limiting
"429"
```

**Exportar logs:**

```bash
vercel logs --follow
vercel logs --since=2h
vercel logs --output=logs.txt
```

### 2.2 Analytics de Vercel

**Métricas disponibles:**

- Requests por minuto
- Latencia (p50, p75, p95, p99)
- Tasa de errores (4xx, 5xx)
- Uso de bandwidth
- Edge requests vs serverless

**Dashboard:** Vercel → Project → Analytics

---

## 3. Monitoreo de Base de Datos (Neon)

### 3.1 Métricas Neon

**Acceso:** Neon Console → Project → Monitoring

---

## 4. Analítica Comercial (Plan Fase 2)

### 4.1 Estado actual

- Eventos enviados con `@vercel/analytics`:
  - `cta_request_proposal`, `cta_portal_demo` (landing).
  - `checkout_started`, `checkout_completed`, `checkout_payment_failed`.
- Breadcrumbs/Sentry: `checkout.intent.created`, `portal.link.requested`, `portal.link.verify`, `portal.logout`.
- Información consolidada en `apps/web/lib/marketing-telemetry.ts`.

### 4.2 Plataforma seleccionada: PostHog Cloud (US)

- Detalle de la decisión en `docs/product/analytics-decision.md`.
- Variables nuevas:
  - `NEXT_PUBLIC_POSTHOG_KEY`
  - `NEXT_PUBLIC_POSTHOG_HOST` (opcional, default `https://us.posthog.com`)

### 4.3 Checklist de implementación

1. **Integrar SDK PostHog** en `apps/web` (lazy load) con fallback si la key no está definida.
2. **Normalización de eventos** (`namespace.event`, props `source`, `campaign`, `serviceId`, `customerType`).
3. **Persistir UTMs** en el telemetry helper y propagar a checkout/portal.
4. **Dashboard compartido**:
   - KPI iniciales: `cta → lead`, `lead → checkout`, `checkout → pago`, ratio uso portal.
   - Responsable: Producto. Añadir enlace en sección 4.4 al publicarlo.
5. **Alertas PostHog** para spikes de `checkout_payment_failed` → Slack `#producto`.
6. **QA**: actualizar `docs/qa/regression-checklist.md` para comprobar presencia de `window.posthog` cuando la key esté configurada.
7. **Export warehouse (opcional)** cuando se superen 100k eventos/mes.

### 4.4 Enlaces

- Dashboard PostHog: https://us.posthog.com/project/brisa-cubana/dashboards/funnel-fase2
- Diccionario de eventos: `docs/product/analytics-events.md`.

> **Acción inmediata:** bloquear la decisión de plataforma con Marketing y, tras la evaluación, abrir ticket para implementar el SDK elegido. Documentar cualquier requisito de consentimiento/cookies en `docs/operations/security.md`.

**Métricas clave:**

- Active connections
- Query duration (p50, p95, p99)
- Database size
- Storage usage
- Compute hours

### 3.2 Prisma Query Logs

**Habilitar en desarrollo:**

```bash
# apps/api/.env.local
DATABASE_URL="postgresql://...?connection_limit=10&pool_timeout=20"
DEBUG="prisma:query"
```

```typescript
// En código (mantén la DI consistente)
import { getPrisma } from "../container.js";

const prisma = getPrisma();

// Habilitar query logging
prisma.$on("query", (e) => {
  dbLogger.debug(
    {
      query: e.query,
      params: e.params,
      duration: e.duration,
    },
    "Prisma query executed",
  );
});
```

### 3.3 Slow Query Alerts

**Configurar en Neon Console:**

- Settings → Alerts
- Query duration > 1000ms (warning)
- Query duration > 5000ms (critical)

---

## 4. Sentry para Error Tracking

### 4.1 Dependencias instaladas

```bash
cd apps/api
pnpm add @sentry/node @sentry/profiling-node

cd ../web
pnpm add @sentry/nextjs
```

### 4.2 Configuración API

```typescript
// apps/api/src/lib/sentry.ts
import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";

const dsn = process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? "development",
    integrations: [nodeProfilingIntegration()],
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    profilesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    sendDefaultPii: true,
  });
} else if (process.env.NODE_ENV === "production") {
  console.warn("SENTRY_DSN not configured, Sentry will not be initialized");
}

export { Sentry };
```

```typescript
// apps/api/src/app.ts
import Sentry from "./lib/sentry.js";

// Middleware de error handling
app.onError((err, c) => {
  Sentry.captureException(err, {
    extra: {
      path: c.req.path,
      method: c.req.method,
      userId: c.get("userId"),
    },
  });

  logger.error({ err }, "Unhandled error");

  return c.json(
    {
      error:
        process.env.NODE_ENV === "production"
          ? "Internal server error"
          : err.message,
    },
    500,
  );
});
```

### 4.3 Configuración Web (Next.js)

```bash
npx @sentry/wizard@latest -i nextjs
```

Sigue el wizard para configurar:

- `sentry.client.config.ts`
- `sentry.server.config.ts`
- `sentry.edge.config.ts`

### 4.4 Alertas Sentry

**Configurar en Sentry Dashboard:**

1. **Error rate spike**
   - Condición: Errores > 10% en 5 minutos
   - Notificar: Slack #alerts-prod

2. **New issue**
   - Condición: Error nunca visto antes
   - Notificar: Email + Slack

3. **Performance degradation**
   - Condición: Latencia p95 > 2s
   - Notificar: Slack #performance

---

## 5. Alertas y métricas de negocio

### 5.1 Integración Sentry ↔ Slack

1. En Sentry, navegar a **Settings → Integrations → Slack → Add Workspace**.
2. Autorizar el workspace `brisa-cubana` y seleccionar los canales:
   - `#alerts-prod` para errores críticos (`severity:error`).
   - `#alerts-performance` para degradaciones de performance.
3. Crear reglas en **Project Settings → Alerts → Issue Alerts**:
   - **Portal booking action error:** condición `event.title contains "portal.booking.action.error"` con umbral ≥ 3 eventos en 15 min → Slack `#alerts-prod`.
   - **Checkout intent failures:** condición `event.title contains "checkout.intent.create"` o `payment_failed` → Slack `#alerts-prod`.
4. Agregar notificación secundaria por correo al on-call (`operaciones@brisacubanaclean.com`) para redundancia.
5. Documentar en 1Password la URL del webhook y el responsable de rotación.

### 5.2 Alertas específicas por flujo

| Flujo          | Evento / métrica                             | Umbral recomendado     | Acción                                                    |
| -------------- | -------------------------------------------- | ---------------------- | --------------------------------------------------------- |
| Portal cliente | `portal.session.expired` (Sentry breadcrumb) | ≥ 10 eventos en 10 min | Revisar expiración anticipada de cookies, validar clocks. |
| Portal cliente | `Magic link email failed` (log API)          | ≥ 1 evento             | Verificar credenciales SMTP.                              |
| Checkout       | `checkout.payment.failed` (Sentry)           | ≥ 5 eventos en 15 min  | Revisar estado de Stripe, verificar claves y webhooks.    |
| API            | Latencia P95 (`vercel analytics`)            | > 2 s durante 5 min    | Escalar a ingeniería para investigar queries/prisma.      |

### 5.3 Métricas personalizadas con Pino

```typescript
import { logBusinessEvent } from "./lib/logger.js";

// Ejemplo: Rastrear creación de reservas
logBusinessEvent("booking_created", {
  bookingId: booking.id,
  serviceId: booking.serviceId,
  finalPrice: booking.finalPrice,
  customerId: booking.customerId,
  scheduledFor: booking.scheduledFor,
});

// Ejemplo: Login exitoso
logBusinessEvent("user_login", {
  userId: user.id,
  role: user.role,
  email: user.email,
});

// Ejemplo: Acción portal
logBusinessEvent("portal_action", {
  bookingId: booking.id,
  action: "reschedule",
  customerId: booking.customerId,
});
```

Enviar estos eventos a un collector (Datadog, New Relic o Grafana Loki) permite generar dashboards de negocio sin duplicar lógica.

### 5.4 Dashboards recomendados

- **Grafana Cloud (Loki + Prometheus):** Ingestar logs de Pino y visualizar `booking_created`, `portal_action`, `checkout.payment.confirmed`.
- **Vercel Analytics:** Web Vitals por tipo de página (`pageType`), distribución de Core Web Vitals y tasa de errores.
- **Neon Monitoring:** Queries lentas, conexiones activas y uso de almacenamiento.

### 5.5 KPIs mínimos a monitorear

| Métrica                                                               | Fuente                       | Objetivo                                              |
| --------------------------------------------------------------------- | ---------------------------- | ----------------------------------------------------- |
| Conversiones checkout (`checkout.payment.confirmed`)                  | Logs Pino / Sentry           | ≥ 95% éxito transacciones modo test.                  |
| Cancelaciones portal (`portal.booking.cancelled`)                     | Logs Pino                    | Correlacionar con notificaciones `BOOKING_CANCELLED`. |
| Tiempo medio de confirmación (creación booking → confirmación portal) | Logs Pino + Vercel Analytics | < 2 minutos en horario laboral.                       |
| Latencia API `/api/portal/bookings` P95                               | Vercel Analytics             | < 500 ms.                                             |
| Tasa de correos fallidos                                              | Logs API                     | 0 fallos; alerta inmediata ante ≥1.                   |

### 5.6 Procedimiento para habilitar alertas (ejecutar una vez)

1. **Conectar Slack a Sentry**
   - Sentry → _Settings → Integrations → Slack → Add Workspace_.
   - Autoriza el workspace `brisa-cubana` y selecciona:
     - `#brisa-critical` (errores críticos / tasa de error).
     - `#brisa-alerts` (issues nuevos y regresiones).
     - `#brisa-performance` (latencia / rendimiento).
2. **Crear reglas de issues**
   - _When a new issue is created_ → Slack `#brisa-alerts`, email `ops@brisacubanaclean.com`.
   - _When issue state changes to regressed_ → Slack `#brisa-alerts`.
3. **Crear alertas métricas**
   - Error rate > 5 % (dataset Transactions, env Production) → Slack `#brisa-critical`, email `oncall@brisacubanaclean.com`.
   - Latencia P95 > 2000 ms (`transaction.op = http.server`) → Slack `#brisa-performance`.
   - `message:"notifications.stream.fallback"` ≥ 3 eventos / 5 min → Slack `#brisa-alerts`.
4. **Validación**
   - Ejecutar `SENTRY_AUTH_TOKEN=... pnpm sentry:test-event "Verificación Slack"` y confirmar notificación en Slack.
   - Adjuntar captura o enlace a la regla en `docs/operations/alerts.md`.
5. **Actualizar tabla 5.7** con la fecha y responsable que completó cada integración.

### 5.7 Registro de implementación (completar al habilitar)

| Fecha       | Responsable | Integración                                  | Evidencia |
| ----------- | ----------- | -------------------------------------------- | --------- |
| _Pendiente_ | _Asignar_   | Slack ↔ Sentry (issues nuevos)              |           |
| _Pendiente_ | _Asignar_   | Error rate > 5 %                             |           |
| _Pendiente_ | _Asignar_   | Latencia P95 > 2 s                           |           |
| _Pendiente_ | _Asignar_   | Fallback SSE `notifications.stream.fallback` |           |
| _Pendiente_ | _Asignar_   | KPIs de negocio en Grafana/Loki              |           |

### 5.8 Alertas PostHog (pendiente)

1. Crear alerta de funnel `checkout_payment_failed` en PostHog → enviar a webhook Slack `#producto` (configurar en _Project → Alerts_).
2. Duplicar la alerta para `portal.booking.action.error` con umbral ≥ 3 eventos en 15 minutos.
3. Guardar los enlaces a las alertas en 1Password (`Brisa Cubana – SaaS`) y documentarlos en la tabla 5.7.
4. Verificar recepción disparando eventos desde staging (`pnpm exec stripe trigger payment_intent.payment_failed` o acciones en el portal).
   - También puedes usar `POSTHOG_API_KEY=... pnpm posthog:test-event checkout_payment_failed` para validar desde la CLI.

## 6. Health Checks

### 6.1 Endpoint de Health

**URL:** `https://api.brisacubanaclean.com/api/health`

**Response exitoso:**

```json
{
  "status": "pass",
  "checks": {
    "uptime": 12345,
    "environment": "production",
    "database": "ok"
  }
}
```

**Response fallido:**

```json
{
  "status": "fail",
  "checks": {
    "uptime": 12345,
    "environment": "production",
    "database": "error"
  },
  "error": "Connection timeout"
}
```

### 6.2 Monitoreo Externo

**Herramientas recomendadas:**

- **UptimeRobot** (free tier): Ping cada 5 minutos
- **Better Uptime** (paid): Monitoreo avanzado con status page
- **Vercel Monitoring** (incluido): Uptime automático

**Configuración UptimeRobot:**

1. Monitor type: HTTP(s)
2. URL: `https://api.brisacubanaclean.com/api/health`
3. Monitoring interval: 5 minutes
4. Keyword: `"status":"pass"`
5. Alert contacts: Email, Slack

---

## 7. Runbook de Incidentes

### 7.1 API No Responde

**Síntomas:**

- Health check falla
- 502/504 en Vercel
- Timeouts en frontend

**Diagnóstico:**

```bash
# 1. Verificar logs de Vercel
vercel logs --since=30m

# 2. Verificar deployment reciente
vercel ls

# 3. Verificar Neon status
curl https://api.brisacubanaclean.com/api/health

# 4. Verificar conexiones activas en Neon
# Neon Console → Monitoring → Active connections
```

**Resolución:**

- Si deployment reciente: Rollback (`vercel rollback`)
- Si Neon down: Esperar restauración, notificar usuarios
- Si rate limit en Neon: Escalar plan o reducir tráfico

### 7.2 Tasa de Errores Alta

**Síntomas:**

- Sentry alerta de spike de errores
- Logs muestran muchos 5xx

**Diagnóstico:**

```bash
# 1. Identificar patrón de errores
vercel logs --since=1h | grep "500\|502\|503"

# 2. Verificar errores específicos en Sentry
# Sentry Dashboard → Issues → Recent

# 3. Verificar cambios recientes
git log --since="1 hour ago"
```

**Resolución:**

- Si error específico: Hotfix y deploy
- Si error de base de datos: Verificar queries lentas, índices
- Si error de memoria: Escalar serverless function size

### 7.3 Rate Limiting Excesivo

**Síntomas:**

- Usuarios reportan "Too many requests"
- Logs muestran muchos 429

**Diagnóstico:**

```bash
# 1. Verificar logs de rate limit
vercel logs --since=1h | grep "429"

# 2. Identificar IPs afectadas
# Logs → Filter por 429 → Ver req.headers['x-forwarded-for']
```

**Resolución:**

- Si ataque: Bloquear IPs en Vercel settings
- Si límite muy bajo: Ajustar `LOGIN_RATE_LIMIT` en env vars
- Si bot legítimo: Whitelist IP o añadir `API_TOKEN`

---

## 8. Próximos Pasos

### Prioridad ALTA

- [ ] Implementar Sentry en API y Web
- [ ] Configurar alertas en Sentry (error rate, new issues)
- [ ] Setup UptimeRobot para health checks
- [ ] Documentar playbooks en Notion/Confluence

### Prioridad MEDIA

- [ ] Dashboard Grafana con métricas de negocio
- [ ] Alertas proactivas (latencia p99, database size)
- [ ] Tests de carga periódicos (k6, Artillery)
- [ ] Logs estructurados en frontend (Console API + Sentry)

### Prioridad BAJA

- [ ] Distributed tracing (OpenTelemetry)
- [ ] Performance profiling automático
- [ ] Synthetic monitoring (Checkly)
- [ ] Custom dashboard para stakeholders

---

## 9. Referencias

- [Pino Documentation](https://getpino.io/)
- [Sentry Node.js Guide](https://docs.sentry.io/platforms/node/)
- [Vercel Observability](https://vercel.com/docs/observability)
- [Neon Monitoring](https://neon.com/docs/manage/monitoring)
- [Next.js Logging Best Practices](https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation)
