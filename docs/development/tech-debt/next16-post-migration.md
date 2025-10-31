# Next.js 16 – seguimiento post migración

_Última actualización: 31 oct 2025_

La migración a **Next.js 16.0.0** (con React 19.2.0) ya se integró en `main`. Este documento reemplaza el antiguo plan de migración y recoge los pendientes detectados durante la fase de recuperación.

## Estado actual

- `apps/web` se ejecuta en Next.js 16 con Turbopack en dev y build CLI en CI/CD.
- Storybook funciona mediante `@storybook/react-vite`; el preset oficial `@storybook/nextjs` aún no soporta Next 16.
- Auth.js 5 beta, Sentry 10.22.x, Stripe y PostHog operan con la nueva versión, pero necesitan monitoreo continuo.
- Suites Vitest/Playwright y `pnpm docs:verify` pasan con Node 22.13.0 y pnpm 10.18.0.

## Pendientes críticos

1. **Storybook / Design System**
   - Añadir stories faltantes (managers, layouts, componentes de landing).
   - Resolver warnings `use client` al generar build (`storybook:build`).
   - Publicar Storybook (preview) y vincularlo al tablero de recuperación.

2. **Bundler & Performance**
   - Generar baseline con `pnpm --filter @brisa/web analyze -- --webpack` y derivar métricas vía `node scripts/performance/generate-bundle-summary.mjs`.
   - Actualizar `docs/development/performance/bundle-analysis.md` y registrar cambios en `Monthly Bundle Audit`.
   - Reducir el tamaño del middleware (`server/middleware.js` → 1.63 MB gzip) segmentando middlewares y revisando dependencias de Auth.js.

3. **Auth.js / NextAuth**
   - Verificar compatibilidad de releases posteriores (cuando se publique soporte oficial Next 16).
   - Documentar cualquier workaround aplicado en `auth.ts`.

4. **CI/CD**
   - Migrar workflows a `actions/setup-node@v4` y habilitar `corepack enable`.
   - Añadir jobs opcionales para Storybook y bundle analysis.

5. **Observabilidad**
   - Validar que Sentry y PostHog capturen eventos correctamente con Turbopack.
   - Revisar alertas de portal/checkout tras cada despliegue.
   - ✅ Migración completada (31-oct-2025): inicialización de Sentry ahora vive en `instrumentation-client.ts`, eliminando la advertencia `sentry.client.config.ts` en builds.

## Checklist post upgrade

- [x] `pnpm lint`, `pnpm typecheck`, `pnpm test`.
- [x] `pnpm test:e2e:critical`.
- [x] `pnpm docs:verify`.
- [x] Deploy preview verificado.
- [ ] Storybook build estable en CI.
- [ ] Baseline de bundle actualizado.
- [ ] Documentación UI/UX y overview sincronizadas.

## Acciones sugeridas

- Crear issue `UI-Storybook-coverage` para completar stories pendientes.
- Agendar tarea semanal en el tablero “Recovery 2025 Q4” para revisar compatibilidad de Auth.js/Sentry.
- Automatizar script que compare los pesos de bundle y lance alertas en `#alerts-performance`.

## Referencias

- Plan de recuperación: [docs/overview/recovery-plan.md](../../overview/recovery-plan.md)
- Guía UI/UX actualizada: [docs/ui-ux/guide.md](../ui-ux/guide.md)
- Checklist QA: [docs/development/qa/regression-checklist.md](../qa/regression-checklist.md)
