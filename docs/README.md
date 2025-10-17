# Brisa Cubana Clean Intelligence – Manual de Documentación

**Última revisión:** 15 de octubre de 2025  
Todas las guías descritas aquí reflejan funcionalidades existentes y probadas en `main`.  
Ejecuta `pnpm docs:verify` para validar la estructura antes de abrir un PR.

## Índice por dominio

| Dominio             | Archivo principal                                                                                                                                                                                                                                                                                                                                                                                        | Contenido resumido                                                                                                                          |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Visión general      | [`overview/status.md`](overview/status.md) · [`overview/inventory.md`](overview/inventory.md)                                                                                                                                                                                                                                                                                                            | Estado funcional, arquitectura vigente, inventario de código y herramientas activas.                                                        |
| Guías               | [`guides/quickstart.md`](guides/quickstart.md) · [`guides/portal-client.md`](guides/portal-client.md) · [`guides/figma-integration.md`](guides/figma-integration.md)                                                                                                                                                                                                                                     | Onboarding local (Node 22.13.0, pnpm 10.18, Docker 24), operación del portal cliente beta y exportación automatizada de assets desde Figma. |
| Referencia técnica  | [`reference/api-reference.md`](reference/api-reference.md) · [`reference/openapi.yaml`](reference/openapi.yaml)                                                                                                                                                                                                                                                                                          | Especificación OpenAPI 3.1 + guía para usar Scalar en local y producción.                                                                   |
| Operaciones         | [`operations/security.md`](operations/security.md) · [`operations/deployment.md`](operations/deployment.md) · [`operations/backup-recovery.md`](operations/backup-recovery.md) · [`operations/backup-log.md`](operations/backup-log.md) · [`operations/observability.md`](operations/observability.md) · [`operations/alerts.md`](operations/alerts.md) · [`operations/sentry.md`](operations/sentry.md) | Seguridad, despliegue en Vercel, procedimientos de backup/restore y observabilidad operacional.                                             |
| QA y calidad        | [`qa/e2e-strategy.md`](qa/e2e-strategy.md) · [`qa/regression-checklist.md`](qa/regression-checklist.md) · [`qa/performance-budgets.md`](qa/performance-budgets.md) · [`qa/portal-accessibility.md`](qa/portal-accessibility.md)                                                                                                                                                                          | Estrategia piramidal de testing, checklist previo al deploy, presupuestos de desempeño web y reporte A11y.                                  |
| Producto            | [`product/user-management.md`](product/user-management.md) · [`product/pagination.md`](product/pagination.md) · [`product/phase-2-roadmap.md`](product/phase-2-roadmap.md) · [`product/rfc-public-components.md`](product/rfc-public-components.md)                                                                                                                                                      | Definición funcional vigente, roadmap comercial y RFC de componentes públicos para landing/checkout/portal.                                 |
| Decisiones técnicas | [`decisions/dependency-updates.md`](decisions/dependency-updates.md) · [`decisions/tailwind-v4-deferral.md`](decisions/tailwind-v4-deferral.md) · [`decisions/tailwind-v4-plan.md`](decisions/tailwind-v4-plan.md) · [`decisions/search-filters-plan.md`](decisions/search-filters-plan.md)                                                                                                              | Estrategia de dependencias, planes operativos (Tailwind v4, búsqueda/filtros) y ADRs vigentes.                                              |
| Historial           | [`archive/2025-10-08-session-log.md`](archive/2025-10-08-session-log.md)                                                                                                                                                                                                                                                                                                                                 | Bitácora con decisiones y evidencias previas; solo lectura para referencia histórica.                                                       |
| Seguridad           | [`../SECURITY.md`](../SECURITY.md)                                                                                                                                                                                                                                                                                                                                                                       | Política de divulgación responsable, canales de reporte y tiempos de respuesta.                                                             |

## Reglas de mantenimiento

- Solo documentamos capacidad probada (tests verdes + despliegue verificado).
- Cada actualización relevante debe reflejarse en `CHANGELOG.md` y enlazar al documento correspondiente.
- No crear archivos `.md` sueltos en `docs/`; use las carpetas existentes o amplíe la tabla anterior.
- Mantén la fecha de “Última revisión” alineada con el commit que introduce cambios funcionales.
- Ejecuta `pnpm docs:verify` en local y CI; el script falla si la estructura se desvía de la tabla anterior.

## Flujo sugerido para actualizar documentación

1. Implementa la funcionalidad y agrega/verifica pruebas (Vitest, Playwright).
2. Actualiza la referencia técnica (`reference/`) y la guía operativa o de producto correspondiente.
3. Refleja el cambio en `overview/status.md` (estado general) y en el `README.md` raíz si aplica.
4. Añade entrada en `CHANGELOG.md` describiendo evidencias (tests, despliegue).
5. Corre `pnpm docs:verify && pnpm lint && pnpm test` antes del commit.

## Archivos especiales

- Las plantillas de seeds y variables se mantienen en `apps/api/.env.example` y `docs/operations/security.md`.
- Los reportes generados automáticamente (Playwright, coverage) no deben subirse; consulta `.gitignore`.
- `scripts/verify-doc-structure.sh` es la autoridad de estructura: actualízalo cuando se agreguen dominios nuevos.

---

¿Necesitas agregar un nuevo dominio de documentación? Actualiza esta tabla, el script de verificación y enlaza la guía en `docs/overview/status.md` para mantener una única fuente de verdad.
