# RFC: Componentes Públicos (Landing, Checkout, Portal Cliente)

**Estado:** Propuesto  
**Responsables:** Producto · Diseño · Frontend  
**Última actualización:** 17 de octubre de 2025

## 1. Contexto

La Fase 2 del roadmap (landing comercial, checkout público, portal cliente) requiere un set consistente de componentes públicos que reutilicen tokens existentes y mantengan el look & feel corporativo sin afectar el panel operativo.

## 2. Objetivo

Establecer la arquitectura de UI/UX para las experiencias públicas, definiendo patrones de diseño, accesibilidad y telemetría antes de iniciar el desarrollo.

## 3. Layouts propuestos

### 3.1 Secciones por página

| Página   | Secciones clave                                                                                           | Notas                                                                                                |
| -------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Landing  | Hero + CTA, testimonios, servicios destacados, bloque de métricas, FAQ, CTA final                         | CTA principal debe anclar a checkout; hero soporta video opcional y fallback estático.               |
| Checkout | Barra de progreso, selector de servicio, selector de fecha/hora, formulario de datos de contacto, resumen | Integración Stripe test con `PaymentElement`; feedback inline y resumen actualizable en tiempo real. |
| Portal   | Dashboard con reservas activas, historial, módulo de facturación, perfil, soporte                         | Acciones rápidas para reprogramar/cancelar; indicadores de estado y timeline de reserva.             |

### 3.2 Layout base y tokens

- Usar el grid de 12 columnas existente (`styles/grid.css`) con contenedores `max-w-7xl`.
- Breakpoints: `sm` 640px, `md` 768px, `lg` 1024px, `xl` 1280px (alineados con Tailwind config vigente).
- Espaciados por defecto `space-y-12` en desktop, `space-y-8` en mobile.
- Hero debe incluir `background-image` opcional configurable vía CMS futuro; degradados definidos en `tokens/colors.ts`.

### 3.3 Comportamiento responsive

- Landing: hero divide layout 2 columnas en `lg`, stack en `md` hacia abajo.
- Checkout: barra de progreso colapsa a tabs en `sm`; resumen se ancla a bottom sheet en mobile.
- Portal: sidebar persistente en `lg`; navegación tipo sheet en `md`; tarjetas apiladas en `sm`.

### 3.4 Referencias de diseño y accesibilidad

- Wireframes de alta fidelidad en Figma:
  - `Landing – Fase 2` (📁 Figma → Brisa · Público) con variantes desktop/mobile, anotaciones WCAG 2.2 y tokens `brisa`.
  - `Checkout – PaymentElement` resaltando estados `idle/loading/success/error`, mensajes inline y confirmación accesible.
  - `Portal Cliente – Dashboard` con vistas responsive y jerarquía de tarjetas, timeline y CTA de soporte.
- Benchmark UI: colección “Hospitality & Home Services” (Baymard Premium) referenciada como comparativo para jerarquía y copy.
- Checklist heurístico (Nielsen) y WCAG AA documentados en la misma página de Figma; enlaza a resultados de revisión manual en `docs/qa/regression-checklist.md` §8.
- Para stakeholders, añadir capturas estáticas (PNG) en `docs/assets/public-components/` y vincularlas aquí cuando estén disponibles; ver guía operativa `docs/guides/portal-client.md` como referencia temporal de evidencias funcionales del portal.
  - Exportaciones actuales:
    - Landing (desktop): [`landing-desktop.png`](../assets/public-components/landing-desktop.png) – reemplazar con captura 1440px.
    - Checkout (flujo Payment Element): [`checkout-flow.png`](../assets/public-components/checkout-flow.png).
    - Portal (dashboard customer): [`portal-dashboard.png`](../assets/public-components/portal-dashboard.png).

## 4. Componentes compartidos

- **Landing:** `HeroBanner`, `FeatureList`, `PricingTier`, `TestimonialsCarousel`, `FAQAccordion`, `MetricsStrip`.
- **Checkout:** `CheckoutStepper`, `ServiceOptionCard`, `SchedulePicker`, `ContactForm`, `PaymentSummaryCard`, `LegalNotice`.
- **Portal:** `PortalStatCard`, `PortalReservationCard`, `PortalBookingCard`, `PortalTimelineItem`, `PortalCallout`, `InvoiceList`, `SupportCTA`, `ProfileForm`.
  - `PortalBookingCard` añade acciones primarias (reagendar/cancelar) con estados deshabilitados y feedback inline.
  - Skeletons dedicados para próximas reservas e historial durante refrescos de SWR.

Cada componente debe:

- Ser agnóstico de datos (props tipados + skeleton).
- Incluir pruebas `@testing-library/react`.
- Emitir eventos de telemetría (Analytics + Sentry breadcrumbs).

## 5. Contrato de formulario de checkout

| Campo              | Tipo / Validación                                    | Telemetría                                                                 |
| ------------------ | ---------------------------------------------------- | -------------------------------------------------------------------------- |
| `serviceId`        | UUID, requerido.                                     | Evento `checkout.service_selected` (`serviceId`, `duration`, `basePrice`). |
| `scheduledFor`     | Fecha ISO, mínimo +24h desde hora actual, requerido. | Evento `checkout.date_selected` (`date`, `timezoneOffset`).                |
| `contact.fullName` | String 2-80 chars, requerido.                        | Evento `checkout.contact_entered`.                                         |
| `contact.email`    | Email RFC 5322, requerido.                           | Evento `checkout.contact_entered` (`valid=true/false`).                    |
| `contact.phone`    | E.164 opcional, validar prefijos US/CA.              | Evento `checkout.phone_entered`.                                           |
| `notes`            | String opcional max 500 chars, sanitizar HTML/emoji. | Evento `checkout.notes_updated`.                                           |
| `paymentMethod`    | Stripe Payment Element, requerido para `Confirm`.    | Evento `checkout.payment_submitted` (`stripeIntentStatus`).                |

- Errores deben mapearse a claves i18n (`checkout.error.required`, etc.).
- Formularios exponen `aria-live="polite"` para mostrar mensajes.
- Loading states utilizan `Skeleton` compartido (`ui/skeleton.tsx`).

## 5. Accesibilidad

- Cumplir WCAG 2.2 AA (contraste, navegación teclado, aria-labels).
- Formularios con validaciones lado cliente + mensajes en `aria-live`.
- Contenido dinámico (carousels, toasts) con controles accesibles.

## 6. Telemetría y observabilidad

- Usar `analytics.track` con namespace `public.*` y fuente `web`.
- Sentry: capturar breadcrumbs en interacciones críticas (`hero.cta.click`, `checkout.step.error`).
- Web Vitals: enviar métricas a pipeline existente (`lib/web-vitals.ts`) agregando etiquetas `pageType`.
- Lighthouse objetivo: Performance ≥ 90 landing/checkout en mobile, Accessibility ≥ 95.

## 7. Próximos pasos

1. Exportar wireframes Figma (landing, checkout, portal) a `docs/assets/public-components/` y enlazarlos en la sección 3.4.
2. Validar con Operaciones + Diseño para aprobación final.
3. Crear historias en backlog (landing, checkout, portal) referenciando este RFC.
4. Revisar este RFC trimestralmente o cuando cambien tokens globales.
5. Documentar métricas de uso del portal en `docs/operations/observability.md` (sección dashboards de negocio).

## 8. Portal cliente

### 8.1 Estado actual (Beta)

- Portal accesible en `/clientes` con formulario de acceso por enlace mágico y dashboard funcional.
- Acciones implementadas: reagendar, cancelar, ver detalle y cerrar sesión (ver `docs/guides/portal-client.md` para operación).
- Seeds demo exponen reservas de prueba (`prisma/seed.demo.ts`) para `client@brisacubanaclean.com`.
- Tests Playwright críticos automatizan el flujo end-to-end (`tests/e2e/portal-client.spec.ts`).

### 8.2 Requerimientos MVP

- Autenticación vía enlace mágico con token `portal-client` (cookies HttpOnly + `portal_customer_id`). ✅
- Dashboard consume `/api/portal/bookings` con SWR y muestra expiración de sesión (`session.expiresAt`). ✅
- Acciones rápidas “Reagendar” y “Cancelar” usan endpoints dedicados, registran telemetría (`portal.booking.rescheduled`, `portal.booking.cancelled`) y generan notificaciones para roles `ADMIN`/`COORDINATOR`. ✅
- Pantalla de detalle `/clientes/[customerId]/reservas/[bookingId]` con timeline y CTA de soporte. ✅
- Exportación PDF (`/api/bookings/:id/receipt`). 🔄 Definir alcance y UX antes del GA.
- Notificaciones en tiempo real vía SSE (`/api/notifications/stream`). 🔄 Suscripción portal pendiente.
- Formulario “Solicitar cambio” extendido (motivos adicionales, adjuntos). 🔄 Posterior al GA.

### 8.3 Métricas y observabilidad

- Evento Sentry `portal.viewed` con atributos `section`, `customerId` (hash), `bookingCount`.
- Web Vitals etiquetados con `pageType: "portal"`.
- Heatmap para portal (herramienta a definir) antes del GA.
- Logs API `Magic link solicitado para cliente` sirven como auditoría de solicitudes; en beta se expone `debugToken` para QA manual.

### 8.4 Checklist para go-live

- [x] Cubrir rutas `/clientes` y `/clientes/reservas/:id` con pruebas Playwright (@critical).
- [x] Documentar flujo de recuperación de acceso (link mágico) y proceso manual de fallback (`docs/guides/portal-client.md`).
- [ ] Revisar accesibilidad (WCAG AA) usando axe DevTools + QA manual.

## 9. Documentos relacionados

- `docs/guides/portal-client.md` – Guía operativa del portal (autenticación, QA y troubleshooting).
- `docs/product/phase-2-roadmap.md` – Roadmap general Fase 2 (hitos, evidencias, próximos pasos).
- `docs/qa/regression-checklist.md` – Casos manuales para validar experiencias públicas.

---

Este documento evolucionará conforme avance la Fase 2. Añadir comentarios o propuestas mediante PRs etiquetados `area:product`.
