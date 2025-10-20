# 🚀 Guía Rápida: Configuración de Observabilidad

**Fecha:** 20 de octubre, 2025
**Tiempo estimado:** 15-20 minutos
**Responsable:** Equipo de DevOps/Desarrollo

---

## ✅ Lo que YA está hecho

- ✅ **Proyectos de Sentry creados**
  - `brisa-cubana-web` (Next.js)
  - `brisa-cubana-api` (Node.js/Hono)
- ✅ **DSN configurados**
- ✅ **Auth tokens generados**
- ✅ **Reglas de alerta por correo** (spike de errores y nuevos issues en ambos proyectos)
- ✅ **Documentación completa** en `docs/operations/observability-setup.md`

---

## ⏳ Lo que FALTA por hacer (ACCIÓN REQUERIDA)

### 1️⃣ Crear Webhook de Slack (5 minutos)

**Objetivo:** Recibir alertas de errores críticos en Slack (además de correo)

**Pasos:**

1. Ve a https://api.slack.com/apps
2. Click **"Create New App"** → **"From scratch"**
   - Nombre: `Brisa Cubana Monitoring`
   - Workspace: Selecciona tu workspace de Slack
3. En la app creada:
   - Sidebar → **"Incoming Webhooks"**
   - Toggle **ON**
   - Click **"Add New Webhook to Workspace"**
   - Selecciona el canal `#alerts` (créalo si no existe)
4. **Copia la Webhook URL** (formato: `https://hooks.slack.com/services/...`)

**✏️ Pega aquí tu Webhook URL:**

```
SLACK_WEBHOOK_URL=_______________________________________________
```

---

### 2️⃣ Configurar Variables de Entorno en Vercel (10 minutos)

**Objetivo:** Que las apps en producción envíen errores a Sentry

#### **Para el proyecto Web (brisa-cubana-clean-intelligence)**

1. Ve a https://vercel.com/tu-equipo/brisa-cubana-clean-intelligence/settings/environment-variables
2. Agrega estas variables:

> 🔐 **Importante:** Obtén el token desde 1Password → “Sentry · Brisa Cubana · Auth Token (Admin)”.  
> No lo copies en documentación ni repositorios públicos.

```bash
# Sentry - Web
NEXT_PUBLIC_SENTRY_DSN=https://61251c0e4f5553d7febc1d31ab8a9da6@o4509669004541952.ingest.us.sentry.io/4510220183273472
SENTRY_ORG=brisacubana
SENTRY_PROJECT=brisa-cubana-web
SENTRY_AUTH_TOKEN=<SENTRY_AUTH_TOKEN>
```

**Ambiente:** Production, Preview, Development (marcar los 3)

#### **Para el proyecto API (brisa-cubana-clean-intelligence-api)**

1. Ve a https://vercel.com/tu-equipo/brisa-cubana-clean-intelligence-api/settings/environment-variables
2. Agrega estas variables:

```bash
# Sentry - API
SENTRY_DSN=https://62f6df73f4e95ea1748c4718abeefdb1@o4509669004541952.ingest.us.sentry.io/4510220184059904
SENTRY_ORG=brisacubana
SENTRY_PROJECT=brisa-cubana-api
SENTRY_AUTH_TOKEN=<SENTRY_AUTH_TOKEN>
SENTRY_ENVIRONMENT=production
```

**Ambiente:** Production, Preview, Development (marcar los 3)

---

### 3️⃣ Testear la Configuración (5 minutos)

#### **Test 1: Verificar Slack Webhook**

```bash
curl -X POST TU_SLACK_WEBHOOK_URL \
  -H 'Content-Type: application/json' \
  -d '{"text":"🧪 Test: Monitoring configurado correctamente!"}'
```

**Resultado esperado:** Mensaje en el canal `#alerts` de Slack

#### **Test 2: Verificar Sentry CLI**

```bash
sentry-cli projects --org brisacubana list
```

**Resultado esperado:**

```
brisa-cubana-web
brisa-cubana-api
```

---

## 📊 Información de Acceso (para compartir con el equipo)

### Sentry

| Campo            | Valor                                                                  |
| ---------------- | ---------------------------------------------------------------------- |
| **Organización** | `brisacubana`                                                          |
| **Proyecto Web** | `brisa-cubana-web`                                                     |
| **Proyecto API** | `brisa-cubana-api`                                                     |
| **URL Web**      | https://sentry.io/organizations/brisacubana/projects/brisa-cubana-web/ |
| **URL API**      | https://sentry.io/organizations/brisacubana/projects/brisa-cubana-api/ |

### DSN (Data Source Names)

**🔐 IMPORTANTE: Estos DSN son públicos y pueden compartirse con el equipo**

**Web (Next.js):**

```
https://61251c0e4f5553d7febc1d31ab8a9da6@o4509669004541952.ingest.us.sentry.io/4510220183273472
```

**API (Node.js):**

```
https://62f6df73f4e95ea1748c4718abeefdb1@o4509669004541952.ingest.us.sentry.io/4510220184059904
```

### Auth Token

**🔒 SECRETO - NO COMPARTIR EN CÓDIGO**

- Ubicación: 1Password → “Sentry · Brisa Cubana · Auth Token (Admin)”
- Variable: `SENTRY_AUTH_TOKEN=<SENTRY_AUTH_TOKEN>`

**Scopes del token:**

- `alerts:read`, `alerts:write`
- `project:admin`, `project:read`, `project:write`
- `org:read`, `org:write`
- Y más... (ver `sentry-cli info` para lista completa)

---

## 🎯 Próximos Pasos (después de completar lo anterior)

1. **Instalar SDK de Sentry** en apps/web y apps/api
2. **Configurar alertas** en Sentry (email, Slack)
3. **Conectar PostHog con Slack** (webhooks)
4. **Definir SLOs** (Service Level Objectives)
5. **Crear runbook** de respuesta a incidentes

**Documentación completa:** [`docs/operations/observability-setup.md`](docs/operations/observability-setup.md)

---

## ❓ Preguntas Frecuentes

### ¿Qué pasa si no configuro Slack?

Sentry enviará alertas por email por defecto. Slack es opcional pero recomendado para respuesta rápida.

### ¿Puedo usar estos DSN en desarrollo local?

**No es necesario.** En desarrollo, los errores se muestran en consola. Sentry es para producción.

Para testear Sentry localmente, crea un archivo `.env.local` con las variables pero **no lo commitees**.

### ¿Cómo invito a más personas al proyecto Sentry?

1. Ve a https://sentry.io/settings/brisacubana/members/
2. Click **"Invite Member"**
3. Ingresa email y rol (Admin, Manager, Member)

### ¿Los DSN son secretos?

**No.** Los DSN son públicos por diseño. Solo permiten **enviar** eventos a Sentry, no leerlos.

El **Auth Token** SÍ es secreto y da acceso administrativo.

---

## 📞 Contacto

**En caso de dudas:**

- Email: albertodimasmorazaldivar@gmail.com
- Slack: @alberto (si ya tienes el workspace)
- GitHub Issues: https://github.com/albertodimas/brisa-cubana-clean-intelligence/issues

---

**¡Listo! Una vez completes estos pasos, el sistema de observabilidad estará 100% operativo.**
