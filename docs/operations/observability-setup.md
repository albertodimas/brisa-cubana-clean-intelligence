# Observabilidad y Monitoreo - Configuración Completa

**Última actualización:** 20 de octubre, 2025
**Estado:** ✅ Proyectos Sentry creados | ⏳ Integración Slack pendiente

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
```

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

#### **1. Alertas de Error Rate (Tasa de Errores)**

**Para Web:**

1. Ve a https://sentry.io/organizations/brisacubana/alerts/brisa-cubana-web/
2. Click en **"Create Alert"**
3. Selecciona **"Issues"**
4. Configura:
   - **Metric:** `Number of events`
   - **Threshold:** `> 10 events in 1 minute`
   - **Action:** `Send notification to #alerts channel` (requiere integración Slack)

**Para API:**

1. Ve a https://sentry.io/organizations/brisacubana/alerts/brisa-cubana-api/
2. Repite configuración anterior

#### **2. Alertas de Nuevos Issues**

Configurar para recibir notificación cuando aparezca un error nuevo:

1. En cada proyecto → **Settings** → **Alerts**
2. Click **"Create Alert"**
3. Selecciona **"Issue Alerts"**
4. Condición: `A new issue is created`
5. Acción: `Send a notification to #alerts` (requiere Slack)

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

---

## Slack - Alertas y Notificaciones

### 🚨 **ACCIÓN REQUERIDA: Crear Webhook de Slack**

Para que Sentry y PostHog puedan enviar alertas, necesitas crear un **Incoming Webhook** en Slack:

#### **Pasos para crear el Webhook:**

1. **Ve a Slack API Apps:** https://api.slack.com/apps
2. **Crea una nueva app:**
   - Click **"Create New App"** → **"From scratch"**
   - Nombre: `Brisa Cubana Monitoring`
   - Workspace: Selecciona tu workspace
3. **Activa Incoming Webhooks:**
   - En el menú lateral: **"Incoming Webhooks"**
   - Toggle **"Activate Incoming Webhooks"** → ON
4. **Crea un nuevo webhook:**
   - Click **"Add New Webhook to Workspace"**
   - Selecciona canal: `#alerts` (o créalo si no existe)
   - Click **"Allow"**
5. **Copia la Webhook URL:**
   - Formato: `https://hooks.slack.com/services/T123ABC/B456DEF/xyz789abc`
   - **¡GUÁRDALA DE FORMA SEGURA!**

#### **Canales recomendados:**

Crea estos canales en Slack para organizar alertas:

- **#alerts** - Errores críticos de Sentry
- **#monitoring** - Métricas y health checks
- **#deployments** - Notificaciones de CI/CD
- **#product-analytics** - Insights de PostHog

### Configurar Sentry → Slack

Una vez tengas la Webhook URL:

1. Ve a **Sentry** → **Settings** → **Integrations**
2. Busca **"Slack"** → Click **"Install"**
3. Autoriza el workspace
4. En cada proyecto (web y api):
   - Ve a **Settings** → **Alerts**
   - Edita las alertas creadas
   - En **"Then perform these actions"** → **"Send notification to"** → Selecciona `#alerts`

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
- [ ] Variables de entorno configuradas en Vercel
- [ ] SDK instalado en apps/web
- [ ] SDK instalado en apps/api
- [ ] Alertas configuradas
- [ ] Integración con Slack

### PostHog ⏳

- [ ] API Key obtenida
- [ ] Variables de entorno configuradas
- [ ] Webhooks configurados
- [ ] Eventos clave definidos

### Slack ⏳

- [ ] Webhook URL obtenida
- [ ] Canales creados (#alerts, #monitoring)
- [ ] Integración Sentry configurada
- [ ] Integración PostHog configurada
- [ ] Webhook testeado

---

## Próximos Pasos

1. **Urgente:** Crear Slack Webhook siguiendo instrucciones arriba
2. Configurar variables de entorno en Vercel (web y api)
3. Instalar SDKs de Sentry en ambas apps
4. Configurar alertas en Sentry
5. Testear todas las integraciones
6. Documentar runbook de respuesta a incidentes

---

## Recursos

- [Documentación Sentry Next.js](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Documentación Sentry Node.js](https://docs.sentry.io/platforms/node/)
- [Slack Incoming Webhooks](https://api.slack.com/messaging/webhooks)
- [PostHog Webhooks](https://posthog.com/docs/webhooks)

---

**Contacto:** Alberto Dimas (albertodimasmorazaldivar@gmail.com)
**Última revisión:** 2025-10-20
