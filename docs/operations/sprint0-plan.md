# Plan del Sprint 0

## Objetivo
Establecer fundamentos técnicos y operativos antes de desarrollar funcionalidades.

## Duración sugerida
2 semanas.

## Hitos
1. **Repos & CI/CD**
   - Configurar monorepo pnpm (apps/web, apps/api) con scripts compartidos.
   - Integrar GitHub Actions (`ci-lint`, `ci-test`, `ci-e2e`) + deploy manual a staging.
2. **Infraestructura**
   - Crear cuentas cloud (Vercel/Fly.io/AWS/GCP) y Terraform inicial.
   - Provisionar bases de datos (Postgres), Redis, storage S3.
   - Configurar Event Mesh (Redpanda/Kafka) + Temporal cluster (managed o self-hosted).
3. **Integraciones sandbox**
   - Stripe test mode, Twilio trial, Google Maps, QuickBooks sandbox, DocuSign dev.
   - Comprobar webhooks via ingestors edge.
4. **Seguridad & observabilidad**
   - Secret management (1Password, AWS Secrets Manager).
   - OpenTelemetry base (traces/logs), dashboards iniciales.
   - Configurar passkeys con Auth provider.
5. **Datos & IA**
   - Ingesta de datos demo, crear Lakehouse base.
   - Pipeline MLOps skeleton (repos, MLflow/Weights & Biases).
   - Generar primeras model cards (Concierge MVP, CleanScore v0.1).
6. **Design & UX**
   - Integrar Figma con repos (Design Tokens -> Tailwind).
   - Establecer versión 1 de componentes shadcn adaptados.

## Entregables
- Infra reproducible (Terraform) y CI/CD en funcionamiento.
- Documentación técnica en `docs/04-arquitectura-y-stack.md` actualizada con decisiones finales.
- Tablero de tracking (Jira/Linear) con historias priorizadas.
- Secrets en 1Password/Secrets Manager con checklist actualizado.
- Integraciones sandbox con evidencia (Postman, logs test).

### Cronograma sugerido (semana 1-4)
| Semana | Tarea clave | Responsable |
|--------|------------|-------------|
| W1 | Crear monorepo + pipelines lint/test | Tech Lead / DevOps |
| W1-W2 | Configurar infra staging (Vercel/Fly, Terraform base) | DevOps |
| W2 | Activar sandbox Stripe/Twilio/Auth0 + guardar secrets | Backend Lead |
| W2-W3 | Ingesta datos demo + Lakehouse inicial | Data Lead |
| W3 | Configurar observabilidad (OTel → Grafana/Datadog) | Ops/DevOps |
| W3-W4 | Emitir primeras model cards y pruebas IA | AI Lead |
| W4 | Revisión de Sprint 0 + go/no-go MVP | Leadership (PO, Tech Lead, Ops) |

## Roles
- Tech Lead (coordinación).
- DevOps/Infra.
- Backend/Frontend leads.
- MLOps engineer.

## Checklist Sprint 0
Ver `docs/operations/checklists/sprint0-checklist.md`.
