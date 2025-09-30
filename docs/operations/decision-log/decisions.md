# Decision Log (ADR-lite)

| ID     | Fecha      | Decisión                                        | Motivación                                                                                                    | Impacto                |
| ------ | ---------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ---------------------- |
| ADR-01 | 2025-09-28 | Uso de Bun + Next.js 15 + React 19              | Rendimiento, SSR híbrido y DX moderna                                                                         | Arquitectura web       |
| ADR-02 | 2025-09-28 | MkDocs + Material para docs                     | Doc fácil, sitio estático                                                                                     | Documentación          |
| ADR-03 | 2025-09-28 | CleanScore™ con visión IA                      | Diferenciación calidad objetiva                                                                               | Producto               |
| ADR-04 | 2025-09-28 | Event mesh + Temporal                           | Orquestación event-driven                                                                                     | Backend                |
| ADR-05 | 2025-09-28 | Monitorear roadmap Next.js 15                   | Vigilar releases y compatibilidad; migración ejecutada (ver ADR-10)                                           | Producto/Arquitectura  |
| ADR-06 | 2025-09-28 | Revisar estrategia Node (LTS vs Current)        | Evaluar migrar a Node LTS (20) en Q1 2026 o mantener Node 24 con actualizaciones regulares                    | Tech Lead              |
| ADR-07 | 2025-09-30 | Explorar robots UV-C como servicio premium      | Validar alianzas, costos y métricas CleanScore desinfección antes de incluir en roadmap V1                    | Product + Ops          |
| ADR-08 | 2025-09-30 | Diseñar programa EB-3 para atracción de talento | Mitigar shortage laboral y asegurar staff estable; requiere asesoría legal y housing                          | People/Ops Lead        |
| ADR-09 | 2025-09-30 | Evaluar oferta ESG-as-a-Service                 | Crear pilotos de reporting ESG integrado para clientes B2B; dependerá de integraciones sensores y data        | Product + Data Lead    |
| ADR-10 | 2025-09-29 | Migrar frontend a Next.js 15 + pnpm + Turborepo | Simplificar DX con Turbopack, caché incremental y stack unificado TypeScript                                  | Producto/Arquitectura  |
| ADR-11 | 2025-09-30 | Validaciones Zod + Husky obligatorio            | Centralizar saneo de payloads y bloquear commits sin lint/staged para asegurar calidad                        | Backend / Tooling      |
| ADR-12 | 2025-09-30 | Playwright smoke suite                          | Añadir validaciones E2E ligeras y reporter HTML para proteger landing                                         | QA                     |
| ADR-13 | 2025-09-30 | Redis/Event Mesh/Temporal en evaluación         | Mantener en roadmap hasta definir alcance/viabilidad (sin implementación actual)                              | Backend/Infrastructure |
| ADR-14 | 2025-10-01 | Plataforma de documentación moderna             | Se adopta MkDocs Material Insiders (versión self-host) para habilitar versionado y búsqueda Algolia DocSearch | Docs/Platform          |
| ADR-15 | 2025-10-01 | Pipelines de documentación automatizada         | CI generará TypeDoc, diagramas y Storybook; enlazar artefactos en doc oficial                                 | DevEx                  |

Agregar nuevas decisiones con detalle (considerar formato ADR completo si aplica).
