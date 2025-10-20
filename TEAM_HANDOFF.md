# 📦 Entrega al Equipo: Sistema de Observabilidad Configurado

**Fecha:** 20 de octubre, 2025
**Preparado por:** Claude Code + Alberto Dimas
**Estado:** ✅ 80% Completado | ⏳ 20% Requiere acción del equipo

---

## 📋 Resumen Ejecutivo

Se ha configurado la **infraestructura de observabilidad** para monitorear errores, performance y comportamiento de usuarios en producción.

**Herramientas integradas:**

- ✅ **Sentry** - Monitoreo de errores y performance
- ⏳ **Slack** - Alertas en tiempo real (pendiente de webhook)
- ⏳ **PostHog** - Análisis de producto (ya configurado en apps/web, falta integración Slack)

---

## ✅ Trabajo Completado

### 1. Proyectos de Sentry Creados

Se crearon **dos proyectos separados** para aislar errores de frontend y backend:

| Aplicación        | Proyecto Sentry  | Slug               | Plataforma           |
| ----------------- | ---------------- | ------------------ | -------------------- |
| **Web (Next.js)** | Brisa Cubana Web | `brisa-cubana-web` | JavaScript (Next.js) |
| **API (Hono)**    | Brisa Cubana API | `brisa-cubana-api` | Node.js              |

**URLs de acceso:**

- Web: https://sentry.io/organizations/brisacubana/projects/brisa-cubana-web/
- API: https://sentry.io/organizations/brisacubana/projects/brisa-cubana-api/

### 2. DSN (Data Source Names) Obtenidos

**Para Web (apps/web):**

```
https://61251c0e4f5553d7febc1d31ab8a9da6@o4509669004541952.ingest.us.sentry.io/4510220183273472
```

**Para API (apps/api):**

```
https://62f6df73f4e95ea1748c4718abeefdb1@o4509669004541952.ingest.us.sentry.io/4510220184059904
```

💡 **Nota:** Los DSN son públicos por diseño y pueden compartirse con el equipo.

### 3. Auth Token Configurado

- Ubicación segura: 1Password → **“Sentry · Brisa Cubana · Auth Token (Admin)”**
- Variables recomendadas:
  - `SENTRY_AUTH_TOKEN=<SENTRY_AUTH_TOKEN>`
  - Agregar únicamente en Vercel y GitHub Secrets (CI/CD)

🔒 **Importante:** El token nunca debe publicarse en repositorios ni documentación compartida.

### 4. Documentación Creada

**Archivos nuevos:**

1. **[`OBSERVABILITY_QUICKSTART.md`](OBSERVABILITY_QUICKSTART.md)**
   - Guía rápida de 15 minutos
   - Checklist de configuración
   - Instrucciones para crear Slack Webhook
   - Variables de entorno para Vercel

2. **[`docs/operations/observability-setup.md`](docs/operations/observability-setup.md)**
   - Documentación técnica completa
   - Guías de instalación de SDKs
   - Configuración de alertas
   - Endpoints de testing
   - Troubleshooting

3. **[`.env.example`](.env.example)** - Actualizado
   - Variables de Sentry agregadas
   - Variable de Slack Webhook
   - Comentarios con valores de producción

---

## ⏳ Acciones Pendientes (REQUIERE EQUIPO)

### 🚨 CRÍTICO: Crear Webhook de Slack (5 minutos)

**Por qué es necesario:**
Para recibir alertas de errores críticos en tiempo real en Slack.

**Cómo hacerlo:**

1. Ir a https://api.slack.com/apps
2. Crear app "Brisa Cubana Monitoring"
3. Activar "Incoming Webhooks"
4. Agregar webhook al canal `#alerts`
5. Copiar URL del webhook

**Resultado esperado:**

```
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/T123/B456/xyz789
```

📖 **Guía detallada:** Ver sección "Slack" en [`OBSERVABILITY_QUICKSTART.md`](OBSERVABILITY_QUICKSTART.md)

---

### ⚙️ IMPORTANTE: Configurar Variables en Vercel (10 minutos)

**Por qué es necesario:**
Para que las aplicaciones en producción envíen errores a Sentry.

**Proyectos de Vercel a configurar:**

1. `brisa-cubana-clean-intelligence` (Web)
2. `brisa-cubana-clean-intelligence-api` (API)

**Variables a agregar en CADA proyecto:**

#### Web:

```bash
NEXT_PUBLIC_SENTRY_DSN=https://61251c0e4f5553d7febc1d31ab8a9da6@o4509669004541952.ingest.us.sentry.io/4510220183273472
SENTRY_ORG=brisacubana
SENTRY_PROJECT=brisa-cubana-web
SENTRY_AUTH_TOKEN=<SENTRY_AUTH_TOKEN>
```

#### API:

```bash
SENTRY_DSN=https://62f6df73f4e95ea1748c4718abeefdb1@o4509669004541952.ingest.us.sentry.io/4510220184059904
SENTRY_ORG=brisacubana
SENTRY_PROJECT=brisa-cubana-api
SENTRY_AUTH_TOKEN=<SENTRY_AUTH_TOKEN>
SENTRY_ENVIRONMENT=production
```

**Ambientes:** Marcar `Production`, `Preview` y `Development` para todas.

📖 **Guía paso a paso:** Ver sección 2 en [`OBSERVABILITY_QUICKSTART.md`](OBSERVABILITY_QUICKSTART.md)

---

### 🔧 RECOMENDADO: Instalar SDKs de Sentry (30 minutos)

**Esto es opcional inicialmente**, pero recomendado antes del próximo deploy a producción.

**Web (apps/web):**

```bash
cd apps/web
pnpm add @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

**API (apps/api):**

```bash
cd apps/api
pnpm add @sentry/node @sentry/profiling-node
```

Luego configurar según [`docs/operations/observability-setup.md`](docs/operations/observability-setup.md#configuración-en-aplicaciones)

---

## 🧪 Cómo Verificar que Todo Funciona

### 1. Verificar acceso a Sentry

```bash
sentry-cli projects --org brisacubana list
```

**Resultado esperado:**

```
brisa-cubana-web
brisa-cubana-api
```

### 2. Verificar Slack Webhook (después de crearlo)

```bash
curl -X POST TU_SLACK_WEBHOOK_URL \
  -H 'Content-Type: application/json' \
  -d '{"text":"✅ Monitoring configurado!"}'
```

**Resultado esperado:** Mensaje aparece en `#alerts`

### 3. Probar Sentry en producción (después de instalar SDK)

Visitar (en producción):

- Web: `https://brisa-cubana-clean-intelligence.vercel.app/test-sentry`
- API: `https://brisa-cubana-clean-intelligence-api.vercel.app/test-error`

Luego verificar en Sentry UI que los errores aparecen.

---

## 📊 Métricas y Alertas Configurables

Una vez completada la configuración básica, se pueden crear:

### Alertas recomendadas en Sentry:

1. **Error Rate Alert**
   - Condición: > 10 errores en 1 minuto
   - Acción: Notificar a `#alerts`

2. **New Issue Alert**
   - Condición: Nuevo tipo de error detectado
   - Acción: Notificar a `#alerts`

3. **Performance Degradation**
   - Condición: P95 response time > 2 segundos
   - Acción: Notificar a `#monitoring`

### Dashboards de PostHog:

PostHog ya está configurado en `apps/web`. Próximos pasos:

- Conectar con Slack (mismo webhook)
- Crear alertas de producto (ej: caída en conversiones)
- Configurar funnels de análisis

---

## 🗂️ Estructura de Archivos

```
brisa-cubana-clean-intelligence/
├── OBSERVABILITY_QUICKSTART.md          ← ⭐ EMPEZAR AQUÍ
├── TEAM_HANDOFF.md                      ← Este archivo
├── .env.example                          ← Actualizado con vars Sentry
└── docs/
    └── operations/
        └── observability-setup.md        ← Documentación técnica completa
```

---

## 📞 Contacto y Soporte

### Para dudas técnicas:

- **Email:** albertodimasmorazaldivar@gmail.com
- **GitHub Issues:** https://github.com/albertodimas/brisa-cubana-clean-intelligence/issues

### Para acceso a herramientas:

- **Sentry:** albertodimasmorazaldivar@gmail.com (owner)
- **Vercel:** Verificar acceso al team
- **Slack:** Crear webhook requiere admin del workspace

---

## ✅ Checklist Final para el Equipo

**Antes del próximo deploy a producción:**

- [ ] Crear Slack Webhook y guardarlo en lugar seguro
- [ ] Agregar variables de Sentry en Vercel (Web + API)
- [ ] Testear Slack Webhook con curl
- [ ] Instalar SDK de Sentry en apps/web
- [ ] Instalar SDK de Sentry en apps/api
- [ ] Configurar alertas básicas en Sentry
- [ ] Crear canales en Slack (`#alerts`, `#monitoring`)
- [ ] Testear errores en staging/preview
- [ ] Documentar procedimiento de respuesta a incidentes
- [ ] Compartir accesos con equipo DevOps

**Nice to have (no bloqueante):**

- [ ] Configurar PostHog webhooks a Slack
- [ ] Crear dashboard de métricas clave
- [ ] Configurar alertas de performance
- [ ] Integrar con PagerDuty/OpsGenie (si se usa)

---

## 🎯 Impacto Esperado

Una vez completada la configuración:

✅ **Detección temprana de errores** - Alertas en < 1 minuto
✅ **Mejor experiencia de usuario** - Bugs resueltos más rápido
✅ **Visibilidad de performance** - Identificar cuellos de botella
✅ **Data-driven decisions** - Analytics de producto con PostHog
✅ **Menor tiempo de respuesta** - Equipo notificado al instante

---

## 📚 Referencias

- [Sentry Next.js Guide](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Sentry Node.js Guide](https://docs.sentry.io/platforms/node/)
- [Slack Incoming Webhooks](https://api.slack.com/messaging/webhooks)
- [PostHog Webhooks](https://posthog.com/docs/webhooks)
- [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables)

---

**🚀 ¡Listo para producción una vez completados los pasos pendientes!**

---

_Generado automáticamente el 2025-10-20_
_Última actualización: Ver commit history_
