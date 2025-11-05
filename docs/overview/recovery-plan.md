# Plan de recuperación – Q4 2025

> Última edición: 6 de noviembre de 2025  
> Responsables iniciales: Plataforma & Engineering  
> Objetivo: estabilizar la plataforma (UI/UX, performance, documentación y configuración) sin introducir duplicidades ni desviaciones de entorno.

---

## 1. Objetivos generales

1. **Experiencia consistente**: completar el refresh UI/UX (landing, panel operativo, portal cliente) con Storybook y accesibilidad.
2. **Fuente única de verdad**: documentación viva, sin duplicados; automatizar resúmenes de estado y archivar el histórico.
3. **Procesos sólidos**: tablero + pipeline claro (issue → PR → deploy) con criterios de aceptación verificables y suites verdes.
4. **Configuración segura**: consolidar variables (env manifest), sincronización automatizada y auditoría periódica de secrets.

---

## 2. Flujos de trabajo activos

### 2.1 UI/UX Refresh

- Montar Storybook (`apps/web`) y habilitar preview visual (Chromatic o alternativa).
- Migrar componentes críticos (`button`, `card`, `market-stats`, `login-form`).
- Rediseñar landing/panel con design tokens validados y WCAG 2.1 AA.
- Ejecutar Lighthouse ≥85 en nightly.

### 2.2 Performance & Observabilidad

- Ajustar `useMarketStats`/`CountUp` para SSR seguro.
- Añadir pruebas Playwright que verifiquen métricas reales en landing/panel.
- Automatizar Lighthouse / AXE en CI nocturno.
- Documentar flujos de logging/tracing (Sentry, PostHog) con pasos reproducibles.

### 2.3 Documentación & Procesos

- README raíz + `docs/README.md` alineados (hecho); mantener política de documentación.
- Script de estado (`docs/overview/status.md`) integrado en rutina semanal.
- Checklist de PR único con cobertura de docs/tests.
- Cadencia: daily async (`#plataforma-brisa`), weekly review con entregables.

### 2.4 Configuración / Entornos

- Definir `config/env.manifest.json` como fuente única.
- Implementar `pnpm env:sync` (Vercel ↔ GitHub Secrets ↔ `.env.local`).
- Auditoría mensual de secrets (responsable y fecha).
- Documentar rollback + fixtures de DB en `docs/operations/env-sync.md`.

---

## 3. Hitos activos

| Hito     | Descripción                                | Responsable(s)      | ETA         | Estado                      |
| -------- | ------------------------------------------ | ------------------- | ----------- | --------------------------- |
| `UI-01`  | Storybook con ≥5 componentes productivos   | Frontend            | 07-nov-2025 | 🔄 En curso                 |
| `UX-02`  | Rediseño landing + métricas reales SSR     | Frontend + Producto | 12-nov-2025 | ⏳ Planificado              |
| `DOC-01` | Script estado automático + README alineado | Plataforma          | 05-nov-2025 | ✅ Completado (05-nov-2025) |
| `CFG-01` | Manifest/env sync (`pnpm env:sync`)        | DevOps              | 08-nov-2025 | 🔄 En curso (script draft)  |
| `SEC-01` | Definir refresh tokens Auth.js             | Plataforma          | 15-nov-2025 | ⏳ Planificado              |

Actualiza la tabla dos veces por semana. Los issues deben enlazar al código del hito.

---

## 4. Checklist base por PR

- [ ] Issue vinculado al plan (`recovery-plan`, `ui-refresh`, etc.).
- [ ] `pnpm lint && pnpm typecheck && pnpm test` + suite E2E correspondiente.
- [ ] `pnpm docs:verify` en verde (adjuntar salida en el PR).
- [ ] Documentación actualizada o marcada como `⚠️ actualizar`.
- [ ] Tablero actualizado (En revisión/Done) y nota de pruebas manuales si aplica.

---

## 5. Comunicación

- Tablero GitHub Projects (Backlog → En progreso → En revisión → Listo).
- Daily async en Slack `#plataforma-brisa`.
- Weekly demo (jueves) con evidencia: Storybook, métricas, screenshots.
- Incidentes: seguir `docs/operations/runbooks/incident-response.md`.

---

## 6. Seguimiento

- Mantén este documento como resumen vivo; archiva lo completado en `docs/archive/` cuando cierre el plan.
- Cambios mayores se notifican vía PR y quedan trazados en issues.
- Sin álgebra imaginaria: CI verde, UI usable, documentación honesta. 💚
