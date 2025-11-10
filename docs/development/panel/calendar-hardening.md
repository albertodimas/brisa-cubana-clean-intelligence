# WS2 · Calendar Hardening (Portal Operativo)

> **Objetivo:** garantizar que la vista de calendario soporte datos reales (90 días, cientos de reservas) con UX responsiva y observabilidad lista para GA.

## 1. Estado Actual

- Calendario mensual (`CalendarView`) consume `/api/calendar` mediante `useCalendar`. Los filtros existen pero el request se reconstruye en cada render y no cachea resultados.
- Drag & drop reprograma reservas vía `PATCH /api/bookings/:id`, pero no hay indicador de conflicto (doble booking) ni reintento automático.
- Vista semanal (`CalendarWeekView`) no está conectada al selector principal y queda oculta en mobile.
- API `/api/calendar` itera hasta 2000 registros sin cache; cada carga de mes provoca query completa e incluye datos que no se muestran (p. ej., bookings fuera del mes).
- No existen eventos PostHog o métricas internas para saber cuántos filtros usan los coordinadores.
- Suite Playwright `calendar.spec.ts` planeada pero aún no implementada; el hook expone `window.__BRISA_LAST_STATUS__` para tests críticos.

## 2. Riesgos Identificados

| Riesgo                                                  | Impacto                                                    | Mitigación                                                                                               |
| ------------------------------------------------------- | ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Consultas pesadas a Prisma al cambiar de mes/filtros    | Respuestas lentas (>2 s) y timeouts en drag & drop         | Cache in-memory/Redis + `select` reducido en `/api/calendar`; paginar y retornar solo campos necesarios. |
| Falta de feedback ante conflictos y reintentos manuales | Operadores repiten arrastres sin saber que se rechazó      | Retornar mensajes del backend, mostrar toasts diferenciados, añadir retry/backoff.                       |
| Sin métricas ni logs estructurados                      | Difícil medir adopción y detectar cuellos de botella       | Emitir eventos `calendar_viewed`, `calendar_filter_applied`, `calendar_reschedule_failed`.               |
| Mobile/responsive parcial                               | Coordinadores en sitio no pueden operar desde tablet/phone | Activar vista semana/agenda en <1024 px, con gestos básicos y CTA rápido.                                |
| Sin pruebas E2E dedicadas                               | Cambios en drag & drop pueden romper sin detección         | Crear `tests/e2e/calendar.spec.ts` con scenarios: filtros, reprogramación, cancelación y mobile toggle.  |

## 3. Plan de Trabajo

### Fase 1 · Backend & datos (API)

1. Crear helper `CalendarCache` (Map + TTL 60 s) en `/api/calendar` para evitar repetir queries al navegar entre filtros similares. Para producción evaluar Redis (Upstash).
2. Reducir `serializeBooking` para calendario (campos estrictamente necesarios) y exponer `conflictRisk` cuando Prisma detecte solapamientos (`bookingRepository.detectConflicts`).
3. Añadir endpoint `GET /api/calendar/stats` para alimentar resumen (totales por estado, horas comprometidas). Reutilizarlo en dashboard financiero.

### Fase 2 · UI/UX

1. Integrar `CalendarWeekView` como opción secundaria con tabs `Mes / Semana`, recordando preferencia en `localStorage`.
2. Virtualizar listado de bookings por día usando `react-virtualized` o `AutoSizer` simple (evita scrolls largos en días saturados).
3. Mostrar badges de riesgo (`conflictRisk`) y toasts diferenciados para error de solapamiento vs. errores de red.
4. Añadir panel lateral “Fila de acciones” para mobile: cuando se toca una tarjeta abre resumen + botones (reprogramar, cancelar, contactar staff).

### Fase 3 · Observabilidad & tests

1. Eventos PostHog:
   - `calendar_viewed` (mes, filtros activos, viewport size).
   - `calendar_reschedule_attempted` / `calendar_reschedule_failed`.
   - `calendar_filter_applied`.
2. Nuevos logs backend (`component: calendar`) con `filters`, `durationMs`, `cacheHit`.
3. Playwright `tests/e2e/calendar.spec.ts`:
   - Cambiar de mes con datos seed, validar badges.
   - Aplicar filtros y verificar tabla/resumen.
   - Drag & drop con respuesta mockeada (success y conflicto).
   - Mobile viewport (week view) asegurando toggles accesibles.

## 4. Entregables & Definition of Done

- `/api/calendar` responde en <400 ms con cache caliente y <1 s en cache fría (medido con `pnpm test:e2e:critical` + script k6 opcional).
- Calendar UI ofrece Mes/Semana, funciona <768 px y mantiene accesibilidad (focus + ARIA en drag handles).
- Eventos PostHog aparecen en dashboard “Portal Usage”.
- Suite Playwright incluida en `test:e2e:critical`.
- Documentar cambios en `docs/overview/status.md` y agregar runbook corto a `docs/development/guides/portal-calendar.md` (cómo depurar y cómo añadir filtros nuevos).

## 5. Dependencias

- Datos reales de bookings (seed actual cubre ~120 reservas). Para pruebas de estrés generar script `scripts/fixtures/seed-calendar.ts`.
- Librería de virtualización (evaluar dependencia ligera; evitar bundle grande si Next 16 + React 19).
- Aprobación de producto para mensajes y vistas mobile.

## 6. Próximos pasos

1. Implementar cache en `/api/calendar` + métricas básicas (PR 1).
2. Virtualización + selector Mes/Semana en `CalendarPageClient` (PR 2).
3. Eventos PostHog + Playwright specs (PR 3).

> Actualizar este documento conforme avancemos cada PR y referenciarlo desde `docs/overview/ga-plan.md` (WS2.1).
