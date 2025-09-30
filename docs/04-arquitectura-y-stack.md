# 04 · Arquitectura y Stack

## Principios

- **Event-driven**: ingestión via Event Mesh (Redpanda/Kafka/NATS) + workflows Temporal.
- **Serverless/edge**: listeners en Cloudflare Workers o similar antes de entrar al bus.
- **Seguridad zero-trust**: passkeys/WebAuthn, roles mínimos, secrets en vault.
- **Observabilidad by design**: OpenTelemetry, dashboards, alertas IA Ops.

## Stack principal (Sep 2025)

| Capa           | Tecnología                                                                           |
| -------------- | ------------------------------------------------------------------------------------ |
| Runtime        | **Node 24.9.0** (nvm) + Bun 1.2.23 para pruebas cruzadas                             |
| Web            | Next.js 15.5.4 (App Router + Turbopack), React 19.1.1, Tailwind CSS 4                |
| Mobile         | Expo 54, React Native 0.81, Expo Router 6 _(roadmap)_                                |
| Backend        | Hono 4.9.9 (Node) + Prisma 6 + Zod 3 (API REST @brisa/api)                           |
| Datos          | PostgreSQL 17 (Docker Compose); Redis 8 planificado para próximas iteraciones        |
| IA             | LangChain 0.3.35, OpenAI/Anthropic _(experimentos documentados)_                     |
| Auth           | Auth.js v5 (DAL + cookies HttpOnly) + JWT firmado para API externa                   |
| Observabilidad | Sentry en producción · OTel + Grafana/Prometheus en roadmap                          |
| Infra          | Deploy local con Docker Compose · Terraform/Pulumi y Vercel/Fly.io/AWS en evaluación |

> Nota: componentes como Redis gestionado, Event Mesh (Redpanda/NATS) y Temporal están en evaluación. No existe aún implementación ni IaC asociada; su seguimiento se documenta en `docs/07-roadmap-y-operaciones.md` y cualquier decisión se registrará en el Decision Log.

> Compatibilidad runtime: mantener scripts `bun test` + `pnpm vitest` (Node 24) para validar fallback LTS (ver ADR-06).

## Módulos actuales

1. **API REST @brisa/api**: Hono + Prisma + Zod, seeds iniciales, JWT y middleware RBAC.
2. **Landing @brisa/web**: Next.js 15 + framer-motion, UI moderna con componentes `@brisa/ui`.
3. **Dashboard @brisa/web**: Panel autenticado que consume `/api/bookings/mine`, crea reservas y ofrece vista de auditoría (`/dashboard/auditoria`).
4. **Design system @brisa/ui**: tokens y componentes React empaquetados con tsup y testes jsdom.
5. **Documentación operacional**: MkDocs Material con blueprint técnico, QA, políticas y roadmap.
6. **CI/CD**: GitHub Actions (lint, typecheck, tests, build, e2e) + Codecov.
7. **Testing E2E**: Playwright 1.55.1 listo para smoke suite (`pnpm test:e2e`).

## Roadmap arquitectónico

1. **Event Mesh** (Redpanda/NATS) para orquestación en tiempo real (Stripe, Twilio, PMS).
2. **Workflows Temporal** para scheduling automático, rework y billing.
3. **Digital Twin** operativo-financiero con simulaciones de rutas.
4. **Portal mobile/voice-first** (Expo) y app staff offline.
5. **Data Lake + Vector DB** consolidados para CleanScore™ y analítica avanzada.

## Diagramas de referencia

- **C4 Nivel 1 (contexto)**: ver `resources/architecture/c4-context-2025Q4.md` (clientes, staff, integraciones). Responsable: Tech Lead.
- **C4 Nivel 2 (contenedores)**: ver `resources/architecture/c4-containers-2025Q4.md` (Gateway, servicios Bun, Temporal, data). Exportar también `.png` + `.dsl` en cada release.
- **Flujos clave**:
  - Booking → Temporal Workflow → Assign Crew → Notify (`resources/architecture/booking-flow-r1.md`).
  - CleanScore pipeline → almacenamiento → publicación (`resources/architecture/cleanscore-sequence.md`).
  - Panel cliente → rework → soporte (`resources/architecture/panel-cliente-r2.md`).
    > Cada release mayor debe actualizar los diagramas; mantener changelog técnico asociado.

## Integraciones (MVP)

- Stripe (pagos, facturación) — Checkout + webhook operativos.
- Twilio/WhatsApp (comms) — **roadmap**, sin implementación en código.
- Google Maps (routing, geocoding) — **roadmap**.
- QuickBooks Online (contabilidad) — **roadmap**.
- DocuSign (contratos) — **roadmap**.
- Auth provider (Clerk/Auth0) con passkeys — **roadmap**.

## Seguridad y cumplimiento

- Validaciones Zod en cada endpoint + manejo uniforme de errores.
- Estrategia passkeys/MFA, RBAC/ABAC y auditoría documentadas (implementación en roadmap inmediato).
- JWT firmado (`JWT_SECRET`) + middleware `requireAuth` para proteger rutas críticas y exponer `/api/bookings/mine`.
- Cifrado en tránsito y reposo, backups diarios y plan de recuperación.
- Escaneos SAST/DAST y Renovate planificados para pipeline.
- **Secretos**: 1Password (equipo) + AWS/GCP Secret Manager (staging/prod) con rotación 90 días.
- **Retención datos sensibles**: CleanScore media 90 días, transcripts voice 24 h (ver `docs/05-ia-y-automatizacion.md`).
- **Política de acceso**: mínimo privilegio, auditorías trimestrales, registros centralizados (SIEM/Datadog).

## CI/CD

1. `pnpm turbo run lint` (Next lint + ESLint TS, markdownlint, cspell).
2. `pnpm turbo run test` (Vitest unitario con mocks Prisma + coverage V8).
3. `pnpm turbo run build` (Next build --turbopack, tsup paquetes compartidos).
4. `pnpm test:e2e` (Playwright smoke Chromium) — se ejecuta bajo demanda.
5. Husky + lint-staged (`pnpm lint-staged`) obligatorios en cada commit.

- **Pipeline actual (GitHub Actions)**:
  - `lint`: lint general + spellcheck.
  - `typecheck`: TypeScript estricto en monorepo.
  - `test`: Vitest con PostgreSQL 17 en servicio container + Codecov.
  - `build`: Build web/api/ui y verificación de artefactos.
- **Próximos pasos**: Contract tests Stripe/Twilio, Playwright smoke, despliegue automatizado Vercel/Fly, matrices Node/Bun.

### Estrategia de testing

- **Estado actual**: Vitest en API (validaciones Prisma/Zod) y design system (Testing Library + jsdom) con cobertura reportada a Codecov.
- **Siguiente iteración**: contract testing Stripe/Twilio, fixtures para Prisma Studio y snapshot de seeds.
- **Roadmap**: Playwright smoke (landing booking), escenarios offline app staff, chaos testing Gremlin y dashboards de calidad (Datadog/Looker).

### Repositorios y scripts

- **Monorepo** con pnpm workspaces + Turborepo → carpetas `apps/web`, `apps/api`, `packages/ui`. El directorio `infra/` se planifica para IaC en siguientes iteraciones.
- Scripts recomendados en raíz (`package.json` o `Makefile`): `pnpm dev`, `pnpm build`, `pnpm test`, `pnpm typecheck`, `pnpm storybook` (cuando aplique).
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

- **Entorno local**: `docker-compose` (Postgres 17, Redis 8, MailHog) + `pnpm dev` (Turborepo) para web/api.
- **Staging** _(roadmap)_: API en Fly.io/Railway, web en Vercel; Temporal/Redis gestionados (Temporal Cloud beta opcional).
- **IaC**: Terraform mínimo (VPC, DB, secrets) en `infra/terraform`; pipelines manuales hasta consolidar.
- **Secrets**: 1Password (equipo) + AWS Secrets Manager para staging/prod, con rotación automática.
- **Observabilidad base**: Sentry listo; OTel collector -> Grafana Cloud/Datadog se mantiene en roadmap.
- **Alertas**: PagerDuty (SLA booking, errores 5xx, fallos CleanScore), integración Slack #ops.
