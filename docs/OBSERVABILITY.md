# Observabilidad y Monitoreo

**Última actualización:** 8 de octubre de 2025
**Estado actual:** ✅ Logging estructurado implementado, Sentry pendiente

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
// En código
import { prisma } from "./lib/prisma.js";

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

### 4.1 Instalación (Pendiente)

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

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  integrations: [nodeProfilingIntegration()],
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  profilesSampleRate: 0.1,
  beforeSend(event, hint) {
    // Filtrar eventos sensibles
    if (event.request?.cookies) {
      delete event.request.cookies;
    }
    return event;
  },
});

export default Sentry;
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

## 5. Métricas de Negocio

### 5.1 Custom Metrics con Pino

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

// Ejemplo: Login fallido
logBusinessEvent("login_failed", {
  email: "user@example.com",
  reason: "invalid_credentials",
});
```

### 5.2 Dashboard de Métricas

**Herramientas recomendadas:**

- **Grafana Cloud** (free tier): Visualización de logs estructurados
- **Vercel Analytics** (incluido): Web Vitals y performance
- **Neon Monitoring** (incluido): Database metrics

**Setup futuro:**

1. Exportar logs de Vercel a S3/GCS
2. Ingerir logs en Grafana Loki
3. Crear dashboards:
   - Requests por endpoint
   - Latencia por ruta
   - Tasa de errores por tipo
   - Usuarios activos
   - Reservas creadas por día
   - Rate limit hits

---

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
