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

- Next.js 15.5.6 aún sirve polyfills por compatibilidad con navegadores _legacy_ cuando se usan ciertos módulos del App Router.
- El runtime podría eliminar estos polyfills en versiones futuras (canales canary / nightly) o habilitando nuevas flags (`nextConfig.experimental.nextScriptWorkers`, etc.).

## Plan de acción

1. **Monitorear releases de Next.js**: revisar changelog ≥ 15.5.x en busca de mejoras relacionadas con polyfills y `legacy-javascript`.
2. **Probar en rama feature (trimestral o ante release relevante)**:
   - Actualizar a la versión estable más reciente (`pnpm up next@latest react@latest react-dom@latest`).
   - Ejecutar `pnpm --filter @brisa/web build && pnpm exec lhci collect --url=http://127.0.0.1:4123/?lhci=1 ...` para validar si el chunk desaparece o reduce.
3. **Fallback**: en caso de persistir, abrir issue en `vercel/next.js` compartiendo la evidencia y el reporte Lighthouse.
4. **Tracking**: anotar resultados en este archivo (fecha, versión probada, conclusiones).

## Seguimiento automatizado

- El workflow `Monthly Bundle Audit` (`.github/workflows/monthly-bundle.yml`) corre el primer día del mes y adjunta el reporte de `pnpm --filter @brisa/web analyze` como artefacto. Revisa el artefacto y actualiza esta ficha con cualquier cambio en tamaños o presencia del chunk 885.
- Si la auditoría detecta que el chunk desapareció o se redujo significativamente, programa un PR para actualizar Next.js y cerrar esta deuda técnica.

## Plan operacional (actualizado 27-oct-2025)

1. **Responsable primario:** Equipo Plataforma (`@oncall-platform`). Custodio de respaldo: Equipo Frontend (Slack `@frontend-guild`).
2. **Cadencia:**
   - 1er lunes de cada mes, antes de las 12:00 ET, revisar el artefacto `monthly-bundle` y registrar hallazgos en `docs/performance/bundle-analysis.md`.
   - Incluir el resultado en la reunión de observabilidad (lunes 10:00 ET) cuando se detecten variaciones ≥10 kB en el chunk 885 o cuando Lighthouse siga flaggeando `legacy-javascript`.
3. **Checklist mensual:**
   - Descargar artefacto `apps/web/.next/analyze/client.html` del workflow `Monthly Bundle Audit`.
   - Confirmar tamaño del chunk `885-*.js` y compararlo con el baseline previo (ver tabla en `bundle-analysis.md`).
   - Ejecutar `pnpm exec lhci autorun --config=.lighthouserc.preview.json` contra el último deploy preview si se observan cambios.
   - Documentar en este archivo (Fecha, Versión Next.js, Resultado) y abrir issue en caso de regresión.
4. **Escalación:** Si el chunk supera los 180 kB o Lighthouse degrada la puntuación de Performance < 90, crear ticket urgente en Linear (`prio: high`) y mencionarlo en `#alerts-performance`.

## Notas

- Esta advertencia no bloquea CI (clasificada como `warn`), pero se monitorea para mantener los budgets de performance alineados a producción.
- Cualquier cambio debe registrar su resultado en esta ficha y en `CHANGELOG.md`.
