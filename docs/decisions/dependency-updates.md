# Decisión: Estrategia de Actualización de Dependencias

**Fecha:** 14 de octubre de 2025  
**Autores:** Equipo Brisa Cubana (Codex CLI)  
**Contexto:** Dependabot creó dos PRs con actualizaciones mayores que rompieron pipelines.

## 1. PRs evaluados

| PR                                                                    | Estado  | Motivo                                                                                                                                                                                  |
| --------------------------------------------------------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `#34` · `dependabot/npm_and_yarn/production-dependencies-d7805deed1`  | Cerrado | Actualizaba 11 dependencias críticas (Tailwind 4, Zod 4, Prisma 6.17, bcryptjs 3…). Rompían smoke tests, CodeQL y despliegues preview. Se requiere migración manual controlada.         |
| `#33` · `dependabot/npm_and_yarn/development-dependencies-db0607e638` | Cerrado | Actualizaba dev deps (`@testing-library/react` 16, `@types/node` 24…). Requiere instalación explícita de nuevos peer dependencies y ajuste de tooling. Se pospone para sprint dedicado. |

> Nota: Los PRs se cerraron el 14-oct-2025 con comentario explicativo; la automatización de Dependabot permanece habilitada.

## 2. Riesgos detectados

1. **Tailwind CSS 4.x** – Cambios de API y nueva filosofía (sin `tailwind.config.js` clásico). Requiere refactor de estilos y build pipeline.
2. **Zod 4.x** – Elimina `required_error`, cambios en inferencia y `.refine`. Afecta validaciones en API y web.
3. **Prisma 6.17.x** – Cambios en motores; necesita regenerar cliente, validar seeds y pipelines.
4. **bcryptjs 3.x** – Cambios en export default, posibles ajustes en `hashPassword`.
5. **@testing-library/react 16.x** – Peer dependency explícita de `@testing-library/dom`; puede romper tests si no se alinea.

## 3. Plan de acción incremental

| Fase                                        | Alcance                    | Tareas                                                                                                                                        |
| ------------------------------------------- | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **Fase 0** (completada)                     | Integridad actual          | Cerrar PRs riesgosos, documentar decisión, automatizar verificación de versiones.                                                             |
| **Fase 1** (completada 14-oct-2025, PR #36) | Actualizaciones seguras    | Subir patch/minor: `next 15.5.5`, `pino-pretty 13.1.2`, `date-fns 3.x → 3.latest`, `jsdom 24.x → 24.latest`. Validar con `pnpm test` y smoke. |
| **Fase 2** (completada 14-oct-2025, PR #37) | Herramientas de desarrollo | Actualizar dev deps (PR #33) en rama dedicada. Añadir `@testing-library/dom` y ajustar configuración ESLint/TypeScript si es necesario.       |
| **Fase 3** (completada 14-oct-2025, PR #38) | Prisma & bcrypt            | Rama `upgrade/major-deps-2025-10`: actualizar Prisma 6.17+, regenerar cliente, re-ejecutar seeds, ajustar `hashPassword`, revisar CodeQL.     |
| **Fase 4** (completada 14-oct-2025, PR #39) | Zod 4.x                    | Migrar validaciones reemplazando `required_error`, revisar `safeParse` y tipos. Ejecutar test suite + contract tests.                         |
| **Fase 5** (diferida Q1 2026)               | Tailwind 4.x               | Ejecutar plan de migración documentado en `docs/decisions/tailwind-v4-plan.md` (upgrade tooling, config CSS, QA visual, rollout).             |

Cada fase debe:

1. Trabajarse en rama propia (`upgrade/<fase>-yyyy-mm`).
2. Ejecutar `pnpm docs:verify`, `pnpm lint`, `pnpm typecheck`, `pnpm test` y e2e necesario.
3. Actualizar `CHANGELOG.md` y enlazar a esta decisión.

## 4. Automatizaciones introducidas

- Script `scripts/verify-versions.mjs` para sincronizar versiones (`pnpm verify:versions`).
- Pre-commit hook y pipeline (`project-pipeline.yml`) ejecutan el script para evitar desincronización código↔docs.

## 5. Próximos pasos

1. ~~Completar Fase 4 (Zod 4.x)~~ ✅ COMPLETADA (PR #39).
2. Evaluar Fase 5 (Tailwind 4.x) – DIFERIDA para Q1 2026; revisar `docs/decisions/tailwind-v4-deferral.md` y el plan operativo `docs/decisions/tailwind-v4-plan.md` antes de retomar trabajos (Issue #40).
3. Mantener Dependabot activo pero revisar manualmente cada PR conforme a esta estrategia.

---

## 6. Verificación de release 0.2.8

- Etiqueta `v0.2.8` publicada el 14-oct-2025 con CRUD 100 % RESTful (soft delete en servicios, propiedades, reservas y usuarios) y validación `isActive` en login.
- Despliegues Vercel (`vercel[bot]`) y pipelines (`CI`, `CodeQL`) ejecutándose en verde sobre el commit `5254ef4`.
- Cambios documentados en `CHANGELOG.md` y OpenAPI (`docs/reference/openapi.yaml`) sincronizados con la versión 0.2.8.

**Registro histórico:** Esta decisión se revisará al retomar la Fase 5 o antes del siguiente ciclo de release, lo que ocurra primero.
