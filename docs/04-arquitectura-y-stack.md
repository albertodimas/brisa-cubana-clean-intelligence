# 04 · Arquitectura y Stack

## Principios
- **Event-driven**: ingestión via Event Mesh (Redpanda/Kafka/NATS) + workflows Temporal.
- **Serverless/edge**: listeners en Cloudflare Workers o similar antes de entrar al bus.
- **Seguridad zero-trust**: passkeys/WebAuthn, roles mínimos, secrets en vault.
- **Observabilidad by design**: OpenTelemetry, dashboards, alertas IA Ops.

## Stack principal (Sep 2025)
| Capa | Tecnología |
|------|------------|
| Runtime | **Bun 1.2.23** |
| Web | Remix 2.17.1, React 19.1.1, Tailwind 4 + shadcn, WebGPU |
| Mobile | Expo 54, React Native 0.81, Expo Router 6 |
| Backend | Microservicios Bun/Nest, Temporal 1.28.1, Edge functions (Cloudflare) |
| Datos | PostgreSQL + Timescale, Redis 8.2, Vector DB (Weaviate/Milvus), Feature Store (Feast) |
| IA | LangChain 0.3.27, OpenAI/Anthropic, modelos propios (Mistral fallback) |
| Observabilidad | OTel, Grafana/Prometheus, AIOps agente |
| Infra | Terraform/Pulumi, deploy en Vercel/Fly.io/AWS Fargate, storage S3 |

> Compatibilidad runtime: servicios críticos deben contar con scripts `bun test` + `node test` para validar fallback Node 20 LTS en caso de regressiones (ver ADR-06).

## Módulos principales
1. **API Gateway** (REST/GraphQL) con auth y rate limiting.
2. **Event Mesh**: ingesta de Stripe, Twilio, PMS, IoT -> temas normalizados.
3. **Workflows Temporal**: reservas, scheduling, rework, billing, compliance.
4. **AI Services**: agentes LLM,CleanScore (vision), dynamic pricing (ML), marketing autopilot.
5. **Data Lake**: raw events → ETL/ELT → Lakehouse (DuckDB/MotherDuck) → warehouse (Snowflake/BigQuery opcional).
6. **Digital Twin**: microservicio orquestando gemelo operativo + financiero.
7. **Portal**: SSR Remix + componentes RSC, streaming.
8. **Mobile**: Expo/React Native con offline-first, voice-first.

## Diagramas de referencia
- **C4 Nivel 1 (contexto)**: ver `resources/architecture/c4-context-2025Q4.md` (clientes, staff, integraciones). Responsable: Tech Lead.
- **C4 Nivel 2 (contenedores)**: ver `resources/architecture/c4-containers-2025Q4.md` (Gateway, servicios Bun, Temporal, data). Exportar también `.png` + `.dsl` en cada release.
- **Flujos clave**:
  - Booking → Temporal Workflow → Assign Crew → Notify (`resources/architecture/booking-flow-r1.md`).
  - CleanScore pipeline → almacenamiento → publicación (`resources/architecture/cleanscore-sequence.md`).
  - Panel cliente → rework → soporte (`resources/architecture/panel-cliente-r2.md`).
> Cada release mayor debe actualizar los diagramas; mantener changelog técnico asociado.

## Integraciones (MVP)
- Stripe (pagos, facturación). 
- Twilio/WhatsApp (comms). 
- Google Maps (routing, geocoding). 
- QuickBooks Online (contabilidad). 
- DocuSign (contratos). 
- Auth provider (Clerk/Auth0) con passkeys.

## Seguridad y cumplimiento
- Autenticación multifactor/passkeys, RBAC + ABAC, auditoría de eventos.
- Protección de prompts/respuestas (guardrails, logging). 
- Cifrado en tránsito y reposo, backups diarios, DR plan.
- Escaneos SAST/DAST en pipeline, dependencia con Renovate.
- **Secretos**: AWS/GCP Secret Manager (prod) + 1Password (equipos); rotación 90 días, double-control para claves IA y integraciones.
- **Retención datos sensibles**: CleanScore media 90 días (opcional extensión cliente), transcripts voice 24 h (ver `docs/05-ia-y-automatizacion.md`).
- **Política de acceso**: IAM minimum privilege, auditorías trimestrales, registros en DataDog/SIEM.

## CI/CD
1. `bun lint` (ESLint/Biome) + `bun test` (Vitest).
2. Tests e2e (Playwright) y contract tests de integraciones.
3. Build + deploy automatizado a dev/stage/prod (con approvals).
4. Feature flags (LaunchDarkly) para releases controladas.
- **Pipeline mínimo**:
  - `ci-lint`: corre lint/typecheck en cada PR.
  - `ci-test`: unitarias + contract tests (Stripe/Twilio mocks).
  - `ci-e2e`: smoke Playwright contra entorno preview.
  - `deploy-staging`: manual/auto tras merge a main (usa Vercel/Fly).
  - `deploy-prod`: require approval + tagging, notifica a Slack.
- **Herramientas**: GitHub Actions / CircleCI; usar caches pnpm/bun, matrix Node 20 + Bun.

### Estrategia de testing
- **Unitarias**: Vitest + Testing Library (front) con coverage ≥80 % en dominios críticos.
- **Contract/API**: Pactflow entre servicios y proveedores externos (Stripe, Twilio) ejecutado en CI nocturno.
- **E2E**: Playwright con suites smoke (PR) y regresión (nocturna); incluir estados offline para app staff.
- **Chaos/Resilience**: Gremlin lite en staging (fallas Redis/Event Mesh) trimestral.
- **Observabilidad de calidad**: dashboards con métricas de tests, flakiness tracking en Datadog/Looker.

### Repositorios y scripts
- **Monorepo** con pnpm workspaces (alternativa: turborepo) → carpetas `apps/web`, `apps/api`, `packages/shared`, `infra/`.
- Scripts recomendados en raíz (`package.json` o `Makefile`): `dev` (levanta web + api), `test`, `lint`, `typecheck`, `storybook` (cuando aplique).
- Estándar de commits: Conventional Commits + Husky para pre-commit (`lint-staged` con eslint/prettier).
- Plantilla de variables: `.env.example` por servicio, centralizando nombres de secrets descritos en la tabla de integraciones.

## Observabilidad avanzada
- Traces end-to-end con OTel, logs estructurados (Pino/JSON).
- Dashboard IA Ops (detección anomalías, sugerencias automáticas).
- Postmortems generados por LLM a partir de datos de incidentes.

## Escalabilidad futura
- Multi-región (Edge) para latencia baja.
- Internacionalización (monedas, impuestos) apoyado en microservicios.
- Plug-ins API para partners (developer portal, SDKs).

## Infraestructura inicial
- **Entorno local**: `docker-compose` para Postgres, Redis, Temporal dev; scripts `bun dev` para web/api.
- **Staging**: API en Fly.io/Railway, web en Vercel; Temporal/Redis gestionados (Temporal Cloud beta opcional).
- **IaC**: Terraform mínimo (VPC, DB, secrets) en `infra/terraform`; pipelines manuales hasta consolidar.
- **Secrets**: 1Password (equipo) + AWS Secrets Manager para staging/prod, con rotación automática.
- **Observabilidad base**: OTel collector -> Grafana Cloud/Datadog; dashboards: latencia API, fallas workflows, costos IA.
- **Alertas**: PagerDuty (SLA booking, errores 5xx, fallos CleanScore), integración Slack #ops.
