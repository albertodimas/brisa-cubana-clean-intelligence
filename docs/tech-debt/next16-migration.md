# Next.js 16 migration plan

_Última actualización: 28 oct 2025_

## Contexto

La aplicación `apps/web` está en Next.js 15.5.6 con React 19.2.0. Dependabot propuso actualizar `eslint-config-next` a 16.0.0, lo que implica migrar todo el proyecto a **Next.js 16** (App Router) y adoptar los cambios de React 19 + tooling asociado (SWC, lint, bundle analyzer, eslint, etc.).

Para prevenir interrupciones en producción hay que seguir una migración paso a paso, validando compatibilidad con integraciones críticas: NextAuth beta, Sentry, Stripe, PostHog, Tailwind 4, pipelines CI/CD y los despliegues de Vercel.

## Dependencias que deben subir en conjunto

- `next` → `16.x`
- `eslint-config-next` → `16.x`
- `@next/bundle-analyzer` → `16.x`
- `react` / `react-dom` → mantener en `19.x` compatible con Next 16
- `@types/react` / `@types/react-dom` → pares para React 19
- `@sentry/nextjs` → versión mínima compatible (>= 10.22.x, por confirmar)
- `next-auth` beta → revisar compatibilidad con React 19 y nuevas APIs de Next 16
- `typescript` → posiblemente >= 5.5 (revisar requisito exacto)
- `eslint` → 9.x ya está instalado, verificar peer requirements
- Herramientas de build (SWC bindings) y `@next/eslint-plugin-next` incluidos en `eslint-config-next`

## Cambios y verificaciones obligatorias

1. **Configuración de `next.config.mjs`:**
   - Revisar nuevas opciones de turbopack, instrumentation hooks y cambios en `experimental`.
   - Confirmar si `images.remotePatterns` u otras configuraciones necesitan ajustes.

2. **Servidor / Middleware:**
   - Validar que `middleware.ts` siga siendo válido (Next 16 estricta con Response headers).
   - Revisar `app/api` y rutas para confirmar compatibilidad con nuevas limitaciones de streaming/caching.

3. **App Router & Server Actions:**
   - Confirmar que todas las server actions (`"use server"`) funcionan con las nuevas restricciones de serialización.
   - Ajustar importaciones de `unstable_cache`/`revalidatePath` si cambiaron firmas.

4. **Linting y TypeScript:**
   - Ejecutar `pnpm lint` y `pnpm typecheck` tras actualizar dependencias; corregir reglas nuevas de `eslint-config-next@16`.
   - Verificar que `tsconfig.json` de `apps/web` incluya nuevos `skipLibCheck` o `types` si los requiere React 19.

5. **Testing / CI:**
   - Ejecutar `pnpm test` (Vitest) y suites e2e (`pnpm test:e2e:*`).
   - Actualizar workflows de GitHub Actions para usar `actions/setup-node@6` (ya planificado) y garantizar que los builds se ejecutan en Node 22.

6. **Vercel:**
   - `vercel pull` con env preview/prod para regenerar `build-output` metadata.
   - Validar que los despliegues preview y prod funcionen tras el upgrade (supervisión en `vercel dashboard`).

7. **Integraciones externas:**
   - **NextAuth**: revisar release notes (requiere `auth-helpers` compatibles con React 19).
   - **Sentry**: confirmar soporte para Next 16 (actualizar si es necesario).
   - **Stripe** y **PostHog**: verificar hooks clientes (script de monitoría).

## Plan de trabajo propuesto

1. Crear rama `feat/next16-migration`.
2. Actualizar dependencias core (`next`, `eslint-config-next`, `@next/bundle-analyzer`) y regenerar `pnpm-lock.yaml`.
3. Revisar y actualizar configuraciones (`next.config.mjs`, `eslint`).
4. Corregir errores de compilación/lint iniciales.
5. Ejecutar builds y suites de pruebas; corregir fallos.
6. Validar despliegue preview en Vercel.
7. Abrir PR con checklist y plan de QA.

## Notas pendientes

- Revisar documentación oficial de Next 16 para confirmar breaking changes exactos (en particular cambios en `Route Handlers` y `Image Optimization`).
- Confirmar compatibilidad de `@sentry/nextjs` y `next-auth` con React 19 (puede requerir versiones específicas).
- Ajustar scripts personalizados (`scripts/build.js`) si dependen de APIs internas de Next 15.
- Validar versión estable de `next-auth` compatible con Next 16; actualmente `5.0.0-beta.29` declara peer `next <=15`, por lo que la migración queda bloqueada hasta que el proyecto publique soporte oficial. Mostrar al equipo de auth las notas de release de Next 16.
- Confirmar que las integraciones (NextAuth, Sentry, PostHog monitor, Stripe, server actions) funcionan en un deploy preview y ejecutar suites e2e antes de mergear (`pnpm test:e2e:smoke` mínimo contra la URL preview).
