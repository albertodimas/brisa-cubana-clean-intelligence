# Integración con Slack - Brisa Cubana Clean Intelligence

**Última actualización:** 21 de octubre de 2025  
**Estado:** ✅ Configurada (en producción) y monitoreada; última confirmación visual en `#todo-brisa-cubana` el 21-oct-2025.

---

## Resumen

Brisa Cubana Clean Intelligence se integra con Slack para enviar notificaciones en tiempo real sobre leads y eventos operativos relevantes. Todos los avisos se publican en el canal `#todo-brisa-cubana` mediante un Incoming Webhook.

---

## Configuración

### Detalles de la app de Slack

- **Nombre de la app:** Brisa Cubana Notifications
- **Workspace:** Brisa Cubana
- **Canal:** `#todo-brisa-cubana`
- **Creada:** 21 de octubre de 2025
- **App ID:** A09MF1LE9UK

### URL del Webhook

```
https://hooks.slack.com/services/YOUR_WORKSPACE/YOUR_CHANNEL/YOUR_SECRET
```

**⚠️ Nota de seguridad:** Esta URL es secreta. No la confirmes en el repositorio. Se guarda como variable de entorno en Vercel.

---

## Variables de entorno

### Producción (Vercel)

La URL del webhook debe configurarse en Vercel como variable de entorno:

```bash
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR_WORKSPACE/YOUR_CHANNEL/YOUR_SECRET
```

**Para configurarla desde el dashboard de Vercel:**

1. Visita: https://vercel.com/brisa-cubana/brisa-cubana-clean-intelligence/settings/environment-variables
2. Haz clic en **"Add New"**
3. Define:
   - **Name:** `SLACK_WEBHOOK_URL`
   - **Value:** `https://hooks.slack.com/services/YOUR_WORKSPACE/YOUR_CHANNEL/YOUR_SECRET`
   - **Environment:** Production
4. Guarda con **"Save"**
5. Re desplega cuando el panel lo solicite

**Para configurarla vía Vercel CLI:**

```bash
echo "https://hooks.slack.com/services/YOUR_WORKSPACE/YOUR_CHANNEL/YOUR_SECRET" | vercel env add SLACK_WEBHOOK_URL production
```

### Desarrollo local

Para pruebas locales agrega a tu `.env.local`:

```bash
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR_WORKSPACE/YOUR_CHANNEL/YOUR_SECRET
```

**⚠️ Importante:** Nunca confirmes `.env.local` en el repositorio.

---

## Uso

### Notificaciones de leads

Cuando se crea un nuevo lead mediante el formulario público de la landing, se envía automáticamente una notificación a Slack con:

- **Nombre del lead**
- **Email**
- **Teléfono** (si se captura)
- **Parámetros UTM de marketing:**
  - Fuente (`utm_source`)
  - Medio (`utm_medium`)
  - Campaña (`utm_campaign`)

> Desde el 22-oct-2025 el formulario público persiste y reenvía automáticamente los parámetros UTM capturados en la URL (o en visitas previas), por lo que las notificaciones siempre incluyen el último contexto de campaña disponible.

**Implementación:** consulta [apps/web/app/api/leads/route.ts](../../apps/web/app/api/leads/route.ts:1)

### Pruebas manuales

**Secuencia recomendada (producción):**

```bash
vercel env pull .env.vercel-prod --environment production --scope brisa-cubana
source .env.vercel-prod
SLACK_WEBHOOK_URL="$SLACK_WEBHOOK_URL" bash scripts/test-slack-webhook.sh "🛰️ Monitoreo automático: webhook activo $(date -u '+%Y-%m-%d %H:%M UTC')"
rm .env.vercel-prod
```

1. Ejecuta los comandos anteriores en una terminal segura. Descarga temporalmente el `.env`, envía un mensaje de control y elimina el archivo inmediatamente.
2. Abre Slack y confirma que el mensaje aparece en `#todo-brisa-cubana`. Registra la fecha en la tabla de verificaciones.
3. Para pruebas locales o puntuales puedes usar:

```bash
# Prueba básica
bash scripts/test-slack-webhook.sh "Mensaje de prueba"

# Prueba con formato enriquecido
bash scripts/test-slack-webhook.sh "🎉 *Despliegue en producción exitoso*\n\nVersión: 0.3.0\nHora: $(date)"
```

### Prueba directa con curl

```bash
curl -X POST \
  -H 'Content-Type: application/json' \
  -d '{"text":"Notificación de prueba desde Brisa Cubana"}' \
  https://hooks.slack.com/services/YOUR_WORKSPACE/YOUR_CHANNEL/YOUR_SECRET
```

Respuesta esperada: `ok`

---

## Formato del mensaje

### Ejemplo de notificación de lead

```json
{
  "text": "*🆕 Nuevo Lead Recibido*",
  "blocks": [
    {
      "type": "header",
      "text": {
        "type": "plain_text",
        "text": "🆕 Nuevo Lead Recibido"
      }
    },
    {
      "type": "section",
      "fields": [
        {
          "type": "mrkdwn",
          "text": "*Nombre:*\nJuan Pérez"
        },
        {
          "type": "mrkdwn",
          "text": "*Email:*\njuan@example.com"
        },
        {
          "type": "mrkdwn",
          "text": "*Teléfono:*\n+1 234 567 8900"
        },
        {
          "type": "mrkdwn",
          "text": "*Fuente:*\nGoogle Ads / CPC"
        }
      ]
    },
    {
      "type": "context",
      "elements": [
        {
          "type": "mrkdwn",
          "text": "📊 Campaña: summer_promo | Recibido: 2025-10-21 14:30:00"
        }
      ]
    }
  ]
}
```

---

## Solución de problemas

### El webhook no envía notificaciones

1. **Verifica que la variable de entorno exista:**

   ```bash
   vercel env ls production
   ```

2. **Confirma que la URL del webhook sea válida:**

   ```bash
   curl -X POST \
     -H 'Content-Type: application/json' \
     -d '{"text":"Test"}' \
     $SLACK_WEBHOOK_URL
   ```

   La respuesta debe ser: `ok`

3. **Comprueba que la app de Slack siga instalada:**
   - Visita: https://api.slack.com/apps/A09MF1LE9UK
   - Verifica que la app continúe instalada en el workspace
   - Confirma que el webhook siga activo

4. **Revisa los logs de la aplicación:**
   ```bash
   vercel logs --prod
   ```

### El webhook devuelve un error

| Error               | Causa                    | Solución                                          |
| ------------------- | ------------------------ | ------------------------------------------------- |
| `invalid_payload`   | JSON mal formado         | Valida la estructura del JSON                     |
| `channel_not_found` | Canal eliminado          | Recrea el webhook apuntando a otro canal          |
| `account_inactive`  | Problema en el workspace | Contacta al administrador del workspace Slack     |
| `invalid_token`     | URL del webhook expirada | Regenera el webhook en la configuración de la app |

---

## Mejores prácticas de seguridad

1. **Nunca expongas la URL del webhook públicamente**
   - No la confirmes en git
   - No la registres en logs del cliente
   - No la compartas en canales públicos

2. **Rota el webhook si se compromete:**
   - Visita: https://api.slack.com/apps/A09MF1LE9UK/incoming-webhooks
   - Elimina el webhook anterior
   - Crea uno nuevo
   - Actualiza `SLACK_WEBHOOK_URL` en Vercel
   - Vuelve a desplegar

3. **Monitorea el uso:**
   - Slack aplica límites (1 mensaje por segundo)
   - Vigila picos inesperados
   - Implementa reintentos ante fallas

---

## Registro de verificaciones

| Fecha (UTC)          | Resultado | Notas                                                     |
| -------------------- | --------- | --------------------------------------------------------- |
| 2025-10-21 06:12 UTC | ✅        | Mensaje recibido (inicio del historial en Slack).         |
| 2025-10-21 13:59 UTC | ✅        | Alerta enviada con `pnpm posthog:monitor` (hook PostHog). |

---

## Documentación relacionada

- [Dashboard de PostHog Analytics](../product/analytics-dashboard.md) - Configuración de analítica
- [Guía de despliegues](../operations/deployment.md) - Proceso de despliegue a producción
- [Variables de entorno](../guides/development.md#environment-variables) - Referencia completa de variables

---

## Apéndice: recursos de la API de Slack

- **Administración de la app:** https://api.slack.com/apps/A09MF1LE9UK
- **Documentación de Incoming Webhooks:** https://api.slack.com/messaging/webhooks
- **Formato de mensajes (Block Kit):** https://api.slack.com/reference/block-kit
- **Workspace de Slack:** https://brisacubana.slack.com/

---

**Responsable:** Equipo de DevOps
**Contacto:** Alberto Dimas (albertodimasmorazaldivar-7548)
**Última prueba:** 21 de octubre de 2025 ✅ (mensaje confirmado en `#todo-brisa-cubana`)
