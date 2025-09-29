# Estrategia de QA & Testing

## Objetivo
Garantizar calidad funcional, seguridad y experiencia IA antes de releases.

## Tipos de pruebas
1. **Unitarias** (frontend, backend, mobile) – Vitest/Jest.
2. **Integración/API** – pruebas contractuales (Pact), Postman/Newman.
3. **E2E** – Playwright/Cypress, escenarios críticos (booking, CleanScore).
4. **Testing IA** – validación de prompts, respuestas, fairness, alucinaciones.
5. **Performance** – k6, carga/latencia en API (scenarios peak demanda).
6. **Security** – SAST/DAST (Dependabot, Semgrep, OWASP Zap), pentesting.
7. **UX/Accesibilidad** – Lighthouse, tests manuales, screen readers.

## Proceso release
- Branch → PR → CI (lint, unit, integration).
- Stage env: E2E automáticos + QA manual (checklist).
- Gate de aprobación (PO + QA lead).
- Deploy a prod con feature flags.

## Herramientas CI/CD
- GitHub Actions / CircleCI.
- Codecov / SonarQube.
- Reports centralizados en Slack/Teams.

## IA Testing specifics
- Conjunto de prompts test (bilingüe, edge cases).
- Evaluaciones semiautomáticas (LangSmith/OpenAI evals).
- Revisión humana para contenido crítico.

## Documentación
- Test plan por feature.
- Matriz de pruebas (casos, estado, resultados).
- Reporte post release.

## Roles
- QA Lead.
- Automation engineer.
- Support from devs (shift-left testing).


## Accesibilidad
- Validar WCAG 2.2 AA (Lighthouse, axe, testing manual).
- Tests automáticos integrados con Playwright + axe para flujos principales.
- Revisiones manuales cada release mayor (navegación teclado, screen readers).
