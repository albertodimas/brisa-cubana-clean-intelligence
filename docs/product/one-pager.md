# Brisa OS · One-pager Comercial

**Fecha:** 16 de noviembre de 2025  
**Contacto:** operaciones@brisacubanacleanintelligence.com  
**CTA:** [Formulario de interés](https://brisacubanacleanintelligence.com/#contacto) · [Versión web](https://brisacubanacleanintelligence.com/recursos/one-pager)

---

## 1. Problema

| Actor                                             | Dolor principal                                                                                       | Impacto                                                   |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| Operadores de limpieza premium (5-40 propiedades) | Evidencia dispersa (WhatsApp, Drive), procesos manuales, imposibilidad de cobrar extras con respaldo. | Margen erosionado, clientes ciegos y cero diferenciación. |
| Property managers / dueños                        | No saben qué se hizo, cuándo ni con qué calidad; no existe SLA visible ni portal white-label.         | Pierden confianza y cambian de proveedor con frecuencia.  |

---

## 2. Solución (Brisa OS)

> **Sistema operativo para empresas de limpieza premium:** checklists hoteleros, evidencia automatizada y portal cliente white-label desde USD 99/mes.

- **App crews** (iOS/Android) para checklist + fotos + firmas.
- **Portal cliente white-label** con magic links, timeline y aprobaciones en 1 clic.
- **Panel operativo multi-tenant** con calendario drag & drop, inventario y permisos por rol.
- **IA embebida** (resúmenes automáticos y detección de incidencias) conectada a la tabla `BookingSummary`.
- **Automatizaciones comerciales**: reportes PDF, one-pager público, formulario con UTMs y webhooks (`LEAD_WEBHOOK_URL`).

---

## 3. ¿Por qué ahora?

1. 12K+ servicios reales → plantillas hoteleras listas.
2. Escasez de software accesible en el segmento (competencia inicia en USD 400+).
3. Canales establecidos (WhatsApp/Instagram) que necesitan elevarse con portal y evidencia.
4. Infraestructura nocode-friendly (Vercel + Hono + Prisma) para iterar rápido.

---

## 4. Características clave

| Módulo               | Evidencia/beneficio                                                                   |
| -------------------- | ------------------------------------------------------------------------------------- |
| Calendario operativo | Drag & drop, asignación de staff, filtros y alertas internas.                         |
| Portal cliente       | Magic links, branding propio, descarga de reportes, CTA “Formulario de interés SaaS”. |
| Inventario/restocks  | Reposición automática y seguimiento por propiedad.                                    |
| IA de resúmenes      | Generación automática en < 15 s. Guardado multi-tenant (`BookingSummary`).            |
| Integraciones        | Stripe Checkout (modo test), Slack, CRM via webhooks (`LEAD_WEBHOOK_URL`).            |

---

## 5. IA + Multi-tenant (Novedades)

| Módulo              | Estado / Beneficio                                                                                            |
| ------------------- | ------------------------------------------------------------------------------------------------------------- |
| `AiSummaryService`  | Implementado en `apps/api/src/services/ai-summary-service.ts` + tests. Expone resúmenes por tenant.           |
| `BookingSummary`    | Tabla Prisma activa. Persistimos modelo, tokens y texto final para compartirlo en panel/portal.               |
| Portal multi-tenant | Selector de tenant en login + permisos ADMIN/COORDINATOR/STAFF/CLIENT. Portales white-label listos para SaaS. |
| API pública         | Endpoints `/api/portal/**` y `/api/marketing/**` documentados (OpenAPI + JSON-LD en landing).                 |
| Webhooks            | `LEAD_WEBHOOK_URL` sincroniza solicitudes del formulario de interés con Slack/CRM.                            |

---

## 6. Social proof

- +70 propiedades digitalizadas en Miami.
- Tiempo promedio de entrega de reporte < 10 min.
- NPS > 75 con property managers piloto.
- Pipeline activo vía [formulario de interés](https://brisacubanacleanintelligence.com/#contacto) (campos UTM + selección de plan).

---

## 7. Planes de referencia

| Plan        | USD/mes | Ideal para                     | Incluye                                                                                              |
| ----------- | ------- | ------------------------------ | ---------------------------------------------------------------------------------------------------- |
| **Starter** | 99      | 1-5 propiedades                | Checklists premium, portal estándar, 1 integración PMS, soporte email.                               |
| **Growth**  | 249     | 5-25 propiedades               | Portal white-label, inventario/restocks, alertas multicanal, IA de resúmenes, soporte prioritario.   |
| **Scale**   | 499+    | 25+ propiedades / multi-tenant | Dashboards financieros, API/webhooks, IA avanzada, success manager dedicado, add-ons personalizados. |

---

## 8. Próximos hitos (Roadmap)

1. **Q4 2025** – Multi-tenant GA (completo) y selector en UI.
2. **Q1 2026** – IA Resúmenes + detección de incidencias.
3. **Q1 2026** – Billing Stripe live + add-ons.
4. **Q2 2026** – Marketplace de integraciones (PMS + housekeeping vendors).

---

## 9. Próximos pasos para prospectos

1. Revisar este one-pager y la [versión web](https://brisacubanacleanintelligence.com/recursos/one-pager).
2. Completar el [Formulario de interés SaaS](https://brisacubanacleanintelligence.com/#contacto) indicando tamaño de portafolio y plan deseado.
3. Recibir demo personalizada + acceso al sandbox multi-tenant.
4. Onboarding guiado (checklists, portal, webhooks) en ≤ 7 días.

---

**¿Preguntas?**  
`operaciones@brisacubanacleanintelligence.com` · `+1 (305) 555-0199`
