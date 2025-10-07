# Estrategia de QA & Testing

## Objetivo

Garantizar calidad funcional, seguridad y experiencia IA antes de releases.

## Alcance actual (2025 Q3)

1. **Unitarias backend** – Vitest (Hono + Prisma) con mocks, validaciones Zod, escenarios JWT/RBAC y coverage V8 (Codecov).
2. **Unitarias frontend** – Vitest + Testing Library (design system) con jsdom y thresholds ≥80 %.
3. **Smoke E2E** – Playwright 1.56 (Chromium) validando la landing (`pnpm test:e2e`, reporte HTML + trazas on-first-retry).
4. **Calidad editorial** – Husky + lint-staged (ESLint, Prettier, markdownlint, cspell) obligatorios en cada commit.
5. **CI** – GitHub Actions (lint → typecheck → test con PostgreSQL 17 → build) + subida automática de coverage.

## Roadmap inmediato (Sprint 0)

1. **Integración/API** – Pactflow + Postman collections sandbox (Stripe) ejecutados nightly; Twilio se mantiene en backlog (`ENG-143`).
2. **E2E web** – Extender Playwright a booking, CleanScore, contacto en PR + regresión semanal (multi-device) — pendiente.
3. **Testing IA** – LangSmith/OpenAI evals, fairness dashboards y handoff obligatorio en <25 % — pendiente.
4. **Performance/Resiliencia** – k6 + Gremlin sobre Temporal/Redis cuando estén activos (roadmap AD-13).
5. **Security** – Semgrep, Dependabot, escaneo secretos y pentest anual — planificado.
6. **UX/Accesibilidad** – Lighthouse + axe-core automatizados, auditoría manual WCAG 2.2 AA por release mayor — pendiente de implementación.

## Proceso release (objetivo)

- Branch → PR → CI (lint → unitarias → build).
- Deploy preview (Vercel/Fly) + suite E2E/IA y QA manual.
- Gate de aprobación (PO + QA Lead + AI Lead para features IA).
- Deploy producción con feature flags (LaunchDarkly) + monitoreo Sentry/Grafana.

## Documentación y roles

- Test plan por feature + matriz de casos.
- Reportes post-release y seguimiento en decision log.
- Roles: QA Lead, automation engineer, AI QA specialist, soporte Ops/Dev para pruebas de campo.
