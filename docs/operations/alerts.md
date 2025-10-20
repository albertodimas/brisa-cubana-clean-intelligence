# Alertas Operativas - Brisa Cubana Clean Intelligence

## Overview

Este documento describe la configuración de alertas para monitoreo proactivo de errores, performance y disponibilidad del sistema.

> **Estado 20-oct-2025:** Las reglas de Sentry envían correo; la notificación a Slack quedará operativa en cuanto se configure `SLACK_WEBHOOK_URL` en Vercel/GitHub.

## Sentry Alerts

### Configuración de Alertas de Errores

**Verificación rápida:** Una vez creadas las reglas, ejecuta `SENTRY_AUTH_TOKEN=... pnpm sentry:test-event "Verificación alertas Sentry"` para forzar un evento y confirmar las notificaciones. Hasta configurar Slack, la confirmación llegará por email (`notify_event`).

#### 1. New Issue Alert (Errores Nuevos)

**Cuándo**: Un error nunca antes visto aparece en producción

**Configuración**:

1. En Sentry Dashboard → Alerts → Create Alert Rule
2. Seleccionar "Issues"
3. Configurar:
   - **When**: "A new issue is created"
   - **Environment**: Production
   - **Then**: Send notification to:
     - Slack: #brisa-alerts
     - Email: ops@brisacubanaclean.com

**Severidad**: 🔴 Alta (responder en <15 minutos)

#### 2. High Frequency Errors

**Cuándo**: Un error ocurre más de 10 veces en 5 minutos

**Configuración**:

```yaml
When: Event frequency
Condition:
  - Environment: production
  - Events: > 10
  - Interval: 5 minutes
Then:
  - Slack: #brisa-critical
  - Email: admin@brisacubanaclean.com
  - PagerDuty: (opcional)
```

**Severidad**: 🔴 Crítica (responder inmediatamente)

#### 3. Regression Alert

**Cuándo**: Un error previamente resuelto vuelve a aparecer

**Configuración**:

```yaml
When: Issue changes state
Condition:
  - State: unresolved → regressed
  - Environment: production
Then:
  - Slack: #brisa-alerts
  - Email: dev-team@brisacubanaclean.com
```

**Severidad**: 🟡 Media (revisar en <1 hora)

### Configuración de Alertas de Performance

#### 4. Slow API Responses

**Cuándo**: Endpoint tarda más de 2 segundos en responder

**Configuración**:

```yaml
Metric Alert:
  When: avg(transaction.duration)
  Condition: > 2000ms
  Filter:
    - transaction.op: http.server
    - Environment: production
  For: 5 minutes
  Then:
    - Slack: #brisa-performance
    - Email: ops@brisacubanaclean.com
```

**Severidad**: 🟡 Media

#### 5. High Error Rate

**Cuándo**: Tasa de errores supera el 5%

**Configuración**:

```yaml
Metric Alert:
  When: percentage(events.failed, events.total)
  Condition: > 5%
  Filter:
    - Environment: production
  For: 5 minutes
  Then:
    - Slack: #brisa-critical
    - Email: admin@brisacubanaclean.com
```

**Severidad**: 🔴 Crítica

#### 6. Database Query Performance

**Cuándo**: Queries de base de datos tardan más de 1 segundo

**Configuración**:

```yaml
Metric Alert:
  When: avg(span.duration)
  Condition: > 1000ms
  Filter:
    - span.op: db.query
    - Environment: production
  For: 10 minutes
  Then:
    - Slack: #brisa-performance
```

**Severidad**: 🟡 Media

#### 7. Notificaciones SSE en modo fallback

**Cuándo**: El hook `useNotificationStream` entra en estado `polling` (fallback) o se registran más de 3 reconexiones consecutivas.

**Configuración**:

```yaml
Metric Alert:
  When: event.count()
  Dataset: transactions
  Query: message:"notifications.stream.fallback"
  For: 5 minutes
  Then:
    - Slack: #brisa-alerts
    - Email: ops@brisacubanaclean.com
```

**Severidad**: 🟡 Media (verificar que Vercel o SSE no estén bloqueados por proxies)

## Slack Integration

### Setup

1. **Crear Webhooks en Slack**:

   ```bash
   # En Slack workspace
   Settings & administration → Manage apps → Incoming Webhooks
   ```

2. **Canales Recomendados**:
   - `#brisa-critical` - Errores críticos, alta frecuencia
   - `#brisa-alerts` - Nuevos errores, regresiones
   - `#brisa-performance` - Alertas de performance
   - `#brisa-deployments` - Notificaciones de deploy

3. **Configurar en Sentry** _(pendiente hasta tener el webhook)_:

```
Settings → Integrations → Slack
→ Add to Slack → Authorize
→ Configure channels per alert rule (usar #brisa-alerts / #brisa-critical)
```

4. **Probar webhook**: `SLACK_WEBHOOK_URL=<url> scripts/test-slack-webhook.sh "🧪 Webhook listo"` (pendiente de crear webhook)

### Formato de Mensajes

```
🔴 [CRITICAL] High Error Rate Alert
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Environment: production
Error Rate: 8.5% (threshold: 5%)
Duration: Last 5 minutes
Link: https://sentry.io/...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
@channel - Requires immediate attention
```

## GitHub Actions Monitoring

- **Nightly Lighthouse budgets:** el job `Nightly Lighthouse budgets` en `nightly.yml` usa `scripts/check_lighthouse_streak.py` para contar fallos consecutivos.
  - Si el run actual falla, se calcula el streak revisando los últimos 20 runs completados.
  - El step añade un resumen al `GITHUB_STEP_SUMMARY` y, cuando el streak alcanza ≥3, falla el job para visibilizar la regresión.
  - Propietario sugerido: Plataforma (revisar dashboards Lighthouse y abrir incidencia si se supera el umbral).

## Email Notifications

### Destinatarios por Tipo de Alerta

| Alerta           | Destinatarios                                        |
| ---------------- | ---------------------------------------------------- |
| Errores Críticos | admin@brisacubanaclean.com, ops@brisacubanaclean.com |
| Nuevos Errores   | ops@brisacubanaclean.com                             |
| Performance      | ops@brisacubanaclean.com                             |
| Regresiones      | dev-team@brisacubanaclean.com                        |
| Deploy Success   | ops@brisacubanaclean.com                             |

### Digest Diario

**Configurar en Sentry**:

- User Settings → Notifications
- Enable "Daily Summary"
- Time: 9:00 AM (hora local)

Incluye:

- Total de errores nuevos
- Errores sin resolver
- Trends de performance
- Deploy history

## PagerDuty (Opcional)

Para alertas críticas 24/7:

### Setup

1. Crear cuenta en PagerDuty
2. Crear Service: "Brisa Cubana Production"
3. Obtener Integration Key
4. Configurar en Sentry:
   ```
   Settings → Integrations → PagerDuty
   → Add Integration → Enter Key
   ```

### Escalation Policy

```
Level 1: On-call engineer (15 min)
Level 2: Tech lead (30 min)
Level 3: CTO (1 hour)
```

## Vercel Deployment Alerts

### GitHub Actions Notifications

Configurar en `.github/workflows/ci.yml`:

```yaml
- name: Notify Slack on Failure
  if: failure()
  uses: slackapi/slack-github-action@v1
  with:
    webhook-url: ${{ secrets.SLACK_WEBHOOK_URL }}
    payload: |
      {
        "text": "🔴 CI Pipeline Failed",
        "blocks": [
          {
            "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": "*CI Pipeline Failed*\nBranch: ${{ github.ref }}\nCommit: ${{ github.sha }}"
            }
          }
        ]
      }
```

## Uptime Monitoring

### Recomendación: UptimeRobot o Better Uptime

**Endpoints a monitorear**:

- `https://brisa-cubana-clean-intelligence.vercel.app` (Web)
- `https://brisa-cubana-clean-intelligence-api.vercel.app/health` (API)

**Frecuencia**: Cada 5 minutos

**Alertas**:

- 3 fallos consecutivos → Slack + Email
- Tiempo de respuesta > 5s → Slack warning

## Dashboard de Métricas

### Configurar en Sentry

Crear Dashboard "Production Health":

**Widgets**:

1. **Error Rate** (últimas 24h)
2. **Response Time p95** (últimas 24h)
3. **Top 10 Errores** por frecuencia
4. **Apdex Score** (Application Performance Index)
5. **Failed Transactions** por endpoint
6. **Database Query Performance**

**Compartir con**: Todo el equipo de operaciones

## Runbook de Respuesta

### Alerta Crítica Recibida

1. **Acusar recibo** en Slack (👀 emoji)
2. **Verificar scope**:
   ```bash
   # Check Sentry dashboard
   # Verify affected users count
   # Check error frequency trend
   ```
3. **Assess impact**:
   - ¿Cuántos usuarios afectados?
   - ¿Funcionalidad crítica bloqueada?
   - ¿Pérdida de datos?
4. **Mitigar**:
   - Rollback si es necesario
   - Hotfix si es posible en <30 min
   - Comunicar al equipo
5. **Resolver**:
   - Deploy fix
   - Verificar en producción
   - Marcar como resuelto en Sentry
6. **Post-mortem** (para incidentes críticos):
   - ¿Qué pasó?
   - ¿Por qué no lo detectamos antes?
   - ¿Cómo prevenirlo?

## Testing de Alertas

### Comando para Generar Errores de Prueba

```bash
# API Error Test
curl -X POST https://brisa-cubana-clean-intelligence-api.vercel.app/api/test-sentry \
  -H "Authorization: Bearer test-token"

# Web Error Test (en browser console)
throw new Error("Sentry Test Error");
```

**Verificar**:

1. Error aparece en Sentry dashboard
2. Alerta recibida en Slack
3. Email enviado a destinatarios

## Métricas de SLO (Service Level Objectives)

### Objetivos de Servicio

| Métrica                     | Objetivo | Threshold         |
| --------------------------- | -------- | ----------------- |
| **Uptime**                  | 99.9%    | Alert si < 99.5%  |
| **Error Rate**              | < 1%     | Alert si > 5%     |
| **API Response Time (p95)** | < 500ms  | Alert si > 2000ms |
| **Database Query (p95)**    | < 200ms  | Alert si > 1000ms |

### Reporte Mensual

Automatizar reporte de:

- Uptime total
- Total de incidentes
- MTTR (Mean Time To Recovery)
- Errores más frecuentes
- Mejoras de performance implementadas

## Referencias

- [Sentry Alerts Guide](https://docs.sentry.io/product/alerts/)
- [Slack Incoming Webhooks](https://api.slack.com/messaging/webhooks)
- [PagerDuty Sentry Integration](https://www.pagerduty.com/docs/guides/sentry-integration-guide/)
- [Vercel Monitoring](https://vercel.com/docs/concepts/analytics)
