# 05 · IA y Automatización

## Visión de IA
- **Agente concierge multimodal**: voz, texto, imágenes, video -> cotizaciones y soporte.
- **CleanScore™**: visión computacional (CV) + feedback; detectar superficies sin limpiar, asignar puntuación.
- **Digital twin**: simulación operativa + financiera con reinforcement learning para optimización continua.
- **Marketing autopilot**: IA genera campañas, copys, creativos y ajusta presupuesto según ROI.
- **Motor de pricing dinámico**: modelos de demanda (Prophet/TFT), bandits con fairness.
- **Reputación y soporte**: clasificación de sentimiento, respuestas generativas, escalamiento crítico.
- **Knowledge graph**: conocimientos de procedimientos, insights, entrenamiento staff.

## Stack IA
- Modelos foundation (OpenAI GPT-4.1, Claude 3.5); fallback local (Mistral/Mixtral) para privacidad.
- LangChain 0.3.x para orquestar agentes y tool use.
- Servicios CV: AWS Rekognition / Vertex AI Vision + fine-tuning.
- pipeline ML: MLflow/Weights&Biases, Feast (feature store), Prefect/Dagster para orquestación.
- synthetic data para entrenamiento, fairness testing, red teams IA.

## Gobernanza IA
- Comité IA (PO, AI Lead, Legal) con reuniones mensuales + revisión trimestral de métricas.
- Model cards obligatorias (`docs/resources/templates/model-card-template.md`) para cada modelo/servicio desplegado; almacenar en `docs/ai/model-cards/`.
- Guardrails → validación de prompts, detección de contenido tóxico, límites de uso por rol, filtros de imágenes sensibles.
- Transparencia → etiquetar interacciones generadas por IA, logs auditables, disclosure en UI.
- Gestión de drift → monitoreo continuo, alertas, retraining programado; métricas en W&B y dashboards OTel.
- Política ética → uso responsable, derechos humanos, mitigación de sesgos, accesibilidad; red team semestral (CleanScore, pricing, concierge).
- Data lineage → trazabilidad dataset → versión modelo → release; registrar en Decision Log cuando cambie el origen de datos.

### Ciclo de vida de modelos
1. **Ideación**: business case + impacto → ticket AI backlog (Linear/Jira) etiquetado `AI`/`Risk`.
2. **Experimentación**: notebooks en W&B/MLflow; datos etiquetados con Label Studio; commits en `ml/experiments/`.
3. **Evaluación**: completar Model Card (`docs/ai/model-cards/`), fairness (EvidentlyAI), seguridad (prompt injection, adversarial). Checkpoint en Comité IA.
4. **Deploy**: gated por feature flag; observabilidad (latencia, costos, drift). Logs cifrados (retención 90 días) y alertas.
5. **Post-deploy**: feedback humano en loop → retraining programado (mensual) + actualización de Model Card/ADR.

### Setup datos & ML
- Repos dedicados: `ml/` para notebooks/pipelines, `data/` para esquemas y ETL (Prefect/Dagster).
- MLflow (local + remoto) para tracking, Weights & Biases opcional para colaboración.
- Feature Store (Feast) respaldado en Postgres/Redis; definir catálogo inicial (availability, cleanliness, staff sentiment).
- Pipelines de ingestión → validación → versionado (Delta/Parquet) con `infra/data/README.md` documentando SLAs.
- Model registry con approvals: staging → prod, ligado a feature flags.
- Model cards almacenadas en `docs/ai/model-cards/` (ver [Concierge](ai/model-cards/model/concierge-mvp-v0.1.md), [CleanScore](ai/model-cards/model/cleanscore-v0.1.md)). Owner: AI Lead.

## Automatización operativa
- Workflows Temporal: reservas, confirmaciones, asignaciones, rework, cobranzas.
- Event-driven ops: triggers por clima, tráfico, cancelaciones, stock.
- AIOps: agente detecta incidentes (latencia, errores), sugiere fix y puede ejecutar runbooks.
- Inventario inteligente: predicción de consumo, órdenes automáticas, alertas.
- Gamificación staff: métrica CleanScore, puntualidad, feedback -> incentivos y carrera.

## Casos avanzados
- **Voice in-ear**: asistente para staff, comandos de operación, traducción simultánea.
- **Tours 3D**: reconstrucción NeRF/gaussian splatting para estimaciones visuales.
- **SLA dinámico**: recalcula compromisos y compensaciones según condiciones.
- **Rework automático**: detecta CleanScore bajo, agenda rectificación, notifica cliente.
- **Compliance bot**: controla licencias, pólizas, entrenamientos; detiene operaciones ante incumplimientos.

## Métricas IA
- Tasa de acierto CleanScore vs auditorías humanas.
- Tiempo respuesta agente vs satisfacción usuario.
- Incremento NPS por personalización.
- ROI marketing autopilot (CPA, LTV/CAC).
- Equidad (bias) en decisiones de pricing/scheduling.


## Arquitectura RAG (Retrieval-Augmented Generation)
- Vector DB (Weaviate/Milvus) para indexar documentos (SOPs, FAQs, reseñas).
- Pipeline: Ingesta → Embeddings (OpenAI/Local) → Index → API RAG para concierge + copilot staff.
- Actualizaciones periódicas (cron) para mantener información fresca.
- Evaluaciones de calidad (preguntas esperadas) para evitar respuestas obsoletas.
