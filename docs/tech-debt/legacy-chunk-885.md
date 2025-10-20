# Seguimiento: advertencia `legacy-javascript` (chunk 885)

**Fecha:** 20 de octubre de 2025  
**Owner propuesto:** Plataforma (Next.js / Tooling)

## Contexto

Las auditorías Lighthouse sobre `https://brisa-cubana-clean-intelligence.vercel.app/?lhci=1` continúan reportando la advertencia:

- `legacy-javascript` sobre `/_next/static/chunks/885-*.js`
- Este chunk corresponde al runtime de Next.js (componentes App Router / metadata boundary) y se genera incluso tras migrar a `posthog-js-lite`, desactivar Speed Insights y definir navegadores modernos en `.browserslistrc`.

## Evidencias

1. Reporte más reciente: `pnpm exec lhci autorun --config=.lighthouserc.preview.json` → `https://storage.googleapis.com/lighthouse-infrastructure.appspot.com/reports/1760934999712-91302.report.html`.
2. El bundle `apps/web/.next/static/chunks/885-*.js` contiene polyfills (`Array.prototype.flat`, `Object.fromEntries`, etc.) empaquetados por Next.js, no por dependencias propias.

## Hipótesis

- Next.js 15.5.5 aún sirve polyfills por compatibilidad con navegadores _legacy_ cuando se usan ciertos módulos del App Router.
- El runtime podría eliminar estos polyfills en versiones futuras (canales canary / nightly) o habilitando nuevas flags (`nextConfig.experimental.nextScriptWorkers`, etc.).

## Plan de acción

1. **Monitorear releases de Next.js**: revisar changelog ≥ 15.5.x en busca de mejoras relacionadas con polyfills y `legacy-javascript`.
2. **Probar en rama feature**:
   - Actualizar a la versión estable más reciente (`pnpm up next@latest react@latest react-dom@latest`).
   - Ejecutar `pnpm --filter @brisa/web build && pnpm exec lhci collect ...` para validar si el chunk desaparece o reduce.
3. **Fallback**: en caso de persistir, abrir issue en `vercel/next.js` compartiendo la evidencia.

## Notas

- Esta advertencia no bloquea CI (clasificada como `warn`), pero se monitorea para mantener los budgets de performance alineados a producción.
- Cualquier cambio debe registrar su resultado en esta ficha y en `CHANGELOG.md`.
