# 07 · Roadmap y Operaciones

## Roadmap resumido

1. **Descubrimiento (0-1 mes)**
   - Entrevistas (residencial, property managers, hospitality).
   - Data map, políticas privacidad, consentimiento.
   - Prototipos Figma (web, portal, panel, app staff).
   - Infra decisions + IaC base.
2. **MVP (0-3 meses)**
   - Concierge IA, booking omnicanal, pagos, scheduling, panel admin, app staff mínima, CleanScore beta.
   - Integraciones Stripe operativas; Twilio/WhatsApp, Google Maps, QuickBooks, DocuSign y LaunchDarkly **en roadmap** (tickets `ENG-143`, `ENG-144`).
   - Observabilidad inicial con Sentry lista; Grafana/OTel en roadmap.
3. **Expansión (3-6 meses)**
   - Marketing autopilot, reputación IA, pricing dinámico, digital twin operativo.
   - Marketplace de partners, knowledge graph, dashboard OKR, reporting ESG.
   - Integraciones PMS prioritarias (Hostaway, Guesty, Mews) y AppFolio.
4. **Innovación (6-12 meses)**
   - Tours 3D/WebXR, portal B2B avanzado, digital twin financiero completo.
   - Voice-first extendido (staff + clientes), automatización financiera y robots colaborativos.
   - Programa de aliados (lavandería, mantenimiento, wellness) con comisiones y APIs públicas.
5. **Escalamiento (12+ meses)**
   - Internacionalización (idioma, moneda, impuestos), verticales regulados.
   - Developer portal, SDKs, monitoreo multi-región, cumplimiento ESG y auditorías IA.

### Hitos y métricas

| Periodo        | Entregable                                                            | Criterio de éxito                                                                  |
| -------------- | --------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| W4 (Oct 2025)  | MVP booking + panel admin en staging                                  | 10 reservas internas completadas; bugs críticos ≤2                                 |
| W8 (Nov 2025)  | Pilot beta con 5 clientes residenciales                               | NPS ≥ 40, CleanScore publicado en 100 % de servicios                               |
| W12 (Dic 2025) | Integraciones Stripe en sandbox + plan Twilio/QuickBooks/LaunchDarkly | Stripe end-to-end probado; planes documentados para Twilio/QuickBooks/LaunchDarkly |
| W16 (Ene 2026) | Sprint PMS Hostaway + Guesty                                          | 3 property managers conectados, automatización turnos 90 %                         |
| W20 (Feb 2026) | CleanScore™ v1.1 + reporting ESG beta                                | CleanScore < 10 min post-servicio, dashboards ESG piloto                           |
| W24 (Mar 2026) | Revisión roadmap + decisión escalamiento                              | ARR objetivo ≥ USD 30 K run-rate, churn beta <8 %                                  |

## Operación (SOP)

- **Cuadrillas**: onboarding digital, checklists IA, monitoreo CleanScore, programa bienestar.
- **Rework**: se dispara automáticamente; se asigna nueva visita; reporte al cliente.
- **Inventario**: pronóstico consumo, pedidos automáticos, auditorías mensuales.
- **Soporte**: bot IA (primer nivel), escalamiento a humano con SLA 2h.
- **Seguridad**: auditoría trimestral, review incidentes, tabletop exercises con huracán + ciberseguridad.

### RACI (extracto)

| Stream                    | R            | A                | C                    | I                |
| ------------------------- | ------------ | ---------------- | -------------------- | ---------------- |
| Sprint 0 (infra + CI/CD)  | DevOps Lead  | Tech Lead        | Backend Lead, SecOps | PO, Ops          |
| CleanScore IA             | AI Lead      | PO               | QA Lead, Ops Lead    | Legal, Marketing |
| Customer Support playbook | Ops Lead     | CS Manager       | Product, Marketing   | AI Lead          |
| Integraciones financieras | Backend Lead | CFO/Finance Lead | QuickBooks SME       | PO, AI Lead      |
| Data & Analytics          | Data Lead    | Tech Lead        | AI Lead, Finance     | Ops              |

## Plan financiero (resumen)

- CAPEX inicial: desarrollo MVP, branding, licencias, marketing piloto.
- OPEX: nómina, SaaS (Stripe fees, Twilio, QuickBooks), seguros, marketing.
- Escenarios (base/optimista/pesimista) con proyecciones 24 meses (disponibles en hoja financiera).

## KPIs críticos

- Reservas completadas / mes.
- NPS y CleanScore promedio.
- SLA puntualidad y rework.
- Margen neto por servicio.
- LTV/CAC y payback clientes.
- Engagement app staff, rotación.

## Plan de riesgos

| Riesgo                        | Mitigación                                            |
| ----------------------------- | ----------------------------------------------------- |
| Fallo IA / mala recomendación | Guardrails, revisión humana, disclosure.              |
| Brecha privacidad             | Cipher data, auditoría regular, respuesta incidentes. |
| Dependencia proveedores       | Redundancia, contratos, monitors.                     |
| Eventos climáticos            | Plan contingencia, backup crews, communication kit.   |
| Competencia precios bajos     | Diferenciar valor, bundles, fidelización.             |

## Cultura

- Retrospectivas constantes, aprendizaje continuo.
- Transparencia con clientes y staff.
- Enfoque en bienestar, desarrollo profesional, reconocimiento.

## Soporte pre-lanzamiento

- **Canales**: Intercom (chat web), WhatsApp business, email soporte@brisacubanaclean.com.
- **Horario beta**: 8 am–8 pm ET (staff mixto Ops + CS); fuera de horario → auto-respuesta + escalamiento PagerDuty al Ops Lead.
- **Playbooks**: onboarding beta, gestión de incidentes, rework priority; alojados en `operations/support/support-playbook.md`.
- **Feedback loop**: tickets etiquetados → dashboard semanal → backlog grooming con PO/Tech Lead.

## Plan Sprint 0 (extracto)

- **Repos & CI/CD** (Tech Lead / DevOps): monorepo pnpm + Turborepo, pipelines lint/test/build con caches y deploy manual a staging.
- **Infra básica** (DevOps): elegir host (Vercel/Fly/Railway), definir IaC inicial (**roadmap**, sin `infra/terraform` aún), centralizar secrets en 1Password/AWS Secrets.
- **Integraciones sandbox** (Backend Lead): Stripe/Twilio/Auth0 listos con cuentas test + Postman collection.
- **Data/ML setup** (AI Lead): repositorio notebooks, MLflow/W&B espacio, primeras model cards (concierge, CleanScore).
- **Observabilidad** (Ops/DevOps): Sentry front/back ya operando; OTel + panel Grafana/Datadog en roadmap.

## Vigilancia regulatoria y tecnológica

- Revisar mensualmente actualizaciones de la Florida Digital Bill of Rights, FTC y AI Safety Institute; registrar hallazgos en `docs/02-mercado-y-compliance.md`.
- Auditar trimestralmente requisitos OSHA/NIOSH relacionados con productos químicos y seguridad del staff.
- Actualizar el stack tecnológico contra releases LTS (Node/Bun, Temporal, Redis, LangChain) y documentar decisiones en el `Decision Log`.
- Mantener tablero Kanban con owners (Legal, Tech Lead, AI Lead) y fechas objetivo para cada seguimiento.
