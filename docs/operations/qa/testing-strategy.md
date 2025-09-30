# Estrategia de QA & Testing

## Objetivo
Garantizar calidad funcional, seguridad y experiencia IA antes de releases.

## Tipos de pruebas
1. **Unitarias** (frontend, backend, mobile) – Vitest + Testing Library; coverage ≥80 % en dominios críticos.
2. **Integración/API** – contract testing (Pactflow), Postman/Newman colecciones sandbox.
3. **E2E** – Playwright (desktop/mobile) + smoke diaria; escenarios booking, CleanScore™, rework, pagos.
4. **Testing IA** – validación prompts (LangSmith/OpenAI evals), fairness, toxicidad, hallucination score.
5. **Performance/Resiliencia** – k6, Artillery, Chaos testing (Gremlin) sobre Temporal/Event Mesh.
6. **Security** – SAST/DAST (Semgrep, Dependabot, OWASP Zap), pentesting, escaneos secretos.
7. **UX/Accesibilidad** – Lighthouse, axe-core integrado en Playwright, validaciones manuales (screen readers, contraste).

## Proceso release
- Branch → PR → CI (Turborepo: lint → unitarias → integración → build).
- Stage env: deploy automático a Vercel/Fly (preview) + suite E2E/IA gating + QA manual.
- Gate de aprobación (PO + QA lead + AI Lead para features IA).
- Deploy a prod con feature flags (LaunchDarkly) y monitoreo Sentry + Grafana.

## Herramientas CI/CD
- GitHub Actions / CircleCI con matrices Node 24 + Bun 1.2.
- Codecov / SonarQube / Sentry Quality Gate.
- Reportes centralizados en Slack/Teams, dashboards Grafana/Looker.
- BrowserStack para cross-device.

## IA Testing specifics
- Conjunto de prompts test (ES/EN/Spanglish) + escenarios adversos.
- Evaluaciones semiautomáticas (LangSmith, OpenAI evals, Trulens) y fairness dashboards.
- Revisión humana para contenido crítico y auditoría mensual Comité IA.

## Documentación
- Test plan por feature.
- Matriz de pruebas (casos, estado, resultados).
- Reporte post release.

## Roles
- QA Lead.
- Automation engineer.
- AI QA specialist.
- Support devs (shift-left testing) y Ops para pruebas de campo.


## Accesibilidad
- Validar WCAG 2.2 AA (Lighthouse, axe, testing manual).
- Tests automáticos integrados con Playwright + axe para flujos principales.
- Revisiones manuales cada release mayor (navegación teclado, screen readers).
