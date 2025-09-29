# Caso de uso · María (Penthouse en Brickell)

Escenario end-to-end que ilustra la experiencia objetivo de Brisa Cubana para un cliente residencial premium. Separamos claramente qué elementos forman parte del MVP lean y cuáles se habilitarán en fases futuras.

## Perfil
- **Cliente:** María, ejecutiva cubano-americana.
- **Propiedad:** Penthouse 3,000 sq ft en Brickell, 3 habitaciones / 2.5 baños.
- **Necesidad:** Limpieza bi-semanal, alta confiabilidad y visibilidad del servicio.

## Resumen por etapas

| Etapa | Experiencia objetivo | Estado MVP Lean | Evolución futura |
|-------|----------------------|-----------------|------------------|
| 1. Descubrimiento | Búsqueda "limpieza premium Brickell" → agente IA bilingüe detecta ubicación e idioma preferido. | **Manual asistido**: landing optimizada SEO + chatbot scriptado con handoff humano. | NLP avanzado + detección automática de contexto vía intent matching y geolocalización. |
| 2. Cotización | Solicitud de fotos/video, CV estima metraje, suciedad y tiempo; genera precio con descuento onboarding. | Formularios + carga de fotos opcional, estimación manual asistida con plantilla; pricing tabla simple. | Visión artificial + pricing dinámico con modelos predictivos y CleanScore inicial automático. |
| 3. Scheduling | Multi-agente cruza disponibilidad de cuadrillas, rutas y clima para ofrecer slot óptimo. | Panel admin asigna manualmente cuadrilla y horario; verificación clima con checklist. | Orquestación Temporal con agentes (disponibilidad, rutas, clima) y confirmación automática al cliente. |
| 4. Pre-servicio | Notificación con tracking en vivo, perfil del team y recomendaciones de insumos. | Email/WhatsApp con recordatorio, sin tracking en tiempo real; briefing manual del staff. | Tracking GPS integrado, checklist dinámico y recomendaciones IA en app staff. |
| 5. Ejecución | App staff guía checklist, detecta upsells, captura fotos before/after; IA monitorea progreso. | Web app responsiva con checklist básico y carga de fotos; upsell anotado manualmente. | Sugerencias IA in-app, detección automática de upsells y telemetría en tiempo real. |
| 6. Control calidad | CleanScore™ automático con alerta de zonas pendientes y workflow rework. | Revisión humana con plantilla CleanScore asistida por LLM (doble validación). | CleanScore CV + rework auto programado via workflows. |
| 7. Pago | Check-out con Apple Pay/Zelle/Stripe, recibo inmediato. | Stripe Checkout + recibo por email; opciones de pago adicionales documentadas para follow-up. | Integración nativa wallets, propinas instantáneas y conciliación contable automática. |
| 8. Post-servicio | Feedback con estrellas, propuesta bi-semanal y automatización de recurrencias. | Encuesta simple + registro manual de recurrencia en CRM; descuentos aplicados manualmente. | Automatización CRM (HubSpot/QuickBooks), scheduling recurrente y loyalty program con IA. |

## Métricas a observar durante el MVP
- Tiempo total de María invertido en la experiencia (objetivo ≤10 minutos). 
- Tiempo operativo interno desde reserva hasta asignación (objetivo ≤30 min). 
- CleanScore entregado en <24 h tras servicio, con evidencias fotográficas. 
- NPS / CSAT del servicio y del equipo asignado.

## Artefactos necesarios
- **Scripts conversacionales** (landing/chatbot) documentados en `docs/operations/support/support-playbook.md`.
- **Plantilla de estimación manual** (metraje, horas, precio) en `docs/resources/templates/` (pendiente de crear).
- **Checklist staff penthouse**: versión en `docs/operations/sops/onboarding-staff.md` + anexo específico de superficies delicadas.
- **Plantilla CleanScore asistido**: referenciada desde `docs/operations/qa/testing-strategy.md` y `docs/operations/product/mvp-lean-plan.md`.

## Plan de evolución
1. **Validar MVP** con 5-10 propiedades premium (medir tiempos, satisfacción, rework).
2. **Automatizar cálculo de duración y precio** cuando existan ≥50 servicios con datos estructurados.
3. **Desplegar CleanScore CV** tras captar >2k imágenes etiquetadas (ver `docs/ai/model-cards/model/cleanscore-v0.1.md`).
4. **Activar scheduling inteligente** integrando Temporal + optimización de rutas al superar 8 cuadrillas operativas.
5. **Implementar loyalty & recurrencias automáticas** cuando se consoliden flujos en QuickBooks/CRM.

> Usa este caso como guía narrativa en demos y pitch deck, asegurando que cualquier promesa comercial refleje la versión del producto realmente disponible en el MVP.
