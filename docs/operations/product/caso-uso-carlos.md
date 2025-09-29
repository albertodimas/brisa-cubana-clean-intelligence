# Caso de uso · Carlos (Property Manager Hostaway)

Escenario B2B que ilustra cómo Brisa Cubana responde a una crisis post-huracán para un portafolio de 127 unidades administradas en Hostaway. Incluye la separación entre lo que el MVP lean puede ofrecer hoy y las capacidades planeadas para fases de escalamiento.

## Perfil
- **Stakeholder:** Carlos, property manager con 127 propiedades en Miami y Miami Beach.
- **Contexto:** Huracán provoca cancelaciones, daños menores y urgencia por reabrir unidades premium en ≤24 h.
- **Objetivo:** Visibilidad 360°, coordinación rápida de cuadrillas y comunicación proactiva con huéspedes y propietarios.

## Valor por actor

| Actor | Valor objetivo | Estado MVP Lean | Evolución futura |
|-------|----------------|-----------------|------------------|
| Carlos (PM) | Dashboard consolidado con estado de 127 propiedades, priorización de incidentes y SLA de respuesta <6 h. | Tablero Kanban + reportes compartidos vía Notion/Sheets; SLA coordinado manualmente (checklist crisis). | Dashboard 3D con datos en tiempo real, integraciones Hostaway/Temporal, priorización automática por riesgo. |
| Brisa Cubana | Contrato de emergencia ($67K) y oportunidad de upsell a mantenimiento integral. | Plantilla contractual + seguimiento en QuickBooks manual; upsell coordinado por equipo comercial. | Workflows DocuSign automatizados, integración QuickBooks/Temporal, modelos de pricing dinámico por crisis. |
| Huéspedes | Comunicación cada 2 h, alternativas de reubicación <30 min, transparencia con fotos. | Plantillas WhatsApp/email enviadas por equipo soporte; repositorio compartido de fotos. | Automatización omnicanal (WhatsApp, email, SMS) con IA que genera mensajes personalizados y tracking público. |
| Staff | Protocolos de seguridad, rutas seguras, overtime gestionado. | SOP crisis impreso/digital + planeación manual de rutas; control overtime en hoja de cálculo. | App staff con rutas optimizadas, supplies pre-posicionados y cálculo automático de overtime/bonos.

## Línea de tiempo de crisis (versión objetivo)
1. **T0**: NOAA alerta zonas dañadas → se activan plantillas de crisis y se convoca comité.
2. **T+30 min**: Carlos sincroniza Hostaway; unidades críticas identificadas.
3. **T+2 h**: 35 cuadrillas asignadas con rutas seguras y kits prearmados.
4. **T+6 h**: Primer reporte de progreso, fotos y CleanScore de unidades listas.
5. **T+12 h**: Facturación parcial emitida, contratos adicionales DocuSign.
6. **T+24 h**: 90 % de unidades operables; huéspedes reubicados con confirmaciones.

> El MVP debe enfocarse en alcanzar hitos T0–T+6 h con herramientas manuales-orquestadas antes de invertir en automatización completa.

## Stack tecnológico en acción

| Pilar | MVP Lean | Escalamiento |
|-------|----------|--------------|
| Infraestructura | Temporal manual (tablero de seguimiento), almacenamiento en Postgres/Sheets, backups en Drive. | Cloudflare Workers, Temporal orquestando 100+ workflows paralelos, Redis para tracking en tiempo real. |
| Integraciones | Exportación Hostaway (CSV/API) procesada manualmente; QuickBooks/DocuSign operados desde consola web; NOAA seguimiento manual. | Synchronización Hostaway 30 s, QuickBooks/DocuSign automáticos, NOAA API 5 min, WhatsApp Business programático. |
| IA/ML | Plantillas LLM para priorizar tareas y redactar mensajes; CleanScore asistido. | Computer Vision en 1.2k fotos, optimización de rutas para 35 cuadrillas, pricing predictivo crisis. |
| Observabilidad | Tablero crisis en Notion/Sheets con métricas clave; checklist incidentes. | Datadog + Grafana en vivo, Sentry con auto-recovery, dashboard público para clientes enterprise.

## Métricas clave
- Tiempo de respuesta a incidentes críticos (meta MVP: <6 h, objetivo futuro: <4 h).
- Unidades reabiertas en 24 h (meta MVP: 70 %, objetivo futuro: 90 %).
- NPS de huéspedes y property manager durante el evento.
- Revenue protegido estimado vs. costo operativo de la crisis.

## Artefactos y playbooks requeridos
- **Plan de crisis** (SOP) extendido en `docs/operations/sops/emergency-response.md` con sección B2B.
- **Checklist PM** con columnas de prioridad, daños, ETA cuadrilla y verificación CleanScore.
- **Macros de comunicación** en `docs/operations/support/support-playbook.md` (huéspedes, propietarios, seguros).
- **Plantilla propuesta de contrato emergencia** en `docs/resources/templates/` (pendiente). 
- **Reporte ejecutivo 24 h**: resumen para Carlos y stakeholders internos.
  - Ejemplos completos disponibles en `docs/resources/templates/examples/` para contratos y estimaciones.

## Pasos para habilitar el MVP
1. Completar entrevistas con property managers (ver `docs/operations/interview-plan.md`) y validar flujos mínimos.
2. Diseñar tablero crisis manual (Notion/Sheets) y entrenar equipo Ops/CS en su uso.
3. Configurar plantillas de mensajes y contratos; documentar proceso de facturación parcial en QuickBooks.
4. Realizar simulacro interno de huracán (tabletop) con 5–10 propiedades piloto.

## Evolución al modo autónomo
- Integrar Hostaway/Temporal para disparar workflows por propiedad.
- Activar optimización de rutas y stock pre-posicionado mediante IA (ver `docs/05-ia-y-automatizacion.md`).
- Publicar dashboard en Grafana/Datadog para clientes enterprise con métricas live.
- Implementar loyalty B2B (porcentaje de ahorro, informes trimestrales) y upsells automatizados.

> Este caso debe usarse en propuestas comerciales B2B dejando claro qué componentes son parte del MVP manual-orquestado y cuáles se liberarán al cerrar los hitos listados en `mvp-lean-plan.md`.
