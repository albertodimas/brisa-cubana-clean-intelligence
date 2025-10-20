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

## Pendientes

- Obtener URL pública/privada del dashboard y documentarla. (Pendiente: dashboard aún no publicado en PostHog).
- Configurar automatización de reportes (ej. weekly digest en Slack).
- Validar series/propiedades con el DWH cuando esté disponible.
