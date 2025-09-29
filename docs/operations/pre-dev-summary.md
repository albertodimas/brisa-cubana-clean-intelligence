# Resumen antes del desarrollo

> Para oportunidades y proyecciones de expansión, consulta el `pre-dev-summary-executive.md` complementario.

Para iniciar el desarrollo sin ambigüedades, verifica que cada punto esté completado:

## 1. Marca & dominios
- [ ] Dominios registrados (`brisacubanaclean.com`, etc.) y DNS configurado — Responsable: Ops Lead — ETA: Sprint 0.
- [ ] Usuarios de redes sociales asegurados y activos — Responsable: Marketing Lead — ETA: Sprint 0.
- [ ] Manual de marca (logo final, paleta, tipografía) aprobado — Responsable: Brand/Design Lead — ETA: Sprint 0.

## 2. Research & validación
- [ ] Entrevistas completadas según plan (`docs/operations/interview-plan.md`) — Responsable: Product Owner — ETA: antes W4.
- [ ] Insight matrix documentada, backlog MVP ajustado — Responsable: Product Owner + Research — ETA: antes W4.

## 3. Operación legal & compliance
- [ ] LLC Florida + EIN obtenidos — Responsable: Legal/Ops — ETA: Sprint 0.
- [ ] Licencias LBT condado/municipio y certificados necesarios — Responsable: Legal/Ops — ETA: Post-MVP.<br>
- [ ] Workers’ comp, liability insurance, bonding vigentes — Responsable: Ops Lead — ETA: Pre-piloto.
- [ ] Política de privacidad revisada por legal — Responsable: Legal Counsel — ETA: antes W8.

## 4. Preparación técnica
- [ ] Kickoff Sprint 0 agendado con responsables (ver `docs/operations/sprint0-plan.md`) — Responsable: Tech Lead — ETA: inmediato.
- [ ] Repositorios creados (monorepo pnpm) y CI/CD (`ci-lint`, `ci-test`, `ci-e2e`, deploy staging) configurado — Responsable: DevOps/Tech Lead — ETA: W1.
- [ ] Infraestructura (Terraform, cloud accounts) lista para aprovisionar — Responsable: DevOps — ETA: W2.
- [ ] Integraciones sandbox aprobadas (Stripe, Twilio, Maps, QuickBooks, DocuSign) — Responsable: Backend Lead — ETA: W2.

## 5. IA & datos
- [ ] Comité IA constituido y cronograma de reuniones — Responsable: AI Lead + PO — ETA: inmediato.
- [ ] Guardrails y procesos de audit definidos — Responsable: AI Lead + Legal — ETA: W4.
- [ ] Lakehouse / pipelines listos para datos piloto — Responsable: Data Lead — ETA: W8.
- [ ] Model cards iniciales (`docs/ai/model-cards/`) completadas — Responsable: AI Lead — ETA: W6.

## 6. SOPs & training
- [ ] Onboarding staff planificado, materiales disponibles — Responsable: Ops Lead — ETA: pre-piloto.
- [ ] SOP de inventario y emergencias comunicados — Responsable: Ops Lead — ETA: pre-piloto.
- [ ] Programa de incentivos/gamificación alineado a CleanScore — Responsable: Ops + HR — ETA: post-MVP.

## 7. Marketing & GTM
- [ ] Plan GTM aprobado con calendario y presupuesto — Responsable: Marketing Lead — ETA: W6.
- [ ] Contenido y assets iniciales preparados — Responsable: Marketing/Design — ETA: W6.
- [ ] CRM/email flujo base configurado — Responsable: Marketing Ops — ETA: W8.

## 8. Finanzas & métricas
- [ ] Modelo financiero 24 meses completado con escenarios — Responsable: Finance Lead — ETA: W6.
- [ ] OKR cargados en herramienta de gestión — Responsable: Product Owner — ETA: W4.
- [ ] Dashboards de métricas (operativas/financieras) configurados — Responsable: Data Lead + Ops — ETA: W10.

## 9. Documentación & comunicación
- [x] MkDocs actualizado (`mkdocs build --strict` sin warnings).
- [ ] README/handbook distribuidos al equipo — Responsable: Product Owner — ETA: inmediato.
- [ ] Canal de comunicación (Slack/Teams) con manual del proyecto — Responsable: Ops Lead — ETA: inmediato.

Checklist final antes del Sprint 0: todo en verde. Si algún ítem falta, resolverlo previo al desarrollo para evitar retrabajo.
