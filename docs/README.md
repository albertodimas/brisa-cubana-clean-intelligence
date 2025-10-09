# Brisa Cubana Clean Intelligence – Documentation

Este directorio contiene la documentación verificada del proyecto. Usa la siguiente tabla de navegación para acceder a cada sección.

## Documentación Principal

| Documento                                        | Descripción                                                                  |
| ------------------------------------------------ | ---------------------------------------------------------------------------- |
| [`quickstart.md`](./quickstart.md)               | Guía para levantar el entorno local (Docker + pnpm + Prisma).                |
| [`status.md`](./status.md)                       | Estado funcional, arquitectura, APIs, operaciones y próximos pasos.          |
| [`API_DOCUMENTATION.md`](./API_DOCUMENTATION.md) | Documentación OpenAPI/Swagger con Scalar, ejemplos y generación de clientes. |
| [`openapi.yaml`](./openapi.yaml)                 | Especificación OpenAPI 3.1 para integraciones externas.                      |

## Seguridad y Operaciones

| Documento                                              | Descripción                                                             |
| ------------------------------------------------------ | ----------------------------------------------------------------------- |
| [`SECURITY.md`](./SECURITY.md)                         | Guía de seguridad: manejo de credenciales, secrets y mejores prácticas. |
| [`BACKUP_RECOVERY.md`](./BACKUP_RECOVERY.md)           | Estrategias de backup, recuperación y procedimientos de emergencia.     |
| [`REGRESSION_CHECKLIST.md`](./REGRESSION_CHECKLIST.md) | Checklist de verificación antes de cada deployment.                     |

## Observabilidad y Monitoreo

| Documento                                            | Descripción                                                         |
| ---------------------------------------------------- | ------------------------------------------------------------------- |
| [`SENTRY.md`](./SENTRY.md)                           | Integración de Sentry: error tracking, performance y monitoring.    |
| [`OBSERVABILITY.md`](./OBSERVABILITY.md)             | Logging estructurado, métricas, alertas y runbooks de incidentes.   |
| [`ALERTS.md`](./ALERTS.md)                           | Estrategia de alertas operacionales: Sentry, Slack, email, runbook. |
| [`PERFORMANCE_BUDGETS.md`](./PERFORMANCE_BUDGETS.md) | Presupuestos de rendimiento: Core Web Vitals, API, bundle, DB.      |

## Testing y CI/CD

| Documento                              | Descripción                                                                      |
| -------------------------------------- | -------------------------------------------------------------------------------- |
| [`E2E_STRATEGY.md`](./E2E_STRATEGY.md) | Estrategia E2E piramidal (smoke/critical/full), configuración y workflows CI/CD. |

## Features y Gestión

| Documento                                    | Descripción                                                                    |
| -------------------------------------------- | ------------------------------------------------------------------------------ |
| [`USER_MANAGEMENT.md`](./USER_MANAGEMENT.md) | Panel de administración de usuarios: CRUD, roles, seguridad y testing (9 Oct). |

---

> **Nota:** Todos los documentos reflejan únicamente funcionalidades implementadas y probadas en `main`. Cualquier contribución nueva debe actualizar esta documentación.
