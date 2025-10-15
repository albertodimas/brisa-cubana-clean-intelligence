# Roadmap Fase 2 – Experiencia Comercial y Clientes

**Última actualización:** 15 de octubre de 2025  
**Responsables:** Producto · Plataforma · Operaciones

## 1. Objetivo general

Completar los flujos comerciales de cara al usuario final para habilitar ventas self-service y autoservicio del cliente, manteniendo la coherencia con las capacidades ya implementadas en el panel operativo (Fase 1).

## 2. Alcance funcional

| Entregable        | Descripción                                                                       | Dependencias                                             | Evidencias requeridas                                        |
| ----------------- | --------------------------------------------------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------ |
| Landing comercial | Página pública con propuesta de valor, listado de servicios y CTA a checkout.     | Nuevos componentes UI, métricas Web Vitals.              | Playwright smoke pública, Lighthouse ≥ 90 Performance.       |
| Checkout público  | Selección de servicio, fecha y datos de contacto; integración Stripe (modo test). | API booking pública con validaciones, integración pagos. | Tests e2e `checkout.spec.ts`, webhook tests en API.          |
| Portal cliente    | Autogestión: ver reservas, actualizar datos, solicitar cambios.                   | Autenticación cliente, endpoints `/api/clients/*`.       | Playwright crítico `portal-client.spec.ts`, casos QA manual. |

## 3. Hitos

1. **Infraestructura** (semana 1-2): definir rutas Next (`/`, `/checkout`, `/clientes`), semillas adicionales y esquemas de carga.
2. **Integraciones** (semana 3-4): Stripe test + webhooks, notificaciones email.
3. **QA & Observabilidad** (semana 5): nuevas suites Playwright, dashboards Sentry/LHCI.

## 4. Lista de evidencias para cierre de Fase 2

- Documentación actualizada: este roadmap, `docs/overview/status.md` y guías de operaciones.
- Todas las suites (`pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:e2e:critical`) en verde en CI.
- Capturas de QA manual ligadas en `docs/qa/regression-checklist.md`.

## 5. Próximos pasos inmediatos

1. Definir estructura de componentes públicos en un RFC corto (link pendiente).
2. Configurar Stripe (modo test) en entornos Preview/Prod.
3. Planificar migración de seeds para separar datos operativos vs. demo comercial.
