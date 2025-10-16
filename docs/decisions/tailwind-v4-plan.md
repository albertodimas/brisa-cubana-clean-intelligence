# Plan de Migración: Tailwind CSS v3 → v4 (Fase 5)

**Fecha:** 14 de octubre de 2025  
**Estado:** PLANIFICADO (ejecución prevista Q1 2026)  
**Issue de seguimiento:** #40 “Phase 5: Tailwind v4 migration”

## 1. Estado actual

- **Versión vigente:** Tailwind CSS 3.4.18 (`apps/web`)
- **Versión objetivo:** Tailwind CSS 4.1.14
- **Cobertura de estilos:** 18 archivos `.tsx` con 403 ocurrencias de `className`
- **Configuración:** `tailwind.config.ts` con tema custom `brisa` (10 colores)
- **Uso de `@apply`:** 1 archivo (`app/globals.css`) con 4 directivas
- **Compatibilidad Node.js:** 22.13.0 (Active LTS actual). Ejecutaremos la migración cuando Node.js 24 alcance estatus LTS (28-oct-2025) y pase validaciones en CI/CD.

### Novedades Tailwind 4.1 (octubre 2025)

- Configuración 100% basada en CSS (`tailwind.config.css`) y tokens mediante `@theme`.
- Reemplazo de `@tailwind base/components/utilities` por `@import "tailwindcss"` y uso de capas automáticas.
- Modo JIT por defecto con tree-shaking mejorado; es obligatorio limpiar utilidades huérfanas antes del upgrade.
- Se requiere `@tailwindcss/postcss` como plugin dedicado; la CLI incorpora verificación de navegadores (Safari ≥16.4, Chrome ≥111, Firefox ≥128).
- Los generadores de colores aprovechan `color-mix()`; revisar contrastes en tema `brisa` y ajustar si el preprocesado produce tonos distintos.

## 2. Objetivo

Migrar el front-end web de Tailwind v3.4.18 a v4.1.14 manteniendo paridad funcional y visual, habilitando la nueva configuración basada en CSS y evitando regresiones en la experiencia de usuario.

## 3. Alcance

- Actualización de dependencias (`tailwindcss`, `@tailwindcss/postcss`)
- Conversión de configuración (`tailwind.config.ts` → CSS con `@theme`)
- Ajustes en `globals.css`, `postcss.config.mjs` y componentes que dependan de utilidades obsoletas
- Validación completa (lint, typecheck, unit tests, build, Playwright, QA manual)
- Documentación, changelog y cierre del Issue #40

## 4. Plan de migración (6–8 horas estimadas)

### Fase 5.1 – Preparación y validación (~1 h)

1. Crear rama `upgrade/tailwind-v4`.
2. Confirmar Node.js ≥ 20.
3. Ejecutar `npx @tailwindcss/upgrade`.
4. Revisar cambios automatizados y respaldar configuración actual.

### Fase 5.2 – Migración de configuración (~2 h)

1. Actualizar dependencias:
   - `tailwindcss` → `^4.1.14`
   - Añadir `@tailwindcss/postcss` (requerido desde Tailwind 4.1)
2. Verificar compatibilidad con `autoprefixer` y `postcss`.
3. Migrar `tailwind.config.ts` a CSS:
   - Representar el tema `brisa` con `@theme`.
   - Ajustar `darkMode: "class"` a la sintaxis v4.
   - Revisar `content` (debería permanecer estable).
4. Actualizar `app/globals.css`:
   - Reemplazar directivas `@tailwind` por `@import "tailwindcss"`.
   - Migrar `@apply` (4 ocurrencias) según lineamientos v4.
   - Registrar colores custom `brisa-*` via `@theme`.
5. Actualizar `postcss.config.mjs`:
   - Cambiar plugin `tailwindcss` por `@tailwindcss/postcss`.

### Fase 5.3 – Validación de componentes (~2 h)

1. Revisar componentes críticos (botones, tarjetas, inputs, tablas, chips, etc.).
2. Buscar utilidades obsoletas o renombradas (p.ej. `shadow-sm` → `shadow-xs`).
3. Ejecutar:
   - `pnpm --filter @brisa/web build`
   - `pnpm --filter @brisa/web test`

### Fase 5.4 – Testing visual manual (~2 h)

1. Levantar entorno (`pnpm dev`).
2. Validar rutas clave:
   - `/login`
   - `/` (dashboard)
   - Toggle tema claro/oscuro (`theme-toggle.tsx`)
   - Componentes interactivos
3. Comparar antes/después con screenshots.
4. Verificar variables `brisa-*`, transiciones y responsive design.

### Fase 5.5 – Deploy a preview (~0.5 h)

1. Commit convencional:

   ```text
   feat(web)!: migrate to Tailwind CSS v4

   BREAKING CHANGE: Requires Safari 16.4+, Chrome 111+, Firefox 128+
   - Migrate configuration from JS to CSS
   - Update @tailwind directives to @import
   - Migrate custom brisa theme to CSS variables
   - Update PostCSS config to use @tailwindcss/postcss
   ```

2. Push a `upgrade/tailwind-v4`.
3. Verificar pipelines (lint, typecheck, tests, build).
4. Validar Vercel Preview.

### Fase 5.6 – QA y rollout (~1 h)

1. Ejecutar `pnpm test:e2e:full`.
2. Obtener visto bueno de stakeholders.
3. Crear PR hacia `main` con nota de breaking change.
4. Tras merge:
   - Monitorear Sentry durante 24 h.
   - Actualizar documentación y cerrar Issue #40.
   - Crear tag `v0.3.0` (major version por breaking change).

## 5. Riesgos y mitigaciones

| Riesgo                                  | Probabilidad | Impacto | Mitigación                                                         |
| --------------------------------------- | ------------ | ------- | ------------------------------------------------------------------ |
| Regresiones visuales en modo oscuro     | Media        | Alto    | QA manual exhaustivo + capturas comparativas                       |
| Incompatibilidad de colores `brisa-*`   | Baja         | Medio   | Validar variables CSS generadas por `@theme`                       |
| Cambios en `@apply`                     | Baja         | Bajo    | Sólo 4 ocurrencias; revisar tras `@tailwindcss/upgrade`            |
| Sintaxis de opacidad arbitraria (`/60`) | Media        | Medio   | Revisar utilidades tras upgrade y actualizar según docs v4         |
| Fallos de CI/CD                         | Baja         | Alto    | Pipelines bloqueantes + plan de rollback (`git revert` + redeploy) |

## 6. Checklist de ejecución

### Preparación

- [ ] Crear rama `upgrade/tailwind-v4`
- [ ] Verificar Node.js ≥ 20
- [ ] Respaldar `tailwind.config.ts` actual

### Migración

- [ ] Ejecutar `npx @tailwindcss/upgrade`
- [ ] Actualizar dependencias y `pnpm install`
- [ ] Migrar configuración a CSS con `@theme`
- [ ] Actualizar `globals.css` y directivas `@tailwind`
- [ ] Actualizar `postcss.config.mjs`
- [ ] Validar colores `brisa-*`

### Testing

- [ ] `pnpm lint`
- [ ] `pnpm typecheck`
- [ ] `pnpm build`
- [ ] `pnpm test` (42/42)
- [ ] QA manual (modo claro/oscuro + capturas)
- [ ] Verificar warnings del plugin `@tailwindcss/postcss` y compatibilidad de navegadores objetivo

### Deploy & QA

- [ ] Push a `upgrade/tailwind-v4`
- [ ] CI/CD en verde
- [ ] Validar Vercel Preview
- [ ] `pnpm test:e2e:full` (13/13)
- [ ] Aprobación de stakeholders

### Rollout

- [ ] PR con breaking changes documentados
- [ ] Merge a `main` + monitoreo Sentry (24 h)
- [ ] Actualizar `docs/decisions/dependency-updates.md`
- [ ] Actualizar `CHANGELOG.md`
- [ ] Cerrar Issue #40
- [ ] Crear tag `v0.3.0`

## 7. Comandos de referencia

```bash
# Preparación
git checkout -b upgrade/tailwind-v4
npx @tailwindcss/upgrade

# Instalación
pnpm install

# Validación local
pnpm lint && pnpm typecheck && pnpm test && pnpm build

# Testing manual
pnpm dev  # http://localhost:3000

# Deploy y PR
git add .
git commit -S -m "feat(web)!: migrate to Tailwind CSS v4"
git push -u origin upgrade/tailwind-v4

# Tag tras merge
git tag -s v0.3.0 -m "Release v0.3.0: Tailwind CSS v4 migration"
git push origin v0.3.0
```

## 8. Archivos previstos para modificación

- `apps/web/package.json`
- `apps/web/postcss.config.mjs`
- `apps/web/tailwind.config.ts` → `apps/web/tailwind.config.css`
- `apps/web/app/globals.css`
- Hasta 18 archivos `.tsx` con utilidades Tailwind
- Documentación: `docs/decisions/dependency-updates.md`, `CHANGELOG.md`, `docs/overview/status.md`

## 9. Criterios de éxito

- 100% de funcionalidades existentes siguen operativas.
- Cero regresiones visuales detectadas (comparación antes/después).
- 42/42 pruebas unitarias y 13/13 E2E pasando.
- CI/CD en verde sin ajustes manuales.
- Build ≤ 3 minutos.
- Sentry: tasa de error < 0.1% durante primeras 24 h post-deploy.
- Tag `v0.3.0` publicado con notas de breaking change.

## 10. Cronograma sugerido

- **Semana 1 (13–17 enero 2026):** Kick-off del sprint “Q1 2026 Tailwind v4” (milestone asignado). Ejecutar Fases 5.1–5.3, incluyendo la corrida inicial de `npx @tailwindcss/upgrade` y validación de dependencias.
- **Semana 2 (20–24 enero 2026):** QA visual, Vercel Preview y Playwright completo (Fases 5.4–5.6), preparación del PR y monitoreo post-merge.
- **Responsables propuestos:** Equipo Frontend (coordinar programación y cambios), Equipo QA (validaciones manuales y E2E) y stakeholders de producto para aprobación final.

> **Recordatorio 2025-10:** revisar la [guía oficial de migración Tailwind 4.1](https://tailwindcss.com/docs/upgrade-guide) y registrar hallazgos en el Issue #40 antes del 15-dic-2025 para reducir incertidumbre.

---

**Última revisión:** 14 de octubre de 2025  
Actualizar este plan tras la ejecución de `npx @tailwindcss/upgrade` o si Tailwind lanza versiones mayores con cambios relevantes.
