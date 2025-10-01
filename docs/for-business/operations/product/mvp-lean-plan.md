# Plan MVP Lean (0-12 semanas)

## Objetivo

Entregar un MVP funcional que valide la propuesta de valor y el modelo operativo con clientes reales, minimizando complejidad técnica y acortando el tiempo a feedback.

## Principios de priorización

- **Problema antes que plataforma**: desarrollar solo lo necesario para reservar, ejecutar y evaluar servicios de limpieza premium.
- **IA asistida, no autónoma**: CleanScore™ y concierge operan en modo asistido con supervisión humana hasta que existan datasets maduros.
- **Automatizar lo repetitivo, manualizar lo incierto**: procesos complejos (digital twin, WebXR, scheduling multi-agente) se reemplazan por workflows manuales/documentos durante el MVP.
- **Validación continua**: cada entregable se prueba con usuarios objetivo (property managers y residenciales premium) antes de ampliar alcance.

## Alcance funcional mínimo

| Dominio        | Incluido en MVP                                               | Pospuesto                                        |
| -------------- | ------------------------------------------------------------- | ------------------------------------------------ |
| Reservas       | Booking guiado (web) con formularios y fotos opcionales       | Tours 3D, WebXR, reconstrucción NeRF             |
| Pagos          | Stripe Checkout (single payment + propina)                    | Payouts automáticos a cuadrillas, wallets        |
| Agenda         | Panel admin con calendario y asignación manual                | Scheduling multi-agente, optimización AI         |
| CleanScore™   | Captura de fotos + checklist, scoring manual con plantilla IA | Inferencia automática CV, alertas en tiempo real |
| App staff      | Web móvil responsiva con checklists y confirmación de tareas  | App nativa offline-first, comandos de voz        |
| Comunicaciones | Email + WhatsApp template manual, notificaciones básicas      | Voice in-ear, IVR, automatización AIOps          |
| Reportes       | PDF/HTML simple de servicio + CleanScore manual               | Dashboards WebXR, Digital twin financiero        |
| Integraciones  | Stripe, Twilio/WhatsApp, Google Maps (geocoding básico)       | QuickBooks, DocuSign, PMS, IoT                   |

## Flujo operativo propuesto

1. Cliente agenda servicio vía landing → formulario IA asistido (estático) → pago en Stripe.
2. Operaciones reciben booking, validan disponibilidad y asignan cuadrilla en panel admin (manual).
3. Cuadrilla usa app web responsiva para checklist, captura fotos; CleanScore preliminar generado con plantilla (LLM asistido por operador).
4. Operaciones revisan CleanScore, ajustan si es necesario y publican reporte al cliente.
5. Soporte gestiona feedback y rework vía WhatsApp/email con macros predefinidas.

## Criterios de éxito

- 10-15 servicios pagados completados con CleanScore entregado en ≤24 h.
- NPS ≥ 40 entre clientes piloto; tasa de rework ≤ 20 %.
- SLA puntualidad (llegada <15 min de ventana) ≥ 90 %.
- Tiempo operativo por booking ≤ 30 min (desde reserva hasta asignación confirmada).

## Métricas y analítica

- Conversión funnel landing → reserva → pago → servicio completado.
- Tiempo de ciclo por servicio (booking, asignación, ejecución, reporte).
- Satisfacción cliente (NPS/CleanScore feedback) y staff (encuesta semanal).
- Costos unitarios (mano de obra, insumos, transporte) vs precio cobrado.

## Roadmap por oleadas

| Semana | Entregable clave                                                | Validación                    |
| ------ | --------------------------------------------------------------- | ----------------------------- |
| 1      | Finalizar entrevistas + insights Δ backlog                      | Workshop con stakeholders     |
| 2      | Prototipo Figma validado, copy landing actualizado              | Test moderado (5 usuarios)    |
| 3      | Landing booking + Stripe sandbox funcional                      | 3 reservas ficticias internas |
| 4      | Panel admin básico + calendario, plantilla CleanScore manual    | Dry-run con equipo interno    |
| 5      | App staff web responsiva (checklist, captura fotos)             | Ensayo en apartamento piloto  |
| 6      | Integración Twilio/WhatsApp (notificaciones)                    | Mensajes pruebas QA           |
| 7      | Piloto controlado (3 clientes residenciales)                    | Retrospectiva + métricas      |
| 8      | Ajustes backlog + playbook soporte, pricing refinado            | Entrevistas follow-up         |
| 9-10   | Piloto property managers (2 cuentas)                            | Métricas SLA & feedback       |
| 11     | Optimizar flujos, preparar documentación go/no-go               | Comité MVP                    |
| 12     | Decisión escalamiento (expansión integraciones, automatización) | Reporte ejecutivo             |

> Referencia narrativa: el caso premium de María (`caso-uso-maria.md`) sirve para guiar demos, pero toda promesa debe alinearse con las capacidades del MVP descrito aquí.
> Para escenarios B2B, usa el caso de Carlos (`caso-uso-carlos.md`) y resalta explícitamente qué se entrega hoy vs. fases de escalamiento.

## Artefactos requeridos

- Actualizar `docs/operations/interview-plan.md` con resultados y decisiones.
- Crear `docs/operations/support/` con macros, plantillas y SLA específicos para piloto.
- Mantener ADRs para decisiones MVP (ej. uso de app web vs móvil nativa, CleanScore asistido).
- Checklist QA simplificado alineado al alcance lean.

## Roles y responsabilidades

| Stream         | Responsable                   | Notas                                        |
| -------------- | ----------------------------- | -------------------------------------------- |
| Producto & UX  | Product Owner + Design Lead   | Prioriza backlog y testing con usuarios      |
| Ingeniería web | Tech Lead + equipo front/back | Implementa landing, panel y API mínima       |
| Operaciones    | Ops Lead                      | Define SOP manuales y asignación cuadrillas  |
| IA asistida    | AI Lead                       | Diseña prompts CleanScore y concierge manual |
| Marketing      | Marketing Lead                | Genera demanda piloto y comunicación         |

## Riesgos específicos

- **Sobrecarga operativa manual** → Limitar número de clientes piloto, establecer turnos claros.
- **Calidad CleanScore inconsistente** → Revisiones humanas dobles hasta estabilizar criterios.
- **Fricción en booking** → Iterar copy/UX semanalmente con métricas de abandono.
- **Fuga de alcance** → Gatekeeper (PO) valida cualquier funcionalidad nueva vs principios MVP.

## Preparación para fase siguiente

- Documentar aprendizajes en `docs/insights/` y Decision Log.
- Definir criterios para automatizar (p. ej. CleanScore auto) basados en datos reales.
- Planificar migración a integraciones adicionales solo cuando los hitos MVP estén en verde.
