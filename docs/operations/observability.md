# Observabilidad y Monitoreo

**Última actualización:** 23 de octubre de 2025  
**Estado actual:** ✅ Logging estructurado en API y web · ✅ Alertas Sentry/PostHog entregadas a `#alerts-operaciones` · ✅ Health checks expuestos (`/healthz`) · ✅ Tableros PostHog y Lighthouse en operación

---

## 1. Resumen ejecutivo

- **Objetivo:** detectar y responder a incidentes en <15 min (SEV1) y monitorizar la salud comercial (checkout, portal cliente, leads).
- **Alcance:** API (Hono), frontend (Next.js), pipelines CI/CD, eventos de negocio (checkout, portal) y señales externas (Neon, Stripe, Slack).
- **Runbook diario:** ver `docs/operations/runbook-daily-monitoring.md`.
- **Setup técnico completo:** `docs/operations/observability-setup.md`.
- **Integración Slack:** `docs/operations/slack-integration.md`.

---

## 2. Componentes y responsables

| Componente                  | Cobertura                                                                               | Responsable principal    | Documentación fuente                                                           |
| --------------------------- | --------------------------------------------------------------------------------------- | ------------------------ | ------------------------------------------------------------------------------ |
| Logging estructurado (Pino) | API (`apps/api`) + proxy Next.js                                                        | Plataforma               | `apps/api/src/lib/logger.ts`, `apps/api/src/middleware/logging.ts`             |
| Instrumentación frontend    | Next.js (Sentry, Web Vitals, PostHog, `@vercel/analytics`)                              | Producto                 | `apps/web/instrumentation.ts`, `apps/web/lib/web-vitals.ts`                    |
| Sentry                      | Issues + performance web/API                                                            | Plataforma               | `docs/operations/observability-setup.md#sentry---monitoreo-de-errores`         |
| PostHog                     | Funnel comercial + portal cliente                                                       | Producto                 | `docs/product/analytics-dashboard.md`, `docs/product/analytics-events.md`      |
| Slack alerting              | `#alerts-operaciones`, `#alerts-criticos`, `#alerts-performance`, `#alerts-deployments` | Plataforma / Operaciones | `docs/operations/slack-integration.md`, `docs/operations/alerts.md`            |
| Vercel logs/analytics       | Despliegues web/API, Web Vitals                                                         | Operaciones              | `docs/operations/deployment.md`, `docs/operations/runbook-daily-monitoring.md` |
| GitHub Health Monitor       | Workflow `health-monitor.yml` (cada 15 min). SMS/Slack cuando `/healthz` falla.         | Operaciones              | `docs/operations/deployment.md#4-despliegue`                                   |
| Neon monitoreo              | Performance base de datos                                                               | Plataforma               | `docs/operations/observability-setup.md#3-prisma-query-logs`                   |
| Dashboards de negocio       | PostHog Funnel + Lighthouse                                                             | Producto                 | `docs/product/analytics-dashboard.md`, `docs/performance/bundle-analysis.md`   |

---

## 3. Instrumentación y logging

### 3.1 API (Pino)

- **Formato:** JSON en producción con redactado automático (`password`, `token`, `authorization`).
- **Logs HTTP automáticos:** middleware `loggingMiddleware` registra método, ruta, status, duración, `userId`.
- **Serializadores dedicados:** `authLogger`, `dbLogger` para separar contexto y filtrar ruido.
- **Ubicación:** `apps/api/src/lib/logger.ts`, `apps/api/src/middleware/logging.ts`.
- **Referencia:** ver ejemplo de payload y campos en `observability-setup.md#11-logging-estructurado`.

### 3.2 Flujos críticos instrumentados

| Flujo                               | Señales capturadas                                                                                                                                                                                    | Alertas recomendadas                                                           |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Checkout público (`/checkout`)      | Eventos Sentry (`checkout.payment.failed`, `checkout.payment.confirmed`, `stripe.intent.created/failed/skipped`), PostHog (`checkout_payment_failed`), logs Pino (`intentStatus`, `paymentIntentId`). | Issue alert ≥3 fallos/15 min → `#alerts-operaciones`.                          |
| Portal cliente (SSE / autoservicio) | Breadcrumbs Sentry (`portal.dashboard.refresh`, `notifications.stream.fallback`), logs API (`Portal booking cancellation processed`).                                                                 | Issue alert fallback SSE ≥3 eventos/5 min → `#alerts-operaciones`.             |
| Lead intake (`/api/leads`)          | Slack webhook (`#leads-operaciones`), PostHog (`lead_submitted`), log inbound UTM.                                                                                                                    | Revisar tiempo de respuesta semanal en `docs/operations/lead-followup-sop.md`. |

> Para ampliar o modificar instrumentación, registrar las decisiones en `docs/product/analytics-events.md` y actualizar las pruebas en `tests/e2e/analytics.spec.ts`.

### 3.3 Telemetría Stripe PaymentIntent

- **Sentry**
  - `stripe.intent.created` (nivel `info`): extras `stripe.intent.serviceId`, `stripe.intent.amountInCents`, `stripe.intent.currency`, `stripe.intent.customerEmail`.
  - `stripe.intent.failed` (nivel `warning`): extras `stripe.intent.reason` (`service-not-available`, `stripe-error`, `missing-client-secret`), `stripe.intent.paymentIntentId` cuando existe.
  - `stripe.intent.skipped` (nivel `info`): emitido cuando falta configuración (`reason: stripe-not-configured`).
- **Logging estructurado**
  - Todos los intents escriben `intentStatus` (`created`, `failed`, `rejected`, `skipped`), `serviceId`, `customerEmail`, `hasNotes`.
  - Consulta ejemplo (Logtail):
    ```sql
    where intentStatus="failed"
    | select time, serviceId, customerEmail, reason, amountInCents
    ```
- **Alertas recomendadas**
  - Configurar regla Sentry: `stripe.intent.failed` ≥3 eventos en 15 min → Slack `#alerts-operaciones`.
  - Monitorear `intentStatus="skipped"` para detectar ambientes sin `STRIPE_SECRET_KEY`.

### 3.4 Métricas de negocio (eventos PostHog)

- `checkout_started`, `checkout_payment_failed`, `checkout_payment_confirmed`
- `portal.booking.action.*` (cancel/reschedule), `portal.session.expired`
- `cta_request_proposal`, `cta_portal_demo`, `lead_submitted`

Definiciones y owners: `docs/product/analytics-events.md`.  
Dashboard vivo: `docs/product/analytics-dashboard.md` (ID 607007 en PostHog).

---

## 4. Alertas y monitoreo

### 4.1 Sentry

- Integración Slack → `#alerts-criticos`, `#alerts-operaciones`, `#alerts-performance`.
- Reglas mínimas:
  - Error rate >10 % (5 min) → `#alerts-criticos` + `oncall@`.
  - New issue / regressed issue → `#alerts-operaciones`.
  - Latencia p95 >2 s (`transaction.op = http.server`) → `#alerts-performance`.
- Procedimiento detallado y variables: `docs/operations/observability-setup.md#sentry---monitoreo-de-errores`.
- Tabla de implementación y evidencias: `observability-setup.md#registro-de-implementación`.
- Content Security Policy (CSP): permitir `connect-src` a `https://*.sentry.io`, `https://*.ingest.sentry.io` y `https://*.ingest.us.sentry.io`. La cabecera se define en `apps/web/vercel.json`; tras cambios revisar el modo “Report Only” y, cuando no haya falsos positivos, migrar a modo enforcement.

### 4.2 PostHog

- Eventos de prueba: `POSTHOG_API_KEY=... pnpm posthog:test-event checkout_payment_failed`.
- Automatizaciones → Slack `#alerts-operaciones` (checkout fallido) y `#alerts-performance` (anomalías SSE).
- Workflow `posthog-monitor.yml` ejecuta `pnpm posthog:monitor` cada 10 minutos (GitHub Actions) y publica anomalías en `#alerts-operaciones`.
- Métricas de conversión y acciones portal: dashboard `Brisa Cubana · Funnel Comercial`.
- Configuración y tareas pendientes: `docs/product/analytics-dashboard.md` y `docs/product/analytics-decision.md`.

### 4.3 Slack

- Webhook central documentado en `slack-integration.md`.
- Mensajes de verificación se registran en la tabla del propio documento (última comprobación 23-oct-2025).
- Triage: reaccionar con `:eyes:` en `#alerts-operaciones` y asignar responsable en `#incident-<fecha>` según `incident-runbook.md`.

### 4.4 Vercel, Lighthouse y otros

- Logs rápidos: `vercel logs --prod --scope brisa-cubana --since=2h`.
- Lighthouse Nightly (`monthly-bundle.yml`) y reportes de bundle (`docs/performance/bundle-analysis.md`).
- Health check: `https://api.brisacubanacleanintelligence.com/healthz` (token opcional `HEALTH_CHECK_TOKEN`).
- Runbook diario/semanal: `docs/operations/runbook-daily-monitoring.md`.

---

## 5. Procedimientos operativos

| Frecuencia | Paso                                                                                 | Evidencia                                                |
| ---------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------- |
| Diario     | Revisar alertas Sentry/PostHog (`#alerts-operaciones`, `#alerts-criticos`).          | Checklist en `runbook-daily-monitoring.md` §2.           |
| Diario     | Validar collector del log drain Vercel (`/api/logdrain`).                            | `docs/operations/deployment.md#22-log-drains-en-vercel`. |
| Semanal    | Descargar artefactos de `Nightly Full E2E` y Lighthouse.                             | `runbook-daily-monitoring.md` §3.                        |
| Semanal    | Revisar dashboard comercial PostHog y compartir resumen en `#alerts-operaciones`.    | `analytics-dashboard.md`.                                |
| Mensual    | Ejecutar `pnpm analyze:web` y actualizar `docs/performance/bundle-analysis.md`.      | Workflow `monthly-bundle.yml`.                           |
| Trimestral | Rotar `SLACK_WEBHOOK_URL`, validar `SENTRY_AUTH_TOKEN`, revisar retención PITR Neon. | `slack-integration.md` §5, `backup-recovery.md`.         |

---

## 6. Checklist rápido post-release

Ejecutar inmediatamente después de un deploy a producción o de cerrar un incidente SEV1/SEV2:

1. **Verificar ingestión analítica**

   ```bash
   pnpm posthog:test-event    # Envía evento sintético
   pnpm posthog:monitor       # Fuerza ejecución del monitor
   ```

   Confirma en el dashboard PostHog `607007` que el evento `checkout_payment_failed` aparece con timestamp actual.

2. **Validar alertas Sentry**

   ```bash
   pnpm sentry:test-event
   ```

   Debe generarse un issue con tag `source=cli-test`; revisa que la notificación llegue a `#alerts-operaciones`.

3. **Smoke E2E**

   ```bash
   pnpm test:e2e:smoke
   pnpm test:e2e:critical
   ```

   Revisa los logs Pino para confirmar que se crean `PaymentIntent` y que el portal cliente responde sin fallback SSE.

4. **Health checks externos**
   - Ejecuta `curl -I https://brisacubanacleanintelligence.com/healthz`.
   - Si el monitor `health-monitor.yml` falló en los últimos 15 min, documenta en `incident-runbook.md`.

> Documenta los resultados en el PR o en `docs/overview/status.md` (sección “Observabilidad”) antes de marcar el despliegue como completo.

---

## 6. KPIs y umbrales de alerta

| Métrica / señal                                  | Umbral                         | Destino Slack                 | Acción sugerida                                                                    |
| ------------------------------------------------ | ------------------------------ | ----------------------------- | ---------------------------------------------------------------------------------- |
| `checkout.payment.failed` (PostHog/Sentry)       | ≥3 eventos en 15 min           | `#alerts-operaciones`         | Revisar estado Stripe, reintentar pago, notificar Marketing.                       |
| `stripe.intent.failed` (Sentry)                  | ≥3 eventos en 15 min           | `#alerts-operaciones`         | Verificar catálogo de servicios, credenciales Stripe, revisar logs `intentStatus`. |
| SSE fallback (`notifications.stream.fallback`)   | ≥3 eventos en 5 min            | `#alerts-operaciones`         | Verificar conectividad Vercel / proxies, reiniciar stream.                         |
| Error rate global Sentry                         | >10 % en 5 min                 | `#alerts-criticos`            | Escalar a on-call, evaluar rollback.                                               |
| Latencia p95 `/api/portal/bookings`              | >500 ms sostenido 10 min       | `#alerts-performance`         | Revisar consultas Prisma, indices Neon.                                            |
| Tiempo de respuesta leads (`#leads-operaciones`) | >120 min (promedio semanal)    | `#leads-operaciones`          | Coordinar follow-up con Marketing/Comercial.                                       |
| Fuga `Magic link email failed` (logs API)        | ≥1 evento                      | `#alerts-operaciones`         | Validar credenciales SMTP / SendGrid.                                              |
| Health check `/healthz`                          | Código ≠200 o `status != pass` | Monitor externo (BetterStack) | Reintentar despliegue o investigar dependencia caída.                              |

Actualiza esta tabla cuando se modifiquen los umbrales en Sentry/PostHog o se introduzcan nuevos flujos críticos.

---

## 7. Revisión coordinada de alertas

- **Cadencia:** lunes 10:00 ET (30 minutos) vía Google Meet `Brisa · Observability Standup`.
- **Participantes mínimos:** Plataforma (`@oncall-platform`), Producto (`@cs-lead`), Marketing (`@marketing-lead`).
- **Agenda fija:**
  1. Repaso de incidencias Sentry de severidad alta registradas desde la última sesión.
  2. Revisión de métricas PostHog destacadas y anomalías reportadas por `posthog-monitor.yml`.
  3. Confirmación de que el webhook `SLACK_WEBHOOK_URL` recibió el resumen semanal (lunes 09:00 ET) ejecutado por el job GitHub Actions `posthog-monitor.yml` (`schedule: 0 13 * * 1`).
  4. Identificación de acciones correctivas y asignación de responsables en Linear.
- **Seguimiento:** publicar en `#alerts-operaciones` un resumen con: incidencias cerradas, alertas nuevas, compromisos para la semana y enlace al registro en Linear.

## 8. Documentos relacionados

- `docs/operations/observability-setup.md` – Procedimiento técnico detallado (Sentry, PostHog, Neon, Slack).
- `docs/operations/slack-integration.md` – Webhooks, taxonomía de canales y verificación.
- `docs/operations/alerts.md` – Regla por severidad con pasos de configuración.
- `docs/operations/runbook-daily-monitoring.md` – Checklist diario/semanal.
- `docs/product/analytics-dashboard.md` – Dashboards PostHog.
- `docs/product/analytics-events.md` – Diccionario de eventos y ownership.
- `docs/performance/bundle-analysis.md` – Historial de análisis de bundles.
- `docs/operations/incident-runbook.md` – Flujo completo de manejo de incidentes.

---

**Propietario:** Equipo Plataforma  
**Contacto operativo:** `@oncall-platform` en Slack  
**Próxima revisión sugerida:** 31 de octubre de 2025
