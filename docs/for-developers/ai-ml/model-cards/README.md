# Model Cards · Brisa Cubana Clean Intelligence

Este directorio almacena las _model cards_ aprobadas por el Comité IA. Cada archivo debe basarse en la plantilla `docs/resources/templates/model-card-template.md` y mantenerse sincronizado con el Decision Log cuando haya cambios relevantes.

## Convenciones

- Nombre: `model/<nombre-modelo>-v<major.minor>.md` (p. ej. `model/concierge-mvp-v0.1.md`).
- Secciones obligatorias: descripción, datos, métricas, riesgos, guardrails, documentación adjunta.
- Cada card debe incluir enlace al experimento (MLflow/W&B) y al ADR correspondiente.
- Actualiza el README cuando se agregue, depreque o promocione un modelo.

## Modelos actuales

| Modelo                                              | Versión | Estado    | Owner   |
| --------------------------------------------------- | ------- | --------- | ------- |
| [Concierge multimodal](model/concierge-mvp-v0.1.md) | 0.1     | En diseño | AI Lead |
| [CleanScore vision](model/cleanscore-v0.1.md)       | 0.1     | En diseño | AI Lead |

> Cuando un modelo pase a producción, añade referencias a los releases de código y fecha de aprobación del Comité IA.
