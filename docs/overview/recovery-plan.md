# Plan de recuperación – Octubre 2025

> Última edición: 31 de octubre de 2025  
> Responsables iniciales: Plataforma & Engineering  
> Objetivo: estabilizar la plataforma (UI/UX, performance, documentación y configuración) sin introducir duplicidades ni desviaciones de entorno.

---

## 1. Objetivos generales

1. **Experiencia consistente**: corregir la UI/UX inacabada y mejorar la performance percibida (landing, panel operativo, portal cliente).
2. **Fuente única de verdad**: reducir documentación redundante, marcar artefactos obsoletos y automatizar resúmenes de estado.
3. **Process enablement**: habilitar tablero de trabajo y pipeline claro (issues → PR → deploy) con criterios de aceptación verificables.
4. **Configuración segura**: consolidar variables de entorno y sincronizarlas entre Vercel, GitHub Actions y desarrolladores sin drift.

---

## 2. Flujos de trabajo activos

### 2.1 UI/UX Refresh

- Montar Storybook (`apps/web`) + Chromatic o alternativa visual.
- Migrar componentes críticos (`button`, `card`, `market-stats`, `login-form`) y eliminar placeholders.
- Rediseñar landing y panel operativo basados en design tokens validados (Figma).
- Revisar accesibilidad (WCAG 2.1+), `prefers-reduced-motion` y performance (Lighthouse ≥ 85).

### 2.2 Performance & Observabilidad

- Ajustar `CountUp`/`useMarketStats` para SSR seguro (no mostrar “0” inicial).
- Añadir pruebas Playwright que verifiquen métricas reales en la landing.
- Automatizar auditoría Lighthouse / AXE en CI (Nightly Full E2E).
- Documentar flujos de logging y tracing (Sentry, PostHog) con pasos para reproducir eventos de prueba.

### 2.3 Documentación & Procesos

- Simplificar README (hecho) y etiquetar secciones caducas (`⚠️ actualizar`) en docs.
- Generar script que compile estado actual (CI runs, deploys, issues) → `docs/overview/status.md`.
- Unificar checklist de PRs con Storybook + pruebas requeridas.
- Establecer cadencia: daily 15 min, weekly review con entregables definidos.

### 2.4 Configuración / Entornos

- Introducir `config/env.manifest.json` como fuente única de variables críticas.
- Crear script `pnpm env:sync` que exporte/import Vercel + GitHub Secrets + `.env.local`.
- Registrar auditoría mensual de secrets (quién cambió qué).
- Documentar estrategia de rollback y fixtures de DB en `docs/operations/env-sync.md`.

---

## 3. Próximos hitos

| Hito     | Descripción                                      | Responsable(s)      | ETA         |
| -------- | ------------------------------------------------ | ------------------- | ----------- |
| `UI-01`  | Storybook con al menos 5 componentes productivos | Frontend            | 04-nov-2025 |
| `UX-02`  | Rediseño de landing + métricas reales con SSR    | Frontend + Producto | 08-nov-2025 |
| `DOC-01` | Script de estado automático + README alineado    | Plataforma          | 05-nov-2025 |
| `CFG-01` | Manifest de env y comando `pnpm env:sync`        | DevOps              | 06-nov-2025 |

Actualiza esta tabla al menos dos veces por semana. Los issues deben enlazar a estos códigos (`UI-01`, etc.).

---

## 4. Checklist base por PR

- [ ] Issue vinculado al plan (etiqueta `recovery-plan`).
- [ ] `pnpm lint && pnpm typecheck && pnpm test` y la suite E2E necesaria.
- [ ] Storybook actualizado y capturas si la UI cambia.
- [ ] Documentación tocada o marcada como `⚠️ actualizar` cuando aplique.
- [ ] `pnpm docs:verify` en verde.
- [ ] Actualización del tablero (estado “En revisión” / “Done”).

---

## 5. Comunicación

- Tablero central (GitHub Projects) con columnas: Backlog, En progreso, En revisión, Listo.
- Daily (async) en Slack `#plataforma-brisa` con progreso de cada swimlane.
- Weekly demo (jueves) con evidencia (Storybook deploy, métricas, screenshots).
- Incidentes → seguir `docs/operations/runbooks/incident-response.md`.

---

## 6. Seguimiento

- Mantén este documento como resumen vivo.
- Cuando se complete el plan, mover secciones históricas a `docs/archive/2025-q4-recovery.md` y actualizar README con estado real.
- Cualquier cambio mayor debe anunciarse por PR y quedar trazado en issues.

Vamos paso a paso. Sin álgebra imaginaria: CI verde, UI usable y documentación honesta. 💚
