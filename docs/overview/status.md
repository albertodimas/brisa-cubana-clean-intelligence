# Estado del Proyecto – Brisa Cubana Clean Intelligence

**Última actualización:** 6 de noviembre de 2025  
**Responsable actual:** Plataforma & Reliability

## Resumen operativo

- API `@brisa/api` 0.4.2 (Hono 4.10.3 + Prisma 6.17.1) y web `@brisa/web` 0.4.2 (Next.js 16.0.0) desplegadas en Vercel.
- Salud: `/health` verifica base de datos, Stripe (modo test) y SMTP; `/healthz` expone estado público protegido opcionalmente por token.
- Seguridad crítica cerrada (Sprint 1): `JWT_SECRET` obligatorio, validación de envs, rate limiting reforzado, cookies del portal HTTP-only.
- Sprint 2: motor de reservas detecta doble booking, endpoint `GET /api/bookings/:id` y asignación de staff (`PATCH /api/bookings/:id/assign-staff`).
- Sprint 3: módulo de facturación (`/api/invoices/**`), ajustes de serialización y documentación al día.
- Email operativo: dominio autenticado en SendGrid, forwarding con ImprovMX (`cliente@brisacubanacleanintelligence.com`) según [docs/operations/email-routing.md](../operations/email-routing.md).

### Últimos checks locales (06-nov-2025 18:30 UTC)

<!-- PLAYWRIGHT_SUITE_TABLE:start -->

| Suite    | Tests | Duración | Comando                  |
| -------- | ----- | -------- | ------------------------ |
| Smoke    | 4     | ~1min    | `pnpm test:e2e:smoke`    |
| Critical | 20    | ~6min    | `pnpm test:e2e:critical` |
| Full     | 32    | ~10min   | `pnpm test:e2e:full`     |

<!-- PLAYWRIGHT_SUITE_TABLE:end -->

- **Total**: 204 pruebas unitarias/integración passing (<!-- PLAYWRIGHT_TOTAL -->236<!-- /PLAYWRIGHT_TOTAL --> en total incluyendo <!-- PLAYWRIGHT_FULL_COUNT -->32<!-- /PLAYWRIGHT_FULL_COUNT --> E2E)
- **Suites E2E activas:** <!-- PLAYWRIGHT_FULL_COUNT -->32<!-- /PLAYWRIGHT_FULL_COUNT -->

> Ejecuta `pnpm lint && pnpm typecheck && pnpm test && pnpm docs:verify` antes de mergear. Para regresiones completas usa `pnpm test:e2e:full`.

## Cambios recientes (Sprint 1-3)

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
5. **Documentación**
   - README y `docs/README.md` definen política “no PR sin docs”.
   - `docs/reference/api-reference.md` cubre bookings, payments, invoices y portal.

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

## Archivo histórico

El estado previo al 31-oct-2025 permanece en [`docs/archive/2025-10-status.md`](../archive/2025-10-status.md). Mantén este documento como fuente de verdad vigente.
