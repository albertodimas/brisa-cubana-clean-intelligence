{
"items": [
{
"id": "prod-readiness",
"title": "Plan de trabajo",
"sections": [
{
"title": "Observabilidad y performance",
"tasks": [
"Monitorear advertencia `legacy-javascript` (ver docs/tech-debt/legacy-chunk-885.md); probar upgrade de Next.js cuando haya release que elimine el chunk 885.",
"Completar integración Slack (Incoming Webhook) y conectar alertas de Sentry/PostHog.",
"Publicar dashboard PostHog con KPIs y enlazarlo en docs/product/analytics-decision.md."
]
},
{
"title": "CI/CD y seguridad",
"tasks": [
"Crear alerta en GitHub Actions/Nightly para fallos recurrentes de Lighthouse budgets.",
"Automatizar validación de robots.txt & sitemap en CI (curl) para evitar regresiones (en progreso con scripts/verify-lhci-warnings.sh)."
]
},
{
"title": "Experiencia de usuario",
"tasks": [
"Optimizar chunk 885 (revisar bundling de Next runtime, tree-shake libs) o abrir issue para actualización a runtime moderno.",
"Cross-check flujos Portal/Checkout con QA manual guiado (docs/qa/regression-checklist.md) tras la migración analytics."
]
},
{
"title": "Documentación",
"tasks": [
"Registrar playbook de incidentes (quién, qué y cómo escalar) en docs/operations/observability-setup.md / docs/operations/alerts.md.",
"Mantener TEAM_HANDOFF.md y OBSERVABILITY_QUICKSTART.md actualizados tras enlazar Slack y dashboard."
]
}
]
}
]
}
