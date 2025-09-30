# Copilot & IA Responsable

> Documento inicial (`ENG-151`). Esta sección consolidará políticas de uso de IA, prompts aprobados y enlaces a evaluaciones (LangSmith/OpenAI).

## Objetivos

- Definir políticas de transparencia, guardrails y disclosure para asistentes internos/externos.
- Centralizar prompts y flujos aprobados para concierge, QA y soporte.
- Documentar métricas de evaluación y procesos de revisión humana.

## Próximos pasos

1. Recopilar políticas existentes (ver `docs/05-ia-y-automatizacion.md`).
2. Generar repositorio de prompts versionado con etiquetas de riesgo (`ENG-151`).
3. Integrar reportes de evaluaciones automáticas (LangSmith/OpenAI evals) en CI.
4. Publicar guía de uso y cheat-sheets en `docs/_build/api/copilot` cuando el pipeline lo permita.

## Recursos temporales

- `pnpm docs:build:artifacts`: genera Blueprint IA (pendiente conectar evaluaciones LangSmith).
- Algolia DocSearch index `brisa_docs` incluirá esta sección para búsquedas cruzadas.
