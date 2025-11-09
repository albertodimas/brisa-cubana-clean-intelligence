# Plan de Salida de Beta (GA v1.0)

> **Objetivo:** llegar a una versión estable públicamente disponible, con landing completo, portal operativo y procesos de soporte listos. Este documento consolida las tareas necesarias y debe acompañar los reportes de `docs/overview/status.md`.

## 1. Diagnóstico resumido

| Dominio                                   | Situación actual                                                                                                                            | Riesgo si no se corrige                                             |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Landing público (`apps/web/app/page.tsx`) | Secciones clave (mockups reales, casos de uso, métricas visuales) siguen usando placeholders de `lib/marketing-content.ts`.                 | Poca conversión y percepción de “producto incompleto”.              |
| Portal operativo (`apps/web/app/panel/*`) | Vistas de calendario, dashboard financiero, marketing/staff poseen UI parcial y dependen de fixtures.                                       | Los clientes beta no pueden gestionar reservas/finanzas end-to-end. |
| API & datos (`apps/api/src/routes/*`)     | Endpoints cubren bookings/marketing, pero faltan contratos finales para onboarding/analytics y validaciones adicionales (JWT refresh, CSP). | Riesgos de seguridad y datos inconsistentes al escalar.             |
| Infra & QA                                | Health monitor ya estabilizado, pero no existe auditoría completa de Stripe/Sentry/PostHog en producción ni smoke cross-browser.            | Falta de observabilidad real al abrir GA.                           |
| Documentación & GTM                       | `docs/operations/*` cubre despliegues, pero no existen términos públicos, guía de soporte ni calendario de comunicación.                    | Sin cobertura legal/soporte; lanzamiento no alineado con marketing. |

## 2. Workstreams y tareas

### WS1 · Experiencia pública

1. **Completar landing**
   - Reemplazar mocks por assets reales (`apps/web/app/mockups/*`, `operationsMockups`).
   - Agregar secciones “Casos reales”, “Antes vs. Después”, “Proceso en 4 pasos” (componentes en `components/landing/*`).
   - Programar variantes `/en` (ya existe carpeta `app/en` pero falta contenido final).
2. **Micro-sites de soporte/legales**
   - Crear páginas `/servicios`, `/soporte`, `/terminos` dentro de `apps/web/app`.
   - Vincular `docs/operations/security.md` → versión pública mínima.
3. **Integración leads + analítica**
   - Conectar `LeadCaptureForm` con `LEAD_WEBHOOK_URL` real y confirmar eventos PostHog (`cta_*` events).
   - Añadir validaciones de reciprocidad (doble opt-in, estado “recibido”).

### WS2 · Portal operativo (panel)

1. **Calendario y reservas** (`apps/web/app/panel/calendario`)
   - Finalizar drag & drop, filtros y vista mobile; usar datos reales vía `/api/calendar`.
   - Tests E2E dedicados (`tests/e2e/calendar.spec.ts`).
2. **Dashboard financiero** (`panel/dashboard`, `panel/marketing`)
   - Conectar gráficos con `marketing/stats`, `invoices` y `portfolio` stats.
   - Exportaciones CSV y permisos (roles).
3. **Módulo de notificaciones** (`panel/notifications` + SSE en `apps/api/src/routes/notifications.ts`)
   - UI para marcar como leído, filtros y envío manual para operadores.
4. **Onboarding cliente** (`apps/web/app/clientes`)
   - Flujo completo de magic link (solicitud → confirmación → tour).
   - Email templates en `apps/api/prisma/seed.*` + documentación de uso.

### WS3 · Backend / seguridad

1. **JWT refresh & sesiones** (pendiente en `docs/overview/status.md`)
2. **CSP bloqueante y headers** (`apps/web/next.config.mjs`)
   - Implementar refresh tokens y rotación en `apps/api/src/routes/portal-auth.ts`.
2. **CSP bloqueante y headers** (`apps/web/next.config.mjs`)
   - Pasar de modo report-only → enforce; actualizar `docs/operations/security.md`.
3. **Auditoría de roles/rate limits**
   - Revisar `createRateLimiter` y endpoints sensibles (Stripe, portal) para GA.
4. **Backups y seeds**
   - Validar `scripts/prisma-deploy-or-baseline.sh`, snapshot Neon y plan de restauración.

### WS4 · QA, infra y observabilidad

1. **Batería automatizada**
   - Habilitar `pnpm test:e2e:full` en nightly y `test:e2e:critical` en CI (ya configurado) → documentar en `docs/development/qa/e2e-strategy.md`.
<<<<<<< HEAD
   - _(Progreso: Smoke y critical incluyen proyectos Safari – `playwright.config.ts` agrega `smoke-webkit`/`critical-webkit` y los scripts `pnpm test:e2e:smoke` / `test:e2e:critical:safari` los ejecutan en paralelo.)_
=======
   - Añadir smoke cross-browser (Chrome/Safari) usando Playwright projects.
>>>>>>> 3b05692 (docs: add ga plan)
2. **Monitoreo producción**
   - Confirmar integraciones Stripe/Sentry/PostHog con datos reales (ejecutar `pnpm sentry:test-event`, `pnpm posthog:test-event`).
   - Configurar alertas Slack/Email para errores y health degradado.
3. **Performance**
   - Ejecutar `pnpm --filter @brisa/web analyze` y `lhci autorun` → registrar métricas en `docs/development/performance`.
4. **Automatizar env sync**
   - Extender `scripts/env/sync-health-token.mjs` a otras variables críticas (Stripe, Sentry, Slack).

### WS5 · Documentación & Go-to-Market

1. **Manual público GA**
   - Crear `docs/overview/ga-release.md` con procesos de soporte, SLA, y checklist legal.
   - Actualizar `README.md` y `docs/overview/status.md` con cronograma.
2. **Changelog & comunicación**
   - Completar `CHANGELOG.md` sección `Unreleased` → `v1.0.0`.
   - Preparar kit de prensa/FAQ en `docs/operations/marketing`.
3. **Soporte**
   - Definir canales (`soporte@`, Slack, teléfono) y reflejarlos en landing + `SECURITY.md`.

## 3. Cronograma sugerido

| Semana | Actividades claves                                                                              |
| ------ | ----------------------------------------------------------------------------------------------- |
| 0      | Confirmar alcance GA, asignar responsables por workstream, convertir tareas en issues.          |
| 1-2    | WS1 + WS2: completar landing y portal crítico; comenzar QA funcional.                           |
| 3      | WS3 + WS4: seguridad, observabilidad, performance y suites E2E.                                 |
| 4      | WS5: documentación, términos, campaña de lanzamiento; congelar cambios funcionales.             |
| 5      | Release Candidate → smoke tests en staging/producción, retro con stakeholders, ajustes finales. |
| 6      | GA (`v1.0.0`), anuncio público, monitoreo reforzado durante la primera semana post-lanzamiento. |

## 4. Definition of Done (GA)

- Landing multilingüe con todas las secciones de valor + términos legales publicados.
- Portal operativo cubre end-to-end: reservas, calendario, facturación, notificaciones, onboarding.
- Suites CI: lint/typecheck/unit + Playwright critical; health monitor y alertas 24/7 funcionando.
- Documentación actualizada (`README`, `status`, manuales) y checklist legal completado.
- Changelog `v1.0.0` publicado y canales de soporte activos.

> Revisión semanal: actualizar este documento con progreso y bloquear merges que no estén alineados al plan de GA.

## 5. Flujo de trabajo y reglas operativas

1. **Ramas**
   - `main`: siempre estable; únicamente merges squash de PR aprobados.
   - `plan/ga-v1.0.0`: rama de coordinación (doc/plan). Cualquier ajuste al plan se hace aquí y se integra mediante PR.
   - Ramas por workstream/característica: `feature/<área>-<descripción>` o `chore/<área>-<hardening>`. Nunca reutilizar ramas viejas.

2. **Boards e issues**
   - Project board `GA Release` con columnas Backlog / In Progress / Review / Done.
   - Cada issue debe referenciar la sección de este plan que ataca (WS1–WS5) y tener una checklist de aceptación/QA/doc.

3. **Pull requests**
   - Requisitos obligatorios en la descripción:
     - `Issue:` (link)
     - `Tests:` comandos ejecutados (mínimo `pnpm lint && pnpm typecheck && pnpm test`; si aplica, `pnpm test:e2e:critical`).
     - `Docs actualizados:` archivo(s) o “N/A (justificado)”.
   - Revisiones: al menos 1 aprobador del equipo responsable del workstream; cambios de seguridad requieren doble aprobación.

4. **Calidad**
   - No se fusiona si hay fallas en CI (`CI (Main Branch)` o monitores).
   - Flaky tests deben documentarse y etiquetarse; no se ignoran suites sin issue abierto.
   - Antes de mover un issue a “Done”, ejecutar smoke manual del flujo afectado y adjuntar evidencia (screenshot o log).

5. **Liberaciones**
   - Cada miércoles: corte de cambios → actualización de `docs/overview/status.md` y este plan.
   - Cada viernes: RC semanal desplegada a preview para stakeholders. Todo hotfix a producción requiere incidente documentado.

6. **Sincronización**
   - Daily async: resumen en el board (lo que se hizo, bloqueos).
   - Reunión semanal de planificación: revisar métricas (salud, Lighthouse, QA) y ajustar prioridades.
