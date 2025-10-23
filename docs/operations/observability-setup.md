# Observabilidad y Monitoreo - Configuración Completa

**Última actualización:** 23 de octubre de 2025
**Estado:** ✅ Proyectos Sentry configurados · ✅ Integración Slack activa (`#alerts-operaciones`) · ✅ PostHog enlazado

---

## Índice

1. [Sentry - Monitoreo de Errores](#sentry---monitoreo-de-errores)
2. [PostHog - Análisis de Producto](#posthog---análisis-de-producto)
3. [Slack - Alertas y Notificaciones](#slack---alertas-y-notificaciones)
4. [Configuración en Aplicaciones](#configuración-en-aplicaciones)
5. [Verificación y Testing](#verificación-y-testing)

---

## Sentry - Monitoreo de Errores

### Proyectos Creados ✅

Se han creado **dos proyectos** en Sentry para separar errores de frontend y backend:

| Proyecto             | Slug               | Plataforma | DSN                                                                                               |
| -------------------- | ------------------ | ---------- | ------------------------------------------------------------------------------------------------- |
| **Brisa Cubana Web** | `brisa-cubana-web` | Next.js    | `https://61251c0e4f5553d7febc1d31ab8a9da6@o4509669004541952.ingest.us.sentry.io/4510220183273472` |
| **Brisa Cubana API** | `brisa-cubana-api` | Node.js    | `https://62f6df73f4e95ea1748c4718abeefdb1@o4509669004541952.ingest.us.sentry.io/4510220184059904` |

### Acceso a Proyectos

- **Organización:** `brisacubana`
- **Equipo:** `independiente-entusiasta`
- **URL Web:** https://sentry.io/organizations/brisacubana/projects/brisa-cubana-web/
- **URL API:** https://sentry.io/organizations/brisacubana/projects/brisa-cubana-api/

### Arquitectura y características

- **Frontend (Next.js 15)**
  - SDK: `@sentry/nextjs` (cliente, servidor y edge).
  - Funcionalidades activas: captura automática de errores, trazas (10 %), Session Replay (10 % base / 100 % en errores), perfiles (10 %).
  - Integraciones clave: `instrumentation.ts` (`register`, `onRequestError`), `withSentryConfig` en `next.config.ts` para ocultar source maps.

- **Backend (Hono + Node.js)**
  - SDK: `@sentry/node` + `@sentry/profiling-node`.
  - Se captura contexto de petición (`req.method`, `req.path`, `userId`), errores ≥500 y spans de Prisma.
  - `sendDefaultPii` habilitado únicamente en producción; los headers sensibles se limpian en `beforeSend`.

- **Sample rates**
  - `tracesSampleRate`: 0.1 en producción, 1.0 en otros entornos.
  - `profilesSampleRate`: 0.1 en producción (API) / 0.0 en el cliente (configurable).
  - `replaysSessionSampleRate`: 0.1 (configurado en las plantillas de Next.js).

- **Alertas**: ver `docs/operations/alerts.md` y la tabla 5.7 más abajo para responsables/asignaciones.

### Variables de Entorno

#### **Para apps/web (Next.js)**

Agregar a `.env.local` (desarrollo) y Vercel (producción):

> 🔐 **Token:** obtenerlo desde 1Password → “Sentry · Brisa Cubana · Auth Token (Admin)”.

```bash
# Sentry
NEXT_PUBLIC_SENTRY_DSN=https://61251c0e4f5553d7febc1d31ab8a9da6@o4509669004541952.ingest.us.sentry.io/4510220183273472
SENTRY_ORG=brisacubana
SENTRY_PROJECT=brisa-cubana-web
SENTRY_AUTH_TOKEN=<SENTRY_AUTH_TOKEN>
SENTRY_TRACES_SAMPLE_RATE=0.1
SENTRY_PROFILES_SAMPLE_RATE=0.1
NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE=0.1
NEXT_PUBLIC_SENTRY_PROFILES_SAMPLE_RATE=0
```

Archivos relevantes (`apps/web`):

- `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`: inicializan Sentry de forma condicional según el DSN.
- `sentry.config.ts`: referencia `org`, `project` y utiliza el token de entorno cuando se ejecuta la CLI (source maps, releases).
- `next.config.ts`: envuelto con `withSentryConfig` para generar artefactos compatibles con Sentry y ocultar source maps del build público.

#### **Para apps/api (Hono + Node.js)**

Agregar a `.env` (desarrollo) y Vercel (producción):

```bash
# Sentry
SENTRY_DSN=https://62f6df73f4e95ea1748c4718abeefdb1@o4509669004541952.ingest.us.sentry.io/4510220184059904
SENTRY_ORG=brisacubana
SENTRY_PROJECT=brisa-cubana-api
SENTRY_AUTH_TOKEN=<SENTRY_AUTH_TOKEN>
SENTRY_ENVIRONMENT=production
```

### Configuración de Alertas en Sentry

#### Estado actual (20-oct-2025)

Se crearon reglas básicas que envían correo mediante la acción legacy `notify_event`:

| Proyecto | Regla              | Condición                     |
| -------- | ------------------ | ----------------------------- |
| Web      | `Web errors spike` | Más de 10 eventos en 1 minuto |
| Web      | `Web new issue`    | Se crea un nuevo issue        |
| API      | `API errors spike` | Más de 20 eventos en 1 minuto |
| API      | `API new issue`    | Se crea un nuevo issue        |

#### Próximos pasos

- **Integrar Slack:** Cuando el webhook esté disponible, edita cada regla en Sentry UI y agrega la acción “Send a notification to Slack” (canal `#alerts-operaciones`).
- **Ajustar umbrales:** Revisa periódicamente los thresholds según tráfico real.
- **Dueños de issues:** Considera habilitar la acción “Send a notification to Issue Owners” una vez definido el modelo de ownership.

---

## PostHog - Análisis de Producto

### Información del Proyecto

- **Organización:** Brisa Cubana Clean Intelligence
- **Proyecto:** Brisa Cubana
- **API Key:** `phc_V9kxI5qYqZHt8bKLvXxRWXZvXxRWXZvXxRW` (ejemplo - usar la real)
- **Host:** `https://us.i.posthog.com`

### Variables de Entorno (apps/web)

```bash
NEXT_PUBLIC_POSTHOG_KEY=phc_TU_API_KEY_AQUI
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
# Opcional (solo ambientes de prueba / E2E)
NEXT_PUBLIC_POSTHOG_FORCE_ENABLE=""
```

### Configuración de Webhooks (requiere Slack)

PostHog puede enviar alertas a Slack cuando se detectan anomalías o se cumplen condiciones:

**Eventos a monitorear:**

- Usuario completó reserva
- Error en checkout
- Usuario abandonó carrito
- Tiempo de carga > 3 segundos

**Configuración:**

1. Ve a PostHog → **Settings** → **Integrations** → **Webhooks**
2. Click **"Add Webhook"**
3. Ingresa Slack Webhook URL (ver sección Slack)
4. Configura eventos a enviar
5. Valida con `SLACK_WEBHOOK_URL=<url> scripts/test-slack-webhook.sh "🧪 Observabilidad configurada"`

> El workflow automatizado `posthog-monitor.yml` consume los secretos `POSTHOG_API_KEY` y `SLACK_WEBHOOK_URL` desde GitHub Actions. Asegúrate de definirlos en **Settings → Secrets and variables → Actions** antes de habilitar la programación cada 10 minutos.

---

## Slack - Alertas y Notificaciones

> Para la guía operativa completa consulta `docs/operations/slack-integration.md`. Este apartado resume únicamente los pasos técnicos esenciales.

### 🚨 **Webhook operativo**

Existe un **Incoming Webhook** activo (`SLACK_WEBHOOK_URL`, canal `#alerts-operaciones`). En caso de rotarlo:

#### **Pasos para crear el Webhook:**

1. **Ve a Slack API Apps:** https://api.slack.com/apps
2. **Crea una nueva app:**
   - Click **"Create New App"** → **"From scratch"**
   - Nombre: `Brisa Cubana Monitoring`
   - Workspace: Selecciona tu workspace
3. **Activa Incoming Webhooks:**
   - En el menú lateral: **"Incoming Webhooks"**
   - Toggle **"Activate Incoming Webhooks"** → ON
4. **Crea un nuevo webhook (si es necesario):**
   - Click **"Add New Webhook to Workspace"**
   - Selecciona canal: `#alerts-operaciones` (o créalo si no existe)
   - Click **"Allow"**
5. **Copia la Webhook URL:**
   - Formato: `https://hooks.slack.com/services/T123ABC/B456DEF/xyz789abc`
   - **¡GUÁRDALA DE FORMA SEGURA!**

#### **Canales recomendados:**

Crea estos canales en Slack para organizar alertas:

- **#alerts-operaciones** - Errores críticos y nuevos issues
- **#alerts-criticos** - Escalaciones SEV0/SEV1
- **#alerts-performance** - Métricas y health checks
- **#alerts-deployments** - Notificaciones de CI/CD
- **#leads-operaciones** - Leads entrantes desde la landing

### Registro de implementación

| Fecha (UTC)          | Responsable | Integración / alcance                                                       | Evidencia documentada                                                                  |
| -------------------- | ----------- | --------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| 2025-10-23 14:05 UTC | Plataforma  | Sentry issue alert `checkout-payment-failed` → `#alerts-operaciones`        | Evento `pnpm sentry:test-event` con mensaje “Webhook verification” recibido en Slack.  |
| 2025-10-23 14:12 UTC | Producto    | Sentry metric alert `notifications.stream.fallback` → `#alerts-operaciones` | Regla `Portal SSE fallback` activada en Sentry (Alerts › portal-sse-fallback).         |
| 2025-10-23 14:20 UTC | Plataforma  | Workflow `posthog-monitor.yml` ejecutando `pnpm posthog:monitor` → Slack    | GitHub Actions run `posthog-monitor.yml` #1 confirmó mensaje en `#alerts-operaciones`. |

### Configurar Sentry → Slack

Una vez tengas la Webhook URL:

1. Ve a **Sentry** → **Settings** → **Integrations**
2. Busca **"Slack"** → Click **"Install"**
3. Autoriza el workspace
4. En cada proyecto (web y api):
   - Ve a **Settings** → **Alerts**
   - Edita las alertas creadas
   - En **"Then perform these actions"** → **"Send notification to"** → Selecciona `#alerts-operaciones`

### Configurar PostHog → Slack

1. Ve a **PostHog** → **Project Settings** → **Integrations**
2. Click **"Slack"**
3. Ingresa la Webhook URL
4. Configura qué eventos enviar:
   - Anomalías detectadas
   - Nuevos insights
   - Alertas de funnels

---

## Configuración en Aplicaciones

### 1. Next.js (apps/web)

#### Instalar SDK de Sentry

```bash
cd apps/web
pnpm add @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

Esto creará automáticamente:

- `sentry.client.config.ts`
- `sentry.server.config.ts`
- `sentry.edge.config.ts`

#### Configuración recomendada (`sentry.client.config.ts`):

```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Ajustar según ambiente
  environment: process.env.NODE_ENV,

  // Sample rate para performance monitoring
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Filtrar información sensible
  beforeSend(event, hint) {
    // No enviar errores con datos sensibles
    if (event.request?.headers?.["authorization"]) {
      delete event.request.headers["authorization"];
    }
    return event;
  },

  // Ignorar errores conocidos
  ignoreErrors: [
    "ResizeObserver loop limit exceeded",
    "Non-Error promise rejection captured",
  ],
});
```

### 2. Hono API (apps/api)

#### Instalar SDK de Sentry para Node

```bash
cd apps/api
pnpm add @sentry/node @sentry/profiling-node
```

#### Configuración (`src/lib/sentry.ts`):

```typescript
import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";

export function initSentry() {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.SENTRY_ENVIRONMENT || "development",

    integrations: [nodeProfilingIntegration()],

    tracesSampleRate: 0.1,
    profilesSampleRate: 0.1,

    beforeSend(event) {
      // Remover headers sensibles
      if (event.request?.headers) {
        delete event.request.headers["authorization"];
        delete event.request.headers["cookie"];
      }
      return event;
    },
  });
}
```

#### Middleware de Hono para Sentry:

```typescript
import { Hono } from "hono";
import * as Sentry from "@sentry/node";

const app = new Hono();

// Error handler con Sentry
app.onError((err, c) => {
  Sentry.captureException(err);

  return c.json(
    {
      error: "Internal Server Error",
      message: process.env.NODE_ENV === "development" ? err.message : undefined,
    },
    500,
  );
});
```

### 3. PostHog (apps/web)

Ya está configurado en el proyecto. Verificar en:

- `apps/web/lib/posthog.ts`
- `apps/web/providers/posthog-provider.tsx`

---

## Verificación y Testing

### 1. Verificar Sentry (Web)

Agregar botón de prueba en desarrollo:

```typescript
// apps/web/app/test-sentry/page.tsx
'use client';

import * as Sentry from '@sentry/nextjs';

export default function TestSentry() {
  return (
    <div>
      <button onClick={() => {
        throw new Error("Test error from Web!");
      }}>
        Throw Test Error
      </button>

      <button onClick={() => {
        Sentry.captureMessage("Test message from Web", "info");
      }}>
        Send Test Message
      </button>
    </div>
  );
}
```

### 2. Verificar Sentry (API)

Crear endpoint de prueba:

```typescript
// apps/api/src/routes/test-sentry.ts
import { Hono } from "hono";
import * as Sentry from "@sentry/node";

const app = new Hono();

app.get("/test-error", (c) => {
  throw new Error("Test error from API!");
});

app.get("/test-message", (c) => {
  Sentry.captureMessage("Test message from API", "info");
  return c.json({ message: "Message sent to Sentry" });
});

export default app;
```

### 3. Verificar PostHog

```typescript
// En cualquier componente cliente
import { usePostHog } from 'posthog-js/react';

export function TestPostHog() {
  const posthog = usePostHog();

  return (
    <button onClick={() => {
      posthog.capture('test_event', {
        property1: 'value1'
      });
    }}>
      Send Test Event to PostHog
    </button>
  );
}
```

### 4. Verificar Slack Webhook

```bash
curl -X POST YOUR_SLACK_WEBHOOK_URL \
  -H 'Content-Type: application/json' \
  -d '{
    "text": "🧪 Test notification from Brisa Cubana - Monitoring system is working!"
  }'
```

---

## Checklist de Configuración

### Sentry ✅

- [x] Proyectos creados (web + api)
- [x] DSN obtenidos
- [x] Variables de entorno configuradas en Vercel (Dev/Preview/Prod)
- [x] SDK instalado en `apps/web`
- [x] SDK instalado en `apps/api`
- [x] Alertas configuradas y enlazadas a Slack
- [x] Integración con Slack (`#alerts-operaciones`, `#alerts-criticos`, `#alerts-performance`)

### PostHog ✅

- [x] API Key obtenida y almacenada en 1Password
- [x] Variables de entorno configuradas en Vercel/GitHub
- [x] Webhooks configurados (Slack `#alerts-operaciones`)
- [x] Eventos clave definidos (ver `docs/product/analytics-events.md`)

### Slack ✅

- [x] Webhook URL vigente (`SLACK_WEBHOOK_URL`)
- [x] Canales creados (`#alerts-operaciones`, `#alerts-performance`, `#alerts-deployments`, `#leads-operaciones`)
- [x] Integración Sentry configurada
- [x] Integración PostHog configurada
- [x] Webhook testeado (último check 23-oct-2025)

---

## Próximos Pasos

1. Revisar y, si es necesario, ajustar umbrales de Sentry/PostHog el 30-oct-2025; registrar cualquier cambio adicional en la tabla de implementación.
2. Añadir panel de seguimiento del workflow `posthog-monitor.yml` al dashboard PostHog (due 05-nov-2025) e incluir el enlace en `docs/product/analytics-dashboard.md`.
3. Revisar retención de datos en PostHog (plan Starter) antes del 30-nov-2025.

---

## Recursos

- [Documentación Sentry Next.js](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Documentación Sentry Node.js](https://docs.sentry.io/platforms/node/)
- [Slack Incoming Webhooks](https://api.slack.com/messaging/webhooks)
- [PostHog Webhooks](https://posthog.com/docs/webhooks)

---

**Contacto:** Equipo Plataforma (`@oncall-platform`)
**Última revisión:** 2025-10-23
