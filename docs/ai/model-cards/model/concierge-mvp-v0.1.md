# Model Card · Concierge Multimodal MVP (v0.1)

- **Nombre del modelo:** Concierge Multimodal MVP
- **Versión / tag:** v0.1 (diseño)
- **Owner / contacto:** AI Lead — ai-lead@brisacubanaclean.com
- **Tipo:** Agente IA (texto + imágenes + voz)
- **Descripción breve:** Asistente que cotiza, agenda y responde dudas de clientes residenciales a partir de inputs multimedia.

## Datos
- Fuentes / datasets: _Pendiente (interacciones demo, catálogos de servicios)._ 
- Licencias / restricciones: TBD.
- Procesamiento / anotación: Requiere guidelines para etiquetadores (ES/EN).
- Cobertura / representatividad: Objetivo ≥70 % casos residenciales recurrentes.

## Métricas clave
| Métrica | Valor | Objetivo | Conjunto de prueba |
|---------|-------|----------|--------------------|
| Precisión respuesta útil | — | ≥85 % | QA set concierge |
| Handoff a humano | — | ≤25 % | Logs beta |
| Tiempo promedio respuesta | — | ≤3 s | Benchmarks staging |

## Evaluaciones de riesgo
- Sesgos conocidos / fairness checks: _Sin evaluar._
- Riesgos de seguridad / abuso: posible fuga PII, instrucciones maliciosas, saturación voice.
- Mitigaciones aplicadas: filtros moderation API, red team prompt-injection (pendiente), rate limit voice.

## Guardrails y monitoreo
- Límites de uso / políticas de acceso: solo clientes beta; logs 90 días, anonimización parcial.
- Alertas y umbrales: latencia >4 s, handoff >40 %, score satisfacción <4/5.
- Frecuencia de reevaluación: mensual o ante drift >5 % en métricas clave.

## Documentación adjunta
- Experimentos / notebooks: [Pendiente]
- Resultados de red team: [Pendiente]
- Enlaces a tickets de seguimiento: `AI-101`, `AI-GOV-003` (Decision Log/Backlog).

> Actualizar tras contar con dataset etiquetado y primer experimento en W&B.
