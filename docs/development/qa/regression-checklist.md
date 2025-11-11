# Checklist de Regresiones

**Última actualización:** 7 de noviembre de 2025  
**Estado:** ✅ Validado con suites `critical` (47 tests) y `full` (91 tests). Usa esta lista para QA manual antes de cada despliegue a producción; alinéala con el [recovery-plan](../../overview/recovery-plan.md) cuando se habiliten módulos nuevos.

> Comandos mínimos antes de esta checklist: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm docs:verify`, `pnpm exec playwright test --project=critical`.

Cobertura automática actual: <!-- PLAYWRIGHT_CRITICAL_COUNT -->50<!-- /PLAYWRIGHT_CRITICAL_COUNT --> pruebas en la suite `critical`.

---

## 1. Autenticación y Autorización

- [ ] Login ADMIN, COORDINATOR, STAFF y CLIENT funciona (muestra panel/portal correcto).
- [ ] Credenciales inválidas disparan mensaje y el rate limit (config por defecto 20 intentos/60 s) responde con toast claro.
- [ ] Sesión persiste tras refresh, `auth_token` y `session-token` mantienen flags `HttpOnly`, `Secure`, `SameSite=Lax`.
- [ ] Logout borra cookies y evita acceso directo a `/panel/*` o `/clientes/*`.
- [ ] `/panel` solo accesible para ADMIN/COORDINATOR (STAFF redirige a `/panel/staff`, CLIENT a `/`).
- [ ] `/panel/dashboard` y `/panel/calendario` redirigen a `/panel` si el rol no es válido.
- [ ] `app/api/[...route]/route.ts` respeta encabezados `authorization` y propaga `Set-Cookie`.

## 2. Bookings, Staff & API Operativa

- [ ] Listado de reservas (`BookingsManager`) muestra filtros activos (texto, estado, staff, rango fechas) y los chips reflejan el query real.
- [ ] Asignar y desasignar staff actualiza el backend (verificar log en `apps/api/src/routes/bookings.ts`) y refleja cambios sin recargar.
- [ ] Filtro “Personal” persiste al navegar (estado sincronizado con `currentQuery`).
- [ ] `PATCH /api/bookings/:id/assign-staff` valida estados prohibidos (COMPLETED/CANCELLED) y devuelve mensaje claro.
- [ ] Health check `/health` reporta `database`, `stripe`, `email`, `sentry`. Stripe puede estar en `warning` si usa claves test; documentar en status.
- [ ] Rate limiter de API usa Redis cuando `REDIS_URL` está presente, y cae en memoria cuando no (logs `component=rate-limit`).
- [ ] Seeds (`pnpm --filter @brisa/api db:seed`) crean reservas demo con staff asignable y marketing content.

## 3. Calendario Operativo

- [ ] `/panel/calendario` carga filtros (propiedades, servicios, staff) y muestra resumen (total, confirmadas, ingresos).
- [ ] Drag & drop: mover reserva confirmada a otro día, verificar toast “Reserva reprogramada exitosamente” y que el booking aparezca en la celda objetivo tras `router.refresh()`.
- [ ] Las reservas COMPLETED/CANCELLED no son arrastrables (atributo `draggable="false"`).
- [ ] Vista semanal bloquea drag&drop y mantiene botones “Mes/Semana”.
- [ ] Al simular error (forzar `PATCH` 400) aparece toast rojo y desaparece después de 5 s (ver `calendar-status-alert`).
- [ ] Modal de detalles permite cancelar/completar reservas y cierra correctamente.
- [ ] `GET /api/calendar` respeta filtros y limites (≤90 días).
- [ ] `GET /api/calendar/availability` devuelve slots y bookings para fecha/propiedad.

## 4. Dashboard & Analytics

- [ ] `/panel/dashboard` solo visible para ADMIN/COORDINATOR. STAFF debe ser redirigido.
- [ ] Cards muestran totales (reservas, ingresos, staff activo, propiedades).
- [ ] Gráficas (Recharts) cargan con skeletons mientras llega la data y son responsivas (ver `lg:grid-cols-2`).
- [ ] Staff workload muestra colores consistentes; top properties lista máximo 5.
- [ ] `fetchDashboardStats()` no falla si la API devuelve arrays vacíos (ver fallback en componente).
- [ ] `tests/e2e/dashboard.spec.ts` pasa en local.

## 5. Marketing Panel & Exportaciones

- [ ] `/panel/marketing` (si aplica) permite crear/editar Stats, Pricing, FAQs, Testimonios.
- [ ] CSV Export (`ExportButton`) aparece en managers de reservas, clientes, propiedades y servicios.
- [ ] Al exportar >5000 filas aparece confirmación; >10 000 se trunca y se muestra mensaje en tooltip.
- [ ] Evento `csv_export` se registra (ver consola o PostHog).
- [ ] Marketing cards en landing (`MarketStatsSnapshot`) muestran valores reales (sin “Dato en actualización”).
- [ ] Rutas públicas `/api/marketing/*` responden sin autenticación cuando corresponde (`testimonials`, `pricing`, `market stats`).
- [ ] Rutas protegidas requieren ADMIN/COORDINATOR y registran auditoría.

## 6. Portal Cliente & Comprobantes PDF

- [ ] Flujo de enlace mágico completo: solicitud → correo/debug token → confirmación → dashboard.
- [ ] Dashboard lista próximas reservas, historial y muestra barra de expiración.
- [ ] Cancelar y reprogramar funcionan y generan notificaciones en panel.
- [ ] Botón “Descargar comprobante” descarga PDF con datos correctos (código, servicio, propiedad, monto, badge de estado) usando la ruta `app/api/portal/bookings/[bookingId]/pdf`.
- [ ] Rate limit PDF (10/min) devuelve 429 y encabezados `X-RateLimit-*` cuando se supera, y se recupera tras 60 s.
- [ ] Portal respeta dark/light mode y mantiene accesibilidad en botones (`aria-live`, `aria-label`).
- [ ] `tests/e2e/portal-client.spec.ts` pasa apuntando a datasets seeds.

## 7. Notificaciones y Background Jobs

- [ ] Panel de notificaciones (`/panel?tab=notificaciones`) actualiza al marcar como leídas (botón individual + “Marcar todas”).
- [ ] SSE stream (`/api/notifications/stream`) reconecta automáticamente; no bloquea UI cuando API no tiene Redis (fallback en memoria).
- [ ] Servicio `booking-notification-dispatcher` marca `IN_APP` como enviados inmediatamente para evitar pendientes fantasma.
- [ ] Email/SMS (si configurados) registran en logs `notification-service`.
- [ ] Stripe webhook (`/api/payments/stripe/webhook`) crea `StripeWebhookEvent`, evita duplicados y genera booking + notificación.

## 8. Infraestructura, Proxy y Deploy

- [ ] `.github/actions/setup-project` instala Playwright solo cuando es necesario y propaga `LOGIN_RATE_LIMIT`.
- [ ] Workflows `pr-checks`, `ci`, `nightly` tienen variables requeridas (`JWT_SECRET`, `AUTH_SECRET`, `ALLOWED_ORIGINS`, `PORTAL_MAGIC_LINK_*`, `STRIPE_SECRET_KEY`).
- [ ] Vercel proyectos (`web`, `api`) actualizados con `ALLOWED_ORIGINS`, `PROXY_ALLOWED_ORIGINS`, `PORTAL_MAGIC_LINK_EXPOSE_DEBUG` (solo dev).
- [ ] `docs/operations/env-sync.md` y `docs/overview/status.md` reflejan la última ejecución de `pnpm env:status`.
- [ ] Health check público `/healthz` responde 200 y reporta `email: ok`.
- [ ] PostHog monitor (`.github/workflows/posthog-monitor.yml`) no marca el ambiente `production-web` salvo en despliegues reales.
- [ ] `pnpm docs:verify` pasa (sincroniza tablas Playwright y enlaces).
- [ ] `CHANGELOG.md` y `docs/reference/api-reference.md` listan los endpoints nuevos (calendar, marketing, portal PDF).

## 9. Higiene de datos E2E

- [ ] Cada suite Playwright que crea bookings usa un `notesTag` único (ej. `[e2e-calendar-dnd]`, `[e2e-calendar]`) en `createBookingFixture`.
- [ ] Los helpers de limpieza (`deleteAllBookings`) reciben el mismo `notesTag` o se valida manualmente que sólo se eliminan fixtures propios mediante `/api/test-utils/bookings?tag=...`.
- [ ] `PLAYWRIGHT_TEST_RUN="true"` y `NEXT_PUBLIC_PLAYWRIGHT_TEST_RUN="true"` están propagados en CI/local para desactivar tours del calendario y exponer `window.__BRISA_*` (hooks de estado, refresh, estatus de drag & drop).

Cuando todos los ítems aplicables estén marcados, registra la evidencia (capturas, logs, resultados de suites) en el PR o en `docs/overview/status.md` antes de autorizar el deploy.
