{
"items": [
{
"id": "prod-readiness",
"title": "Plan de trabajo",
"sections": [
{
"title": "Observabilidad y performance",
"tasks": [
"Monitorear advertencia `legacy-javascript` (ver docs/tech-debt/legacy-chunk-885.md) y probar upgrade de Next.js en cuanto haya release estable.",
"Conectar alertas Slack/PostHog una vez que se definan `SLACK_WEBHOOK_URL` y las claves PostHog definitivas.",
"Publicar dashboard PostHog con KPIs consolidados y enlazarlo en docs/product/analytics-decision.md."
]
},
{
"title": "CI/CD y seguridad",
"tasks": [
"Reactivar Dependabot (o rama manual) para actualizar dependencias una vez estabilizados los despliegues.",
"Automatizar validación de robots.txt & sitemap en CI (curl) usando scripts/verify-lhci-warnings.sh.",
"Revisar secrets pendientes / eliminar los que ya no se usen (ej. tokens temporales)."
]
},
{
"title": "Experiencia de usuario",
"tasks": [
"Completar QA manual de portal y checkout (docs/qa/regression-checklist.md) tras cambios de analytics.",
"Reemplazar placeholders visuales de la landing con assets finales (ver docs/marketing/visual-assets-checklist.md).",
"Planificar optimización del chunk 885 o levantar issue para migración a runtime moderno."
]
},
{
"title": "Documentación",
"tasks": [
"Asignar responsables en docs/operations/incident-runbook.md cuando se definan guardias.",
"Mantener docs/overview/status.md y docs/marketing/landing-copy-2025-10-19.md sincronizados con métricas reales.",
"Depurar documentación redundante conforme se publiquen los dashboards (PostHog/Sentry)."
]
}
]
}
]
}
