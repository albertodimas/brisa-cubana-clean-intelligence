# Analítica Comercial – Decisión de Plataforma

**Fecha:** 19 de octubre de 2025  
**Autor:** Equipo Producto / Plataforma  
**Estado:** ✅ Selección realizada – PostHog Cloud (EE. UU.)

---

## 1. Contexto

La Fase 2 requiere visibilidad end-to-end de funnels:

- CTA landing → lead (`cta_request_proposal`, `cta_portal_demo`).
- Lead → checkout (`checkout_started`, `checkout_completed`, `checkout_payment_failed`).
- Uso portal cliente (`portal.link.verify`, `portal.booking.action.*`).

Hasta ahora dependíamos de `@vercel/analytics` + logs/Sentry, insuficiente para cohorts, funnels y dashboards compartidos.

---

## 2. Alternativas evaluadas

| Plataforma                       | Pros                                                                                          | Contras                                                                              | Comentarios                                                                            |
| -------------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------- |
| **PostHog Cloud (US/EU)**        | Funnels, recordings, feature flags, API simple, self-service dashboards, pricing transparente | Coste por evento (pero con plan Startup 1M eventos incluidos), requiere contrato DPA | ✅ Seleccionada. Hosting US aceptable; se puede migrar a EU si compliance lo exige.    |
| **Google Analytics 4**           | Gratis, equipo ya familiar, integración sencilla                                              | Muestreo alto, reporting complejo, requiere banner cookies estricto                  | Rechazada; no cubre recordings ni server analytics y añade overhead de consentimiento. |
| **Segment + destino (Mixpanel)** | Flexibilidad multi-destino, esquema centralizado                                              | Costo + complejidad (dos herramientas), gobernanza de esquema necesaria              | Rechazada por tiempo/costo para esta fase.                                             |

---

## 3. Decisión

Adoptar **PostHog Cloud (Starter plan)**, con objetivo de consolidar eventos de marketing, ventas y autoservicio.  
Se habilitará el dominio US inicialmente; si marketing/legal solicita residencia EU se puede migrar (ticket abierto con soporte PostHog).

---

## 4. Plan de implementación

### 4.1 Tareas inmediatas

1. **Crear proyecto PostHog** (Owner: Producto) – _listo 19-oct-2025_.
2. **Registrar API key y host:**
   - `NEXT_PUBLIC_POSTHOG_KEY` (por ahora se cargó un placeholder `phc_placeholder_replace_me`; sustituir cuando PostHog entregue la clave real).
   - `NEXT_PUBLIC_POSTHOG_HOST` (por defecto `https://us.posthog.com`).
   - Guardar credenciales reales en 1Password → vault “Brisa Cubana – SaaS”.
3. **Añadir variables a Vercel + GitHub Secrets** (Production/Preview/Development).
4. **Instrumentar cliente web**:
   - Cargar `posthog-js` en `apps/web` (lazy load).
   - Adaptar `marketing-telemetry.ts` para enviar eventos a PostHog además de `@vercel/analytics`.
   - Adjuntar `distinct_id` (correo o hash) cuando haya sesión portal cliente.
5. **Actualizar suites QA**:
   - Añadir assertions en Playwright smoke para validar que `window.posthog` está definido cuando se configura la key.
   - Documentar en `docs/qa/regression-checklist.md`.

### 4.2 Dashboard & métricas

1. Funnel “Landing → Checkout → Pago” (propietario: Producto).
2. Event trends: `portal.booking.action.*`, `checkout_payment_failed`.
3. Dashboard compartido (URL se actualizará en `docs/operations/observability.md#4-analítica-comercial-plan-fase-2`).
4. Configurar alerta PostHog (webhook → Slack `#producto`) para spikes de `checkout_payment_failed`.

### 4.3 Política de datos / cumplimiento

- Añadir PostHog a la política de privacidad (Marketing).
- Revisar si se requiere banner de consentimiento (US vs. EU). Por ahora: ocultar recordings en ambientes no productivos.
- Activar IP anonymization en proyecto PostHog.

---

## 5. Próximos pasos

1. [ ] Implementar SDK (`posthog-js`) con inicialización condicional (Plataforma).
2. [ ] Emitir eventos normalizados (Producto/Plataforma).
3. [ ] Publicar dashboard con KPIs (Producto).
4. [ ] Revisar métricas en el runbook semanal (`docs/operations/runbook-daily-monitoring.md`).

Adjuntar evidencias (screenshots, enlaces de dashboards) cuando las tareas estén completas.
