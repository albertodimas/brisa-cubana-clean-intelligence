# Dashboard de Analítica Comercial

**Última actualización:** 20 de octubre de 2025

Este documento describe la estructura y métricas propuestas para el dashboard en PostHog.

---

## Objetivos

1. Medir el funnel completo: visita → lead → checkout → pago.
2. Detectar abandonos y errores críticos (checkout fallido, intentos Stripe, etc.).
3. Proveer métricas accionables al equipo de producto/comercial.

---

## Estructura recomendada

### 1. Panel “Funnel Comercial”

- **Funnels:**
  - `Landing visit → CTA lead → Checkout iniciado → Pago completado`.
  - `Portal login → Acción de reserva → Reserva confirmada`.
- **Indicadores clave (KPIs):**
  - Conversión global (%).
  - Drop-off por paso.
  - Tiempo promedio entre pasos.

### 2. Panel “Checkout Health”

- **Gráficas:**
  - Serie temporal de `checkout_started`, `checkout_payment_failed`, `checkout_completed`.
  - Tabla de tasas de error por método de pago.
- **Alertas recomendadas:** integrarlas con Slack cuando el webhook esté listo (ver `docs/operations/observability-setup.md`).

### 3. Panel “Portal Cliente”

- **Métricas:**
  - Entradas al portal (`portal.link.verify`).
  - Acciones de reservas (`portal.booking.action.*`).
  - Estados de fallback SSE (`notifications.stream.fallback`).

### 4. Panel “Top of Funnel”

- **Eventos de marketing:**
  - `cta_request_proposal`, `cta_portal_demo`, `lead_submitted`.
  - Segmentación por origen (UTM) y dispositivo.

---

## Implementación

1. Crear el dashboard en PostHog → “Dashboards” → “New dashboard”.
2. Nombrarlo `Brisa Cubana · Funnel Comercial` y compartir con todo el equipo.
3. Añadir charts según las secciones anteriores.
4. Enlazar el dashboard en `docs/product/analytics-decision.md` (pendiente).
5. Configurar alertas en PostHog (webhook Slack) para `checkout_payment_failed` y eventos de anomalías.

---

---

## Dashboard en PostHog

**URL del Dashboard:** https://us.i.posthog.com/project/225064/dashboard/607007
**Nombre:** Brisa Cubana - Funnel Comercial
**ID:** 607007
**Creado:** 21 de octubre de 2025

El dashboard está creado y listo para configuración. Para añadir charts y visualizaciones:

1. Accede al dashboard usando la URL de arriba
2. Click "Add insight" o "Add text card" según necesites
3. Configura los insights según las secciones definidas en este documento
4. Guarda cada insight al dashboard

---

---

## Insights Creados via API

Todos los insights han sido creados programáticamente y están listos para añadir al dashboard:

| #   | Nombre                               | ID      | Tipo           | URL                                                              |
| --- | ------------------------------------ | ------- | -------------- | ---------------------------------------------------------------- |
| 1   | Funnel Comercial - Landing a Pago    | 3767234 | Funnel         | [Ver](https://us.i.posthog.com/project/225064/insights/zu0eTQCm) |
| 2   | Funnel Portal - Login a Confirmación | 3767282 | Funnel         | [Ver](https://us.i.posthog.com/project/225064/insights/3767282)  |
| 3   | Checkout Health - Serie Temporal     | 3767283 | Trends         | [Ver](https://us.i.posthog.com/project/225064/insights/3767283)  |
| 4   | Checkout - Errores por Tipo          | 3767284 | Trends (Table) | [Ver](https://us.i.posthog.com/project/225064/insights/3767284)  |
| 5   | Portal Cliente - Engagement          | 3767285 | Trends         | [Ver](https://us.i.posthog.com/project/225064/insights/3767285)  |
| 6   | Marketing - CTAs y Leads             | 3767286 | Trends         | [Ver](https://us.i.posthog.com/project/225064/insights/3767286)  |
| 7   | Marketing - Fuentes UTM              | 3767287 | Trends (Pie)   | [Ver](https://us.i.posthog.com/project/225064/insights/3767287)  |

### Añadir al Dashboard

**URL del Dashboard:** https://us.i.posthog.com/project/225064/dashboard/607007

Para añadir cada insight al dashboard:

1. Visita el dashboard usando la URL de arriba
2. Click "Add insight"
3. Busca por nombre (ej. "Funnel Comercial")
4. Click en el insight → "Add to dashboard"
5. Repite para todos los insights

**Nota:** La API pública de PostHog no soporta añadir tiles a dashboards programáticamente. Los insights se crearon via API y deben añadirse manualmente (toma ~2 minutos).

---

## Próximos pasos

- [ ] Añadir los 7 insights al dashboard manualmente (instrucciones arriba)
- [ ] Configurar alertas en PostHog para `checkout_payment_failed` → Slack (`#todo-brisa-cubana`).
  1. PostHog → Automations → New automation.
  2. Trigger: Event `checkout_payment_failed` con filtro `environment = production`.
  3. Action: Slack Webhook → URL `SLACK_WEBHOOK_URL` (copiar desde Vercel). Mensaje sugerido: `:rotating_light: Checkout fallido {{properties.error_code}} – lead {{distinct_id}}`.
  4. Guardar y probar enviando `POSTHOG_API_KEY=… pnpm posthog:test-event checkout_payment_failed`.
  5. Confirmar en `#todo-brisa-cubana` la recepción del mensaje y registrar la fecha en `docs/operations/slack-integration.md`.
  6. Opcional: ejecutar `POSTHOG_API_KEY=… SLACK_WEBHOOK_URL=… pnpm posthog:monitor` para validar desde CLI (usa HogQL para contar fallos en los últimos 5 minutos y enviar alerta).
- [ ] Configurar automatización de reportes semanales (Insights → Share → Schedule) hacia el mismo webhook una vez haya datos reales.
- [ ] Validar que los eventos estén emitiendo datos en producción
