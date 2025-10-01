# Simulacro tabletop · Respuesta B2B post-huracán

Ejercicio diseñado para validar la coordinación entre Brisa Cubana y property managers durante eventos críticos, utilizando el caso de Carlos como referencia.

## Objetivos

- Evaluar tiempos de respuesta desde alerta NOAA hasta reapertura de primeras unidades.
- Probar plantillas de comunicación y macros en situaciones de crisis.
- Identificar cuellos de botella en asignación de cuadrillas y facturación parcial.
- Alinear métricas y responsabilidades entre equipos Ops, Soporte, IA y Comercial.

## Participantes

| Rol                      | Responsable            | Observaciones                            |
| ------------------------ | ---------------------- | ---------------------------------------- |
| Incident Commander       | Ops Lead (Alejandra)   | Dirige ejercicio, toma decisiones        |
| Liaison Property Manager | Account Manager B2B    | Representa a Carlos y Hostaway           |
| Soporte & Comunicación   | CS Manager + IA Assist | Ejecuta macros y registra feedback       |
| Cuadrillas simuladas     | Ops coordinators       | Emulan respuesta de equipos de campo     |
| Finanzas                 | Finance Lead           | Valida facturación parcial y forecast    |
| Observador IA/Data       | AI Lead                | Registra oportunidades de automatización |

## Preparación (1 semana antes)

- Revisar `docs/operations/sops/emergency-response.md` y confirmar inventario crisis.
- Cargar portafolio de 20 propiedades mock en tablero Notion/Sheets con datos de daños ficticios.
- Configurar canales Slack/WhatsApp de prueba y habilitar macros del playbook soporte.
- Prellenar contrato de emergencia ejemplo (`docs/resources/templates/examples/emergency-contract-sample-carlos.md`).
- Establecer métricas base: tiempo de activación, asignación cuadrilla, comunicación huésped, emisión factura.

## Agenda del ejercicio

1. **T0 (00:00)** — NOAA emite alerta categoría 3. Se activa comité y se revisan 5 propiedades prioritarias.
2. **T+15 min** — Se solicita actualización Hostaway; tablero se llena con estados "sin evaluar".
3. **T+45 min** — Ops asigna 3 cuadrillas a unidades críticas; soporte envía primer mensaje a PM y huéspedes.
4. **T+90 min** — Simulación de hallazgo de daños mayores en 2 unidades; se prueba macro de reubicación huéspedes.
5. **T+150 min** — Finanzas genera invoice parcial; se captura feedback del PM.
6. **T+210 min** — Evaluación CleanScore manual para 1 unidad completada; se envían fotos y resumen.
7. **Retrospectiva (30 min)** — Se analizan métricas vs. objetivos y se generan acciones.

## Métricas de éxito

- Activación comité <10 min.
- Asignación primera cuadrilla <45 min.
- Primer reporte al PM <60 min.
- Porcentaje unidades con plan de acción definido (meta ≥80 % en 3 h).
- Tiempos de envío de factura parcial (meta ≤3 h).

## Entregables post-ejercicio

- Informe retro con hallazgos, gaps y decisiones (añadir a `docs/operations/decision-log/decisions.md` si aplica).
- Plan de acción con responsables y fechas.
- Actualización de plantillas/macros según feedback.

> Repetir el simulacro cada 6 meses o tras eventos reales significativos para asegurar preparación continua.
