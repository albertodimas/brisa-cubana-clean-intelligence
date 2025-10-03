# Inventario Diátaxis

Este inventario clasifica la documentación existente según el marco [Diátaxis](https://diataxis.fr/start-here/), identifica huecos y asigna responsables para su mantenimiento.

## Tutoriales (lecciones paso a paso)

| Documento                                                | Propósito                               | Observaciones                                                  |
| -------------------------------------------------------- | --------------------------------------- | -------------------------------------------------------------- |
| `docs/for-developers/quickstart.md`                      | Leva entorno local y seed de datos      | Debe actualizarse cuando cambien scripts de bootstrap.         |
| `docs/operations/runbooks/GO_LIVE.md`                    | Despliegue controlado a producción      | Ejecutar ejercicios guiados con equipo SRE cada release mayor. |
| `docs/for-developers/tutorials/cleanscore-tutorial.md`   | Generar informe CleanScore™ end-to-end | Revisar tras cambios en pipeline de scoring.                   |
| `docs/for-developers/tutorials/concierge-ai-tutorial.md` | Atender solicitudes con Concierge AI    | Actualizar modelos soportados y flags disponibles.             |

## How-to Guides (resolver tareas concretas)

| Documento                                                   | Tarea                                              | Observaciones                                          |
| ----------------------------------------------------------- | -------------------------------------------------- | ------------------------------------------------------ |
| `docs/operations/runbooks/ROLLBACK.md`                      | Revertir despliegues problemáticos                 | Mantener sincronizado con scripts de Railway/Vercel.   |
| `docs/operations/runbooks/INCIDENT_RESPONSE.md`             | Gestionar incidentes Sev1–Sev3                     | Añadir ejemplos de plantillas para status page.        |
| `docs/operations/runbooks/OPERATIONAL_READINESS_REVIEW.md`  | Validar releases críticos                          | Incluir checklist automatizable en GitHub Actions.     |
| `docs/operations/runbooks/README.md`                        | Índice de procedimientos operativos                | Debe enlazar a futuras guías de soporte L1/L2.         |
| `docs/development/local-testing-workflow.md`                | Validar código antes de push                       | Añadir sección para pruebas E2E cuando se automaticen. |
| `docs/operations/production/DEPLOYMENT_CHECKLIST.md`        | Checklist previo a Go-Live                         | Integrar campos para evidencias (links a dashboards).  |
| `docs/operations/production/DEPLOYMENT_SETUP.md`            | Cargar secretos y tokens                           | Añadir ejemplos de rotación automatizada.              |
| `docs/operations/production/PRODUCTION_DEPLOYMENT_GUIDE.md` | Procedimiento completo de despliegue               | Revisar contra nuevos pipelines CI/CD.                 |
| `docs/operations/production/RAILWAY_FIX.md`                 | Corregir configuración Railway                     | Evaluar migración a guía general de plataformas.       |
| `docs/for-developers/tutorials/cleanscore-tutorial.md`      | Publicar informes CleanScore™                     | Añadir sección específica para operadores de campo.    |
| `docs/for-developers/tutorials/concierge-ai-tutorial.md`    | Gestionar solicitudes recurrentes con Concierge AI | Documentar escenarios de escalamiento a humanos.       |

## Referencias

| Documento                                                   | Contenido                               | Observaciones                                                 |
| ----------------------------------------------------------- | --------------------------------------- | ------------------------------------------------------------- |
| `docs/for-developers/api-reference.md`                      | Endpoints API y ejemplos                | Añadir contrato OpenAPI exportable.                           |
| `docs/for-developers/environment-variables.md`              | Variables por entorno                   | Mantener sincronizado con Terraform/secretos.                 |
| `docs/for-developers/architecture.md`                       | Vistas de alto nivel y modelos de datos | Agregar enlaces a diagramas actualizados automáticamente.     |
| `docs/for-developers/deployment.md`                         | Estrategias de despliegue               | Incluir sección de versionado de documentación (mike).        |
| `docs/reference/`                                           | Plantillas y fuentes                    | Revisar permisos y licencias al importar materiales externos. |
| `docs/operations/production/PRODUCTION_READINESS_REPORT.md` | Estado del proyecto para auditorías     | Añadir métricas medibles (MTTR, error budget).                |
| `docs/operations/production/PRODUCTION_AUDIT_REPORT.md`     | Informe ejecutivo de auditoría          | Sincronizar con KPIs de negocio.                              |
| `docs/operations/production/PRODUCTION_DEPLOYMENT_GUIDE.md` | Guía completa de despliegue             | Duplicado parcial con how-to: mantener secciones de contexto. |

## Explicaciones (contexto y visión)

| Documento                                         | Tema                    | Observaciones                                             |
| ------------------------------------------------- | ----------------------- | --------------------------------------------------------- |
| `docs/for-business/vision-strategy.md`            | Visión y estrategia     | Actualizar OKRs al inicio de cada trimestre.              |
| `docs/for-business/roadmap.md`                    | Roadmap trimestral      | Enlazar con Jira/Linear para visibilidad.                 |
| `docs/for-business/tech-stack.md`                 | Stack tecnológico       | Documentar decisiones de vendor lock-in.                  |
| `docs/for-business/ai-automation.md`              | Estrategia de IA        | Alinear con políticas de uso responsable.                 |
| `docs/for-business/market-compliance.md`          | Regulaciones y mercado  | Revisar fuentes anualmente.                               |
| `docs/for-developers/observability-phase2.md`     | Plan de observabilidad  | Migrar a sección de tutorial/how-to cuando se implemente. |
| `docs/for-developers/phase3-advanced-features.md` | Investigación fase 3    | Mantener histórico al cerrar epics.                       |
| `docs/for-developers/phase4-enterprise-grade.md`  | Hoja de ruta enterprise | Requiere dueño de producto para priorizar.                |
| `docs/guides/README.md`                           | Guías transversales     | Convertir en índice con clasificación Diátaxis.           |

## Acciones pendientes

- Completar runbooks específicos para CleanScore™ y Concierge AI si los flujos superan el estadio tutorial.
- Incorporar contratos OpenAPI y generar referencia automática.
- Consolidar guía de observabilidad en how-to una vez desplegada la fase 2.
- Definir responsables de actualización por categoría (añadir a `CONTRIBUTING.md`).
