# Templates Index

Catálogo de plantillas reutilizables para documentación, contratos y operaciones.

## 📑 Uso

1. Haz una copia del template en la misma carpeta o en la ruta deseada.
2. Actualiza los campos marcados con `TODO` o `{{ placeholders }}`.
3. Menciona el template original al crear PRs para facilitar revisiones.

## 📂 Plantillas disponibles

| Plantilla                                                        | Descripción                                                    |
| ---------------------------------------------------------------- | -------------------------------------------------------------- |
| [adr-template.md](adr-template.md)                               | Plantilla de Architectural Decision Record (ADR).              |
| [model-card-template.md](model-card-template.md)                 | Formato para model cards de IA/ML.                             |
| [interview-notes-template.md](interview-notes-template.md)       | Notas estructuradas para entrevistas de clientes/stakeholders. |
| [meeting-minutes-template.md](meeting-minutes-template.md)       | Actas de reunión con resumen y acuerdos.                       |
| [ia-model-eval-template.md](ia-model-eval-template.md)           | Evaluación de modelos de IA según métricas definidas.          |
| [emergency-contract-template.md](emergency-contract-template.md) | Contrato de emergencia para servicios de limpieza.             |
| [estimation-manual-template.md](estimation-manual-template.md)   | Guía para estimaciones de servicio.                            |
| [cleanscore-manual-template.md](cleanscore-manual-template.md)   | Manual para generar reportes CleanScore™.                     |
| [insurance-checklist.md](insurance-checklist.md)                 | Checklist para requisitos de seguros.                          |
| [chemical-safety-guideline.md](chemical-safety-guideline.md)     | Mejores prácticas de manejo de químicos.                       |
| [crm-integration-checklist.md](crm-integration-checklist.md)     | Pasos para integrar CRMs externos.                             |

| **Ejemplos incluidos**                                                                       | Descripción                                 |
| -------------------------------------------------------------------------------------------- | ------------------------------------------- |
| [examples/emergency-contract-sample-carlos.md](examples/emergency-contract-sample-carlos.md) | Contrato completado para el PM “Carlos”.    |
| [examples/estimation-manual-sample-maria.md](examples/estimation-manual-sample-maria.md)     | Estimación completada para la host “María”. |

## ✅ Buenas prácticas

- Mantener el formato base y metadatos iniciales (fecha, autor).
- Versionar cambios significativos en el template original y documentarlos en `CHANGELOG.md`.
- Asegurar lenguaje inclusivo y alineado con la marca.
- Validar ortografía (`pnpm lint:spelling`) tras modificar o crear nuevos templates.

---

**Última actualización:** 2025-10-03
