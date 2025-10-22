{
"items": [
{
"id": "prod-readiness",
"title": "Plan de trabajo",
"sections": [
{
"title": "Observabilidad y performance",
"tasks": [
"Sanear advertencias Lighthouse (legacy-js chunk 885, render-blocking) documentando o creando issue de seguimiento con Next.js.",
"Instrumentar alertas PostHog (dashboard funnel-fase2 + webhook Slack) según docs/product/analytics-decision.md."
]
},
{
"title": "CI/CD y seguridad",
"tasks": [
"Crear alerta en GitHub Actions/Nightly para fallos recurrentes de Lighthouse budgets.",
"\u00bfAutomatizar validaci\u00f3n de robots.txt & sitemap en CI (curl) para evitar regresiones."
]
},
{
"title": "Experiencia de usuario",
"tasks": [
"Optimizar chunk 885 (revisar bundling de Next runtime, tree-shake libs) o abrir issue para actualizaci\u00f3n a runtime moderno.",
"Cross-check flujos Portal/Checkout con QA manual guiado (docs/qa/regression-checklist.md) tras la migraci\u00f3n analytics."
]
},
{
"title": "Documentaci\u00f3n",
"tasks": [
"Actualizar docs/operations/observability.md con el flujo de bypass `/?lhci=1` y nueva ruta `robots.ts`.",
"Agregar resumen del nuevo pipeline Lighthouse en CHANGELOG.md (pr\u00f3ximo release)."
]
}
]
}
]
}
