# Mapa de insights de investigación

Este repositorio centraliza los hallazgos de entrevistas, encuestas y pruebas de concepto. Cada registro debe mantener trazabilidad con la fuente y la fecha de captura.

## Estructura sugerida

- **ID**: formato `INS-SEG-001` (segmento + correlativo).
- **Fecha**: día de la entrevista o estudio.
- **Segmento**: residencial, property manager, office, staff, etc.
- **Hallazgo**: insight clave redactado en una frase accionable.
- **Evidencia**: citas textuales, métricas o materiales adjuntos.
- **Impacto**: valoración (Alta/Media/Baja) sobre el roadmap.
- **Acción**: propuesta concreta (añadir al backlog, revisar pricing, etc.).

> Usa la plantilla `docs/resources/templates/interview-notes-template.md` para notas crudas y consolida aquí los hallazgos finales.

## Flujo de trabajo

1. Registrar cada entrevista en la plantilla correspondiente.
2. Extraer hallazgos y volcarlos en este documento o sub-documentos específicos por segmento.
3. Actualizar backlog/OKR con las recomendaciones aceptadas.
4. Notificar al equipo en el canal #research con un resumen quincenal.

## Próximos pasos

- [ ] Cargar insights iniciales tras las primeras entrevistas residenciales y property managers.
- [ ] Crear subpáginas por segmento cuando existan ≥10 hallazgos.
- [ ] Vincular cada insight relevante con las decisiones (`docs/operations/decision-log/`).

## Insights activos (sept 2025)

| ID | Fecha | Segmento | Hallazgo | Impacto | Acción |
|----|-------|----------|----------|---------|--------|
| INS-RES-001 | 2025-09-15 | Residencial premium | Clientes esperan evidencia visual inmediata tras cada servicio (fotos + métricas). | Alta | Priorizar entrega automática de CleanScore™ y reportes visuales en MVP. |
| INS-PMS-001 | 2025-09-18 | Property manager | Turnos de limpieza necesitan ventana ≤4 h entre checkout y nuevo check-in. | Alta | Diseñar scheduler con bloqueos dinámicos y alertas de retrasos. |
| INS-STA-001 | 2025-09-20 | Staff de limpieza | App debe funcionar offline y ofrecer comandos de voz bilingües. | Media | Definir backlog de modo offline + voice assistant en app staff. |
