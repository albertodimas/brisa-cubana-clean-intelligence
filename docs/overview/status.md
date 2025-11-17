# Estado del Proyecto – Brisa OS

**Última actualización:** 14 de noviembre de 2025  
**Responsable actual:** Producto & Plataforma (equipo fundador)

---

## 1. Resumen estratégico

- El repositorio pivota oficialmente a **Brisa OS**, el software asequible para empresas de limpieza/turnovers. La visión completa vive en [`docs/product/saas-vision.md`](../product/saas-vision.md) y toda decisión debe referenciarla.
- Versiones vigentes: `@brisa/api` 0.4.2 (Hono + Prisma) y `@brisa/web` 0.4.2 (Next.js 16). La release `v0.5.0` marcará el primer corte SaaS (landing nueva + multi-tenant básico).
- Dominios productivos: `https://brisacubanacleanintelligence.com` (landing + portal) y `https://api.brisacubanacleanintelligence.com`. Se conservarán hasta definir un dominio adicional si es necesario.
- Prioridades inmediatas:
  1. ✅ Reescritura de la landing + recursos SaaS (`apps/web/app/page.tsx`, `/recursos/one-pager`).
  2. ✅ Fundaciones multi-tenant (migraciones Prisma, repositorios y middleware con `tenantId`/`tenantSlug`).
  3. IA de resúmenes automáticos para reportes de servicio (nuevo módulo descrito en `docs/development/guides/ai-resumenes.md`).
  4. Preparar estrategia de planes/billing (Starter, Growth, Scale) y activar Stripe live.

---

## 2. Estado operativo

- Salud: `/health` sigue comprobando DB, Stripe (modo test) y SMTP; `/healthz` protegido por token opcional.
- Deploys: Vercel (web/API) continúa siendo el canal oficial. `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm docs:verify` obligatorios antes de merge.
- QA: suites Playwright smoke/critical/full activas; usar `NEXT_PUBLIC_PLAYWRIGHT_TEST_RUN` y fixtures `notesTag` para reproducibilidad.
- Email/dominios: autenticados mediante SendGrid + ImprovMX (ver [docs/operations/email-routing.md](../operations/email-routing.md)).

### Últimos checks locales (12-nov-2025 03:10 UTC)

<!-- PLAYWRIGHT_SUITE_TABLE:start -->

| Suite    | Tests | Duración | Comando                  |
| -------- | ----- | -------- | ------------------------ |
| Smoke    | 15    | ~1min    | `pnpm test:e2e:smoke`    |
| Critical | 50    | ~6min    | `pnpm test:e2e:critical` |
| Full     | 94    | ~10min   | `pnpm test:e2e:full`     |

<!-- PLAYWRIGHT_SUITE_TABLE:end -->

- **Total**: 204 pruebas unitarias/integración passing (<!-- PLAYWRIGHT_TOTAL -->298<!-- /PLAYWRIGHT_TOTAL --> totales incluyendo <!-- PLAYWRIGHT_FULL_COUNT -->94<!-- /PLAYWRIGHT_FULL_COUNT --> E2E).
- **Suites E2E activas:** <!-- PLAYWRIGHT_FULL_COUNT -->94<!-- /PLAYWRIGHT_FULL_COUNT -->

- **Estado**: `pnpm test:e2e:critical` y `pnpm test:e2e:full` pasan después de la actualización de documentación SaaS.

---

## 3. Cambios recientes (histórico Sprint 1-4)

> Se mantienen como referencia para quien necesite contexto del sistema previo (operación interna).

1. **Autenticación y seguridad**
   - Validación estricta de variables (`lib/env.ts`), `ALLOWED_ORIGINS` obligatorio.
   - Rate limiter central endurecido; cookies portal HTTP-only.
2. **Reservas y staff**
   - Detección de solapamientos, `GET /api/bookings/:id`, asignación de staff.
3. **Pagos y facturación**
   - Webhook Stripe, endpoints `/api/invoices/**`, serialización revisada.
4. **Infra & observabilidad**
   - Health check extendido, logging estructurado, shims Hono para Vercel, sincronización de `vercel env`.
5. **Documentación**
   - Política “no PR sin docs”, referencia API actualizada, verificación Storybook.
6. **Marketing & Calendario**
   - API `/api/marketing/**`, dashboards operativos, vista calendario drag&drop, notificaciones multi-canal.
7. **Frontend (Sprints 1-2)**
   - Asignación de staff y vista relaciones cliente-propiedad completadas (RSC, Suspense, filtros).

---

## 4. Riesgos y pendientes

| Trabajo                                       | Estado         | Próximo paso                                                                           |
| --------------------------------------------- | -------------- | -------------------------------------------------------------------------------------- |
| Landing SaaS (copy + secciones + formularios) | ✅ Completo    | Mantener métricas y actualizar recursos cuando cambien planes/precios.                 |
| Multi-tenant (tenantId, roles, permisos)      | ✅ Fundaciones | Extender scoping a leads/notifs restantes y habilitar selector UI multi-tenant.        |
| IA – resúmenes automáticos                    | 🔄 Planificado | Definir inputs/prompt/modelo; crear servicio en `apps/api` y exponerlo al portal.      |
| Pricing/Billing (Stripe)                      | 🔄 En análisis | Decidir estructura (Starter/Growth/Scale + add-ons) y preparar scripts de facturación. |
| CSP modo bloqueante                           | 🔄 Planificado | Auditar reportes actuales y migrar a política estricta.                                |
| Manifesto de entornos (`env.manifest.json`)   | 🔄 En curso    | Automatizar `vercel env pull` ↔ manifiesto y registrarlo en CI.                       |
| Reducción de `any` y deuda TS                 | 🔄 En curso    | Bajar a <20 usos; rastrear en `docs/development/tech-debt.md`.                         |

---

## 5. Documentos relacionados

- [Visión SaaS](../product/saas-vision.md)
- [Plan de recuperación histórico](recovery-plan.md)
- [Guía de seguridad](../operations/security.md)
- [Checklist de despliegue](../operations/deployment.md)
- [Referencia API](../reference/api-reference.md)
- [Guía portal cliente](../development/guides/portal-client.md)

---

## 6. Documentación y comunicación

- Cada PR debe indicar qué parte de la visión SaaS aborda y qué documentos tocó.
- `pnpm docs:verify` es obligatorio cuando se actualiza documentación.
- Conservar estados anteriores en `docs/archive/` para separar lo histórico de lo vigente.

---

## 7. Archivo histórico

El estado previo al 31-oct-2025 permanece en [`docs/archive/2025-10-status.md`](../archive/2025-10-status.md). Si se necesitan detalles de la operación como servicio, acudir a ese archivo.
