# Runbook Diario de Monitoreo

**Última actualización:** 19 de octubre de 2025  
**Responsables:** Operaciones · Producto · Plataforma

---

## 1. Objetivo

Asegurar que la plataforma se mantiene operativa tras el lanzamiento comercial: detección temprana de errores, salud de pipelines y visibilidad de métricas clave (ventas y autoservicio).

---

## 2. Checklist Diario (mañana ET)

1. **Alertas Sentry**
   - Panel: `https://sentry.io/organizations/brisa-cubana/issues/?query=is%3Aunresolved`
   - Confirmar que no existan alertas activas (`checkout-payment-failed`, `portal-booking-action-error`).
   - Si hay alertas nuevas, etiquetar al responsable en Slack `#alerts-operaciones` y crear ticket si procede.

2. **Log drain / Vercel**
   - Endpoint: `https://brisa-cubana-clean-intelligence.vercel.app/api/logdrain`
   - Revisa que el collector externo haya recibido eventos en las últimas 12h.
   - Ante ausencia de registros: validar que `LOG_DRAIN_VERIFICATION_CODE` coincide en Vercel y GitHub; si el drain aparece `disabled`, recrearlo siguiendo `docs/operations/deployment.md#2.2-log-drains-en-vercel`.

3. **Stripe live**
   - Dashboard Stripe → Payments → Filtrar últimas 24h.
   - Verificar al menos una transacción de prueba interna semanal; en caso contrario, planificar test manual (`stripe trigger checkout.session.completed`).

4. **CI/CD**
   - GitHub Actions → confirmar que `CI (Main Branch)`, `Nightly Full E2E Suite` y `Post-Deploy Seed` corrieron la última noche.
   - Si `PR Checks` requiere ejecución manual (smoke), dispara `Workflow dispatch` desde Actions → PR Checks → `Run workflow` (usa la rama a validar).

5. **Analytics (PostHog + Vercel)**
   - Revisar reporte provisional de `@vercel/analytics`: CTA → lead, lead → checkout, portal link verifications.
   - Revisar dashboard PostHog `https://us.posthog.com/project/brisa-cubana/dashboards/funnel-fase2` (eventos `checkout_payment_failed`, `portal.booking.action.*`).
   - Si no hay eventos recientes, ejecutar `POSTHOG_API_KEY=<clave_actual> pnpm posthog:test-event checkout_payment_failed` para validar la ingesta y las alertas.
   - Documentar variaciones relevantes en el canal `#producto`.

---

## 3. Checklist Semanal (lunes)

1. **Pipeline Nightly histórico**
   - Revisa que no existan huecos en la cron Sentry `nightly-full-e2e-suite`.
   - Descargar artefactos Playwright críticos y validar que los reportes se almacenan en Drive/SharePoint si se requiere auditoría.

2. **Backups**
   - Ejecutar `pnpm --filter @brisa/api db:seed:operativo` en staging tras `db:deploy` para mantener entornos alineados (anotar en `docs/operations/backup-log.md`).

3. **Revisión de métricas**
   - KPI acordados (conversiones, porcentaje de autoservicio).
   - Compartir resumen en `#producto` + actualizar sección 4.4 de `docs/operations/observability.md`.

---

## 4. Respuesta ante incidentes

1. Notifica en Slack `#alerts-operaciones` (menciona `@oncall-platform`).
2. Abre issue en GitHub `incident/<YYYY-MM-DD>-<slug>` con plantilla (ver `docs/operations/incident-template.md`).
3. Detén campañas pagadas si el checkout live permanece caído más de 15 minutos (Marketing contacto: marketing@brisacubanaclean.com).
4. Documenta mitigaciones y RCA dentro de 24h.

---

## 5. Recursos

- `docs/operations/deployment.md`
- `docs/operations/observability.md`
- `docs/product/phase-2-roadmap.md`
- Canal Slack `#alerts-operaciones`
