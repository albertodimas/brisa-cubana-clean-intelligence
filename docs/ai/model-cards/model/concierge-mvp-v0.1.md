# Model Card · Concierge Multimodal MVP (v0.1)

- **Nombre del modelo:** Concierge Multimodal MVP
- **Versión / tag:** v0.1 (diseño)
- **Owner / contacto:** AI Lead — ai-lead@brisacubanaclean.com
- **Tipo:** Agente IA (texto + imágenes + voz)
- **Descripción breve:** Asistente que cotiza, agenda y responde dudas de clientes residenciales a partir de inputs multimedia.

## Datos
- Fuentes / datasets: `BC-Concierge-demo` (186 conversaciones bilingües grabadas en workshops internos), catálogo estructurado de servicios `services_catalog_v2025-09.json`, intenciones sintéticas generadas con GPT-4.1 (revistas manualmente).
- Licencias / restricciones: Conversaciones con consentimiento firmado; datos sintéticos con licencia interna. Prohibido usar audio de clientes reales sin enmascaramiento de identidad.
- Procesamiento / anotación: Etiquetado de intents (`quote`, `reschedule`, `complaint`, `upsell`) + slots (metraje, fecha, tipo servicio). Herramienta: Label Studio + validador humano. Cobertura actual: 64 % español, 31 % inglés, 5 % portuñol.
- Cobertura / representatividad: Casos residenciales premium y alquiler vacacional. Próximo sprint: incluir property managers (>=30 nuevas conversaciones) y escenarios voz-only.

## Métricas clave (baseline 2025-09-25)
| Métrica | Valor | Objetivo | Conjunto de prueba |
|---------|-------|----------|--------------------|
| Precisión respuesta útil (evaluación humana) | 0.82 | >=0.85 | Set QA (`BC-Concierge-demo/test`, n=60) |
| Handoff a humano | 0.28 | <=0.25 | Logs sandbox (agosto-sept 2025) |
| Tiempo promedio respuesta (texto) | 2.7 s | <=3.0 s | Benchmarks staging (10 ejecuciones) |
| Latencia promedio voz (STT+respuesta) | 4.3 s | <=4.5 s | Pipeline WebRTC prototipo |

Stack baseline: Orquestación LangChain + GPT-4.1 (text) / Whisper-large-v3 (STT) / modelo TTS Azure Neural.

## Evaluaciones de riesgo
- Sesgos: respuestas más precisas en español que en inglés informal; menor cobertura en consultas de mantenimiento no estándar.
- Seguridad / abuso: riesgo de fuga de PII, prompt injection, comandos fuera de alcance.
- Mitigaciones: filtros moderation API, sanitización inputs, rate limiting voz 10 req/min, almacenamiento de logs 30 días con anonimización parcial.

## Guardrails y monitoreo
- Límites de uso: solo clientes beta (lista blanca). Handoff obligatorio si el score de confianza <0.6 o si se detecta intención `damage-report`.
- Alertas: latencia >4 s durante 5 min, handoff >40 %, tasa de satisfacción <4/5 en encuestas post chat.
- Reevaluación: comité IA mensual; revisión adicional tras cada lote de 50 conversaciones reales.

## Documentación adjunta
- Experimentos / notebooks: `ml/experiments/concierge/2025-09-routing.ipynb` (comparativa agente simple vs. routers); tracking en W&B run `CONCIERGE-OPS-0925`.
- Resultados de red team: sesión 2025-09-27 (12 prompts adversos). Riesgo detectado: prompt que intenta forzar reembolso — mitigado con regla de denegación y escalamiento humano.
- Enlaces a tickets: `AI-101` (mejorar comprensión metraje), `AI-GOV-003` (auditoría de privacidad), `CS-044` (plantillas de handoff).

> Actualizar métricas cuando se incorporen datos de property managers y voice-only. Adjuntar logs resumidos y checklist de seguridad antes de abrir beta externa.
