# Model Card · CleanScore Vision (v0.1)

- **Nombre del modelo:** CleanScore Vision
- **Versión / tag:** v0.1 (diseño)
- **Owner / contacto:** AI Lead — ai-lead@brisacubanaclean.com
- **Tipo:** Computer Vision + clasificación
- **Descripción breve:** Detecta superficies sin limpiar y genera puntaje CleanScore™ a partir de fotos antes/después capturadas por el staff.

## Datos

- Fuentes / datasets: `BC-CleanScore-v0` (312 pares before/after capturados en pilotos internos set–sep 2025) + 96 imágenes públicas de benchmark (`OpenRooms-2023`) para ampliar variabilidad.
- Licencias / restricciones: Consentimiento explícito clientes piloto; contenido público regido por licencias CC-BY. Prohibido reutilizar sin blur de rostros/placas.
- Procesamiento / anotación: Pipeline Label Studio → verificación QA doble; etiquetas `clean`, `missed-spot`, `quality-issue`. Balance final: 58 % residenciales premium, 42 % short-term rentals.
- Cobertura / representatividad: 3 condiciones de iluminación (día/noche/artificial), 5 tipos de superficie (mármol, madera, acero, vidrio, textiles). Objetivo próximo release: >=2k pares con vertical oficinas boutique.

## Métricas clave (baseline 2025-09-24)

| Métrica                          | Valor | Objetivo | Conjunto de prueba                      |
| -------------------------------- | ----- | -------- | --------------------------------------- |
| F1 detección limpieza incompleta | 0.74  | >=0.80   | 20 % hold-out (`BC-CleanScore-v0/test`) |
| MAE puntaje CleanScore           | 0.62  | <=0.50   | Auditoría humana (n=45 servicios)       |
| Tasa rework correcto             | 0.88  | >=0.90   | Servicios beta (sept 2025)              |

Baseline entrenado con ResNet50 + cabeza MLP (transfer learning). Próximo sprint: probar Vision Transformer ligero y data augmentation fotométrica.

## Evaluaciones de riesgo

- Sesgos conocidos: sobrepeso de propiedades con iluminación natural; baja representación de espacios comerciales.
- Riesgos de seguridad: almacenamiento de fotos con PII, posibles reflejos de personas.
- Mitigaciones: blur automático de rostros/espejos, eliminación en 90 días, cifrado en reposo (S3 + KMS). Checklist manual para servicios VIP.

## Guardrails y monitoreo

- Límites: solo staff verificado puede subir imágenes; CleanScore visible al cliente tras revisión humana.
- Alertas: desviación >=10 % vs auditor humano, precisión semanal <0.7 dispara revisión manual.
- Reevaluación: comité IA cada trimestre o cuando se agregue nueva categoría (oficinas, hospitality).

## Documentación adjunta

- Experimentos / notebooks: `ml/experiments/cleanscore/2025-09-baseline.ipynb` (tracking en MLflow run `CLEAN-BASE-0924`).
- Resultados red team visión: ejercicio manual 2025-09-26 (8 casos edge: baja luz, espejos, pets). Hallazgos: 1 FP por reflejo — mitigado con blur adicional.
- Tickets seguimiento: `AI-102` (tuning modelo), `AI-GOV-004` (política retención media), `QA-087` (mejorar set nocturno).

> Actualizar métricas y dataset al cerrar el piloto CleanScore beta (W8). Adjuntar export Label Studio y reporte red team formal en el repositorio IA.
