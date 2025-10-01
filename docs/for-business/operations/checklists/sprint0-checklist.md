# Checklist Sprint 0

## Repos & CI/CD

- [x] Crear repositorios (frontend, backend, ui) en monorepo pnpm.
- [x] Configurar GitHub Actions (lint/test/build/e2e) — ver `.github/workflows/`.
- [ ] Añadir code owners y flujos de revisión (pendiente roadmap).

## Infra

- [ ] Provisionar cuentas cloud necesarias.
- [ ] Ejecutar Terraform inicial (VPC, DB, Redis, storage) — **roadmap** (sin `infra/terraform`).
- [ ] Desplegar Event Mesh y Temporal (evaluación abierta, sin implementación actual).

## Integraciones

- [x] Stripe (keys test, webhooks, reconciliación).
- [ ] Twilio/WhatsApp (verificación número, sandbox) — roadmap.
- [ ] Google Maps (API key, quotas) — roadmap.
- [ ] QuickBooks sandbox — roadmap.
- [ ] DocuSign developer account — roadmap.

## Seguridad

- [ ] Configurar secret management.
- [ ] Passkeys/web auth provider.
- [ ] Políticas IAM y auditoría.

## Observabilidad

- [x] Sentry front/back configurado.
- [ ] OTel instrumentation base — roadmap.
- [ ] Dashboards (Grafana) y alertas iniciales — roadmap.

## Datos & IA

- [ ] Lakehouse/lake config (DuckDB/MotherDuck/Snowflake) — pendiente.
- [ ] MLflow/W&B workspace — pendiente.
- [ ] Feature Store (Feast) skeleton — pendiente.

## Diseño

- [ ] Exportar tokens de diseño a Tailwind.
- [ ] Prototipos Figma aprobados.
- [ ] Documentar componentes en Storybook/Playroom (opcional).
