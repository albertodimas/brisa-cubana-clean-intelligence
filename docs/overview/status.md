# Estado del Proyecto – Brisa Cubana Clean Intelligence

**Última actualización:** 9 de noviembre de 2025  
**Responsable actual:** Plataforma & Reliability

## Resumen operativo

- API `@brisa/api` 0.4.2 (Hono 4.10.3 + Prisma 6.17.1) y web `@brisa/web` 0.4.2 (Next.js 16.0.0) desplegadas en Vercel.
- Salud: `/health` verifica base de datos, Stripe (modo test) y SMTP; `/healthz` expone estado público protegido opcionalmente por token.
- Seguridad crítica cerrada (Sprint 1): `JWT_SECRET` obligatorio, validación de envs, rate limiting reforzado, cookies del portal HTTP-only.
- Sprint 2: motor de reservas detecta doble booking, endpoint `GET /api/bookings/:id` y asignación de staff (`PATCH /api/bookings/:id/assign-staff`).
- Sprint 3: módulo de facturación (`/api/invoices/**`), ajustes de serialización y documentación al día.
- Email operativo: dominio autenticado en SendGrid, forwarding con ImprovMX (`cliente@brisacubanacleanintelligence.com`) según [docs/operations/email-routing.md](../operations/email-routing.md).
- QA: suites Playwright (smoke/critical/full) usan fixtures etiquetados (`notesTag`) y el flag `PLAYWRIGHT_TEST_RUN` para exponer instrumentación del calendario y mantener los flujos drag & drop deterministas.

### Últimos checks locales (09-nov-2025 01:40 UTC)

<!-- PLAYWRIGHT_SUITE_TABLE:start -->

| Suite    | Tests | Duración | Comando                  |
| -------- | ----- | -------- | ------------------------ |
| Smoke    | 15    | ~1min    | `pnpm test:e2e:smoke`    |
| Critical | 47    | ~6min    | `pnpm test:e2e:critical` |
| Full     | 91    | ~10min   | `pnpm test:e2e:full`     |

<!-- PLAYWRIGHT_SUITE_TABLE:end -->

- **Total**: 204 pruebas unitarias/integración passing (<!-- PLAYWRIGHT_TOTAL -->295<!-- /PLAYWRIGHT_TOTAL --> en total incluyendo <!-- PLAYWRIGHT_FULL_COUNT -->91<!-- /PLAYWRIGHT_FULL_COUNT --> E2E)
- **Suites E2E activas:** <!-- PLAYWRIGHT_FULL_COUNT -->91<!-- /PLAYWRIGHT_FULL_COUNT -->

> ✅ Estado actual (08-nov-2025 23:50 UTC): `pnpm test:e2e:critical` y `pnpm test:e2e:full` completados en local sin fallos tras instrumentar el calendario (`NEXT_PUBLIC_PLAYWRIGHT_TEST_RUN`, `__BRISA_*`) y aislar los fixtures mediante `notesTag`. Revisa el reporte Playwright adjunto en el PR sólo si introduces cambios adicionales en estos flujos.

> Ejecuta `pnpm lint && pnpm typecheck && pnpm test && pnpm docs:verify` antes de mergear. Para regresiones completas usa `pnpm test:e2e:full`.

## Cambios recientes (Sprint 1-4)

1. **Autenticación y seguridad**
   - Validación estricta de vars (`lib/env.ts`), `ALLOWED_ORIGINS` requerido en producción.
   - Rate limiter central (`createRateLimiter`) endurecido; login 5/60s, portal magic-link 3/15m, checkout Stripe 10/60s.
2. **Reservas y staff**
   - Detección de solapamientos en POST/PATCH `/api/bookings`.
   - `GET /api/bookings/:id` devuelve relaciones completas + staff.
   - `PATCH /api/bookings/:id/assign-staff` asigna/desasigna staff con validaciones de rol/estado.
3. **Pagos y facturación**
   - Webhook Stripe crea booking confirmado, deduplicado con `StripeWebhookEvent` y notifica a Operaciones.
   - `/api/invoices` permite listar, crear, actualizar y eliminar invoices; rate limit configurable.
4. **Infra & observabilidad**
   - Health check extendido (DB, Stripe, SMTP, Sentry).
   - Logging estruturado para asignaciones de staff y pagos.
   - `app.js` (raíz) y `api/index.js` actúan como shims de Hono para Vercel; el proyecto `brisa-cubana-clean-intelligence-api` debe vincularse desde `apps/api` (`vercel link --cwd apps/api`) antes de cada `vercel pull`.
5. **Documentación**
   - README y `docs/README.md` definen política "no PR sin docs".
   - `docs/reference/api-reference.md` cubre bookings, payments, invoices y portal.
6. **Marketing & Calendario (Sprint 4)**
   - Suite `/api/marketing/**` (stats, testimoniales, FAQs, pricing tiers, market stats) con endpoints públicos y administrativos.
   - Panel operativo incorpora dashboard de analytics (charts de ingresos, reservas por estado, top propiedades, workload por staff) y exportaciones CSV.
   - Vista de calendario (`/panel/calendario`) con drag & drop, modal de detalle, filtros y API `GET /api/calendar` + `/availability`.
   - Servicio de notificaciones multi-canal (email/SMS/in-app) con plantillas, cola en memoria y endpoints `GET /api/notifications`, `PATCH /read`, `PATCH /read-all`.
7. **Frontend - Fase 1: Funcionalidades Críticas (Sprint 1-2)** ✅ COMPLETADO
   - **Sprint 1**: Asignación de Staff
     - Tipo `Booking` incluye `assignedStaff` en frontend
     - Columna "Staff asignado" en `BookingsManager` con selector funcional
     - Dashboard `/panel/staff` para staff ver sus asignaciones
     - Filtro por staff en búsqueda de reservas
     - 6 tests E2E críticos + 12 tests unitarios passing
   - **Sprint 2**: Vista de Relaciones Cliente-Propiedades
     - Endpoint `GET /api/customers/:id` implementado con tests
     - Páginas de detalle: `/panel/customers/[id]` y `/panel/properties/[id]`
     - Server Components con Suspense + carga paralela de datos
     - Navegación bidireccional (clientes ↔ propiedades ↔ reservas)
     - Type-safe navigation con hrefs basados en objetos
     - 110/110 tests web + 192/192 tests API passing

## Riesgos y pendientes

| Trabajo                                     | Estado         | Próximo paso                                                                   |
| ------------------------------------------- | -------------- | ------------------------------------------------------------------------------ |
| Refresh tokens Auth.js                      | 🔄 Planificado | Diseñar flow de refresh y documentarlo (RFC en `docs/development/tech-debt/`). |
| CSP modo bloqueante                         | 🔄 Planificado | Revisar reportes actuales y migrar a política estricta.                        |
| Estrategia de caché API                     | 🔄 En análisis | Evaluar Redis/Upstash para endpoints read-heavy.                               |
| Reducción de `any`                          | 🔄 En curso    | Bajar a <20 usos, registrar hallazgos en `docs/development/tech-debt.md`.      |
| Manifesto de entornos (`env.manifest.json`) | 🔄 En curso    | Automatizar `vercel env pull` ↔ manifiesto.                                   |

## Documentos relacionados

- [Plan de recuperación](recovery-plan.md)
- [Guía de seguridad](../operations/security.md)
- [Checklist de despliegue](../operations/deployment.md)
- [Referencia API](../reference/api-reference.md)
- [Guía Portal Cliente](../development/guides/portal-client.md)

## Documentación y comunicación

- Este reporte se sincroniza con el [mapa documental](../README.md) y debe actualizarse en cada release o hotfix.
- Antes de mergear, registra los comandos ejecutados (`pnpm docs:verify`, suites E2E, seeds) en el PR y enlaza la sección correspondiente del changelog.
- Archiva estados anteriores en `docs/archive/` para evitar mezclar información vigente con histórica.

## Archivo histórico

El estado previo al 31-oct-2025 permanece en [`docs/archive/2025-10-status.md`](../archive/2025-10-status.md). Mantén este documento como fuente de verdad vigente.
