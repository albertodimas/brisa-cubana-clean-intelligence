# Project Pipeline – Fase de recuperación

> Última edición: 31-oct-2025  
> Objetivo: evitar la parálisis de desarrollo definiendo un flujo único desde la captura de tareas hasta el deployment.

---

## 1. Tablero vivo

- Herramienta sugerida: **GitHub Projects (Beta)** → crear tablero “Recovery 2025 Q4”.
- Columnas mínimas:
  1. **Backlog** – items con descripción y criterios de aceptación.
  2. **In Progress** – rama creada, responsable asignado.
  3. **Review / QA** – PR abierta, CI verde, Storybook actualizado.
  4. **Done** – mergeado en `main`, monitoreo post-deploy programado.
- Cada issue debe enlazar con el hito correspondiente del [plan de recuperación](../overview/recovery-plan.md) (`UI-01`, `DOC-01`, etc.).

## 2. Cadencias

- **Daily async (Slack #plataforma-brisa)**  
  Formato sugerido:
  ```
  UI/UX → progreso + bloqueos
  Perf/Obs → métricas revisadas
  Docs/Process → actualizaciones pendientes
  ```
- **Weekly review (jueves)**
  - Demo: Storybook cromático, capturas o métricas.
  - Checklist: CI verde, docs actualizados, env manifiesto sin cambios inesperados.
- **Retro quincenal** centrada en throughput y externalidades (dependencias, acceso a diseño, etc.).

## 3. Definición de listo

Un issue puede pasar a “Done” únicamente si:

- Cuenta con PR mergeada en `main` y etiqueta `recovery-plan`.
- Se ejecutó la suite correspondiente (`pnpm test:e2e:smoke` o `pnpm test:e2e:critical`).
- Se actualizó la documentación impactada (o se dejó marcado `⚠️ actualizar`).
- Las variables de entorno tocadas se documentaron en `config/env.manifest.json`.
- Se añadieron/actualizaron stories de Storybook cuando aplica UI.

## 4. Roles/responsables

- **Platform Lead** – vigila plan general, mantiene manifest de env y estado semanal.
- **Frontend/UI** – historias UI/UX, Storybook, accesibilidad.
- **Backend/API** – endpoints, seeds, observabilidad API.
- **QA/Automation** – Playwright, reporting, cobertura.
- **Producto/Stakeholders** – validan contenido y priorización (al menos 1 checkpoint semanal).

## 5. Herramientas recomendadas

- Project board (GitHub) + vistas guardadas por swimlane.
- Storybook deploy (Chromatic o GitHub Pages) enlazado desde cada PR.
- Checklist de PR integrada al template (ver `docs/overview/recovery-plan.md#4-checklist-base-por-pr`).
- `pnpm env:status` en pre-push hook cuando haya cambios a `.env.local`.

---

Este flujo debe revisarse al cierre de cada sprint semanal. Cuando completemos la fase de recuperación podemos migrar el historial a `docs/archive/` y normalizar el pipeline.
