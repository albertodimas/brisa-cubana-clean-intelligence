# RFC: Componentes Públicos (Landing, Checkout, Portal Cliente)

**Estado:** Borrador inicial  
**Responsables:** Producto · Diseño · Frontend  
**Última actualización:** 15 de octubre de 2025

## 1. Contexto

La Fase 2 del roadmap (landing comercial, checkout público, portal cliente) requiere un set consistente de componentes públicos que reutilicen tokens existentes y mantengan el look & feel corporativo sin afectar el panel operativo.

## 2. Objetivo

Establecer la arquitectura de UI/UX para las experiencias públicas, definiendo patrones de diseño, accesibilidad y telemetría antes de iniciar el desarrollo.

## 3. Layouts propuestos

| Página   | Secciones clave                                        | Notas                                                              |
| -------- | ------------------------------------------------------ | ------------------------------------------------------------------ |
| Landing  | Hero, prueba social, servicios destacados, CTA final   | CTA principal debe anclar a checkout; hero soporta video opcional. |
| Checkout | Resumen de servicio, pasos (servicio → fecha → pago)   | Integración Stripe test; feedback inline de errores.               |
| Portal   | Panel de reservas, historial y actualización de perfil | Visión responsive; botones rápidos para reprogramar/cancelar.      |

## 4. Componentes compartidos

- `FeatureList`, `PricingTier`, `TestimonialsCarousel`
- `CheckoutStepper`, `PaymentSummaryCard`
- `PortalReservationCard`, `PortalEmptyState`

Cada componente debe:

- Ser agnóstico de datos (props tipados + skeleton).
- Incluir pruebas `@testing-library/react`.
- Emitir eventos de telemetría (Analytics + Sentry breadcrumbs).

## 5. Accesibilidad

- Cumplir WCAG 2.2 AA (contraste, navegación teclado, aria-labels).
- Formularios con validaciones lado cliente + mensajes en `aria-live`.
- Contenido dinámico (carousels, toasts) con controles accesibles.

## 6. Próximos pasos

1. Diseñar wireframes de alta fidelidad (Figma) y anexar enlace.
2. Validar con Operaciones + Diseño para aprobación final.
3. Crear historias en backlog (landing, checkout, portal) referenciando este RFC.

---

Este documento evolucionará conforme avance la Fase 2. Añadir comentarios o propuestas mediante PRs etiquetados `area:product`.
