# Model Card · CleanScore Vision (v0.1)

- **Nombre del modelo:** CleanScore Vision
- **Versión / tag:** v0.1 (diseño)
- **Owner / contacto:** AI Lead — ai-lead@brisacubanaclean.com
- **Tipo:** Computer Vision + clasificación
- **Descripción breve:** Detecta superficies sin limpiar y genera puntaje CleanScore™ a partir de fotos antes/después capturadas por el staff.

## Datos
- Fuentes / datasets: _Por recolectar_ (imágenes demo + dataset abierto de limpieza si disponible).
- Licencias / restricciones: revisar derechos de imagen de clientes.
- Procesamiento / anotación: etiquetadores internos + supervisión QA; métricas en Label Studio.
- Cobertura / representatividad: Objetivo >2k pares before/after (residencial premium, short-term rentals).

## Métricas clave
| Métrica | Valor | Objetivo | Conjunto de prueba |
|---------|-------|----------|--------------------|
| F1 detección limpieza incompleta | — | ≥0.80 | Set validación rotado |
| MAE puntaje CleanScore | — | ≤0.5 | Auditores humanos |
| Tasa rework correcto | — | ≥90 % | Servicios beta |

## Evaluaciones de riesgo
- Sesgos conocidos: Sesgo por tipo de superficie / iluminación.
- Riesgos de seguridad: almacenamiento fotos con PII, reconocimiento involuntario de personas.
- Mitigaciones: anonimización automática (blur), políticas retención 90 días, revisión manual resultados críticos.

## Guardrails y monitoreo
- Límites de uso: solo staff verificado; acceso portal cliente con consentimiento expreso.
- Alertas: desviación ≥10 % vs auditor humano, fallos proceso inferencia.
- Reevaluación: trimestral o cuando se incorporen nuevas categorías (ej. oficinas).

## Documentación adjunta
- Experimentos / notebooks: [Pendiente]
- Resultados red team visión: [Pendiente]
- Tickets seguimiento: `AI-102`, `AI-GOV-004`.

> Completar con datos reales tras la fase piloto y agregar enlace a repositorio de etiquetas.
