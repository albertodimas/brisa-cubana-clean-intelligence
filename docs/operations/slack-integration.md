# Slack Integration - Brisa Cubana Clean Intelligence

**Last Updated:** October 21, 2025
**Status:** ✅ Configured (en producción) y monitoreada; última confirmación visual en `#todo-brisa-cubana` el 21-oct-2025.

---

## Overview

Brisa Cubana Clean Intelligence integrates with Slack to send real-time notifications about leads and important events. Notifications are sent to the `#todo-brisa-cubana` channel via an Incoming Webhook.

---

## Configuration

### Slack App Details

- **App Name:** Brisa Cubana Notifications
- **Workspace:** Brisa Cubana
- **Channel:** `#todo-brisa-cubana`
- **Created:** October 21, 2025
- **App ID:** A09MF1LE9UK

### Webhook URL

```
https://hooks.slack.com/services/YOUR_WORKSPACE/YOUR_CHANNEL/YOUR_SECRET
```

**⚠️ Security Note:** This URL is secret. Do NOT commit it to the repository. It's stored as an environment variable in Vercel.

---

## Environment Variables

### Production (Vercel)

The webhook URL must be configured in Vercel as an environment variable:

```bash
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR_WORKSPACE/YOUR_CHANNEL/YOUR_SECRET
```

**To configure in Vercel Dashboard:**

1. Go to: https://vercel.com/brisa-cubana/brisa-cubana-clean-intelligence/settings/environment-variables
2. Click **"Add New"**
3. Set:
   - **Name:** `SLACK_WEBHOOK_URL`
   - **Value:** `https://hooks.slack.com/services/YOUR_WORKSPACE/YOUR_CHANNEL/YOUR_SECRET`
   - **Environment:** Production
4. Click **"Save"**
5. Redeploy when prompted

**To configure via Vercel CLI:**

```bash
echo "https://hooks.slack.com/services/YOUR_WORKSPACE/YOUR_CHANNEL/YOUR_SECRET" | vercel env add SLACK_WEBHOOK_URL production
```

### Local Development

For local testing, add to your `.env.local`:

```bash
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR_WORKSPACE/YOUR_CHANNEL/YOUR_SECRET
```

**⚠️ Important:** Never commit `.env.local` to the repository.

---

## Usage

### Lead Notifications

When a new lead is created via the contact form on the landing page, a notification is automatically sent to Slack with:

- **Lead Name**
- **Email**
- **Phone** (if provided)
- **Marketing UTM Parameters:**
  - Source (utm_source)
  - Medium (utm_medium)
  - Campaign (utm_campaign)

**Implementation:** See [apps/web/app/api/leads/route.ts](../../apps/web/app/api/leads/route.ts:1)

### Manual Testing

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
# Basic test
bash scripts/test-slack-webhook.sh "Test message"

# Test with rich formatting
bash scripts/test-slack-webhook.sh "🎉 *Production deployment successful*\n\nVersion: 0.3.0\nTime: $(date)"
```

### Direct curl Test

```bash
curl -X POST \
  -H 'Content-Type: application/json' \
  -d '{"text":"Test notification from Brisa Cubana"}' \
  https://hooks.slack.com/services/YOUR_WORKSPACE/YOUR_CHANNEL/YOUR_SECRET
```

Expected response: `ok`

---

## Message Format

### Lead Notification Example

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
          "text": "📊 Campaign: summer_promo | Received: 2025-10-21 14:30:00"
        }
      ]
    }
  ]
}
```

---

## Troubleshooting

### Webhook Not Sending Notifications

1. **Verify environment variable is set:**

   ```bash
   vercel env ls production
   ```

2. **Check webhook URL is valid:**

   ```bash
   curl -X POST \
     -H 'Content-Type: application/json' \
     -d '{"text":"Test"}' \
     $SLACK_WEBHOOK_URL
   ```

   Should return: `ok`

3. **Check Slack app is still installed:**
   - Go to: https://api.slack.com/apps/A09MF1LE9UK
   - Verify app is installed in workspace
   - Check webhook is still active

4. **Review application logs:**
   ```bash
   vercel logs --prod
   ```

### Webhook Returns Error

| Error               | Cause                 | Solution                                 |
| ------------------- | --------------------- | ---------------------------------------- |
| `invalid_payload`   | Malformed JSON        | Validate JSON structure                  |
| `channel_not_found` | Channel was deleted   | Recreate webhook for different channel   |
| `account_inactive`  | Slack workspace issue | Contact Slack workspace admin            |
| `invalid_token`     | Webhook URL expired   | Regenerate webhook in Slack app settings |

---

## Security Best Practices

1. **Never expose webhook URL publicly**
   - Don't commit to git
   - Don't log in client-side code
   - Don't share in public channels

2. **Rotate webhook if compromised:**
   - Go to: https://api.slack.com/apps/A09MF1LE9UK/incoming-webhooks
   - Delete old webhook
   - Create new webhook
   - Update `SLACK_WEBHOOK_URL` in Vercel
   - Redeploy

3. **Monitor usage:**
   - Slack has rate limits (1 message per second)
   - Monitor for unexpected spikes
   - Implement retry logic for failures

---

## Registro de verificaciones

| Fecha (UTC)          | Resultado | Notas                                             |
| -------------------- | --------- | ------------------------------------------------- |
| 2025-10-21 06:12 UTC | ✅        | Mensaje recibido (inicio del historial en Slack). |

---

## Related Documentation

- [PostHog Analytics Dashboard](../product/analytics-dashboard.md) - Analytics configuration
- [Deployment Guide](../operations/deployment.md) - Production deployment process
- [Environment Variables](../guides/development.md#environment-variables) - Complete env vars reference

---

## Appendix: Slack API Resources

- **App Management:** https://api.slack.com/apps/A09MF1LE9UK
- **Incoming Webhooks Docs:** https://api.slack.com/messaging/webhooks
- **Message Formatting:** https://api.slack.com/reference/block-kit
- **Slack Workspace:** https://brisacubana.slack.com/

---

**Maintained by:** DevOps Team
**Contact:** Alberto Dimas (albertodimasmorazaldivar-7548)
**Last Test:** October 21, 2025 ✅ (mensaje confirmado en `#todo-brisa-cubana`)
