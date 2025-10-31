# Bundle Analyzer – Baseline 31-oct-2025 (Next.js 16.0.0)

> ✅ **Actualizado:** corte 31-oct-2025 tras migración a Next.js 16 con build forzado a Webpack (`--webpack`).  
> Se conservan los reportes HTML/JSON en `apps/web/.next/analyze/` para auditorías posteriores.

**Comandos recomendados**

- `pnpm --filter @brisa/web analyze` → genera los reportes HTML (`client.html`, `edge.html`, `nodejs.html`) forzando `--webpack` automáticamente cuando `ANALYZE=true`.
- `ANALYZE_MODE=json pnpm --filter @brisa/web analyze` → emite `client.json`, `edge.json`, `nodejs.json` para automatizaciones.
- `node scripts/performance/generate-bundle-summary.mjs --markdown` → calcula métricas (First Load, rutas clave, middleware) a partir del último build.

## Resumen del baseline nuevo

<!-- BUNDLE_SUMMARY:start -->

- **First Load JS compartido (gzip): 117.90 kB** (396.90 kB sin comprimir) distribuidos en 4 chunks. Los más pesados: `static/chunks/a941743b-f89ae0077888149a.js` (60.87 kB gzip) y `static/chunks/3568-b2dfb9438c8aaed9.js` (53.77 kB gzip).
- **Chunk diferido de Sentry:** `static/chunks/7151.6fa2e87d20861733.js` → 398.44 kB analizados / 130.98 kB gzip. Sigue cargándose tras `requestIdleCallback`.
- **Middleware (`server/middleware.js`): 0 kB gzip** (0 kB sin comprimir). El crecimiento proviene de Auth.js 5 beta + rutas híbridas; documentado como foco de optimización.
<!-- BUNDLE_SUMMARY:end -->

## Rutas críticas (gzip / raw)

<!-- BUNDLE_ROUTES:start -->

| Ruta                                          | Chunk                                                                                   | Tamaño gzip  | Tamaño raw |
| --------------------------------------------- | --------------------------------------------------------------------------------------- | ------------ | ---------- |
| `/`                                           | `static/chunks/app/page-d4630cd8ab6a7eb4.js`                                            | **6.77 kB**  | 21.73 kB   |
| `/panel`                                      | `static/chunks/app/panel/page-cfeba919209d1534.js`                                      | **12.98 kB** | 58.77 kB   |
| `/clientes`                                   | `static/chunks/app/clientes/page-7dc15a4416a444fd.js`                                   | **0.47 kB**  | 1.59 kB    |
| `/clientes/[customerId]`                      | `static/chunks/app/clientes/[customerId]/page-67839bc31f945705.js`                      | **6.59 kB**  | 25.11 kB   |
| `/clientes/[customerId]/reservas/[bookingId]` | `static/chunks/app/clientes/[customerId]/reservas/[bookingId]/page-519314a25b4dfa78.js` | **5.40 kB**  | 18.99 kB   |
| `/checkout`                                   | `static/chunks/app/checkout/page-8b027ff29200310d.js`                                   | **5.55 kB**  | 19.11 kB   |
| `/login`                                      | `static/chunks/app/login/page-84de322a574c2e39.js`                                      | **1.42 kB**  | 3.58 kB    |

<!-- BUNDLE_ROUTES:end -->

## Observaciones

- **First Load JS** volvió a estar en objetivo (**117.8 kB gzip**) gracias a la carga diferida del SDK de Sentry en cliente.
- **Chunk Sentry Replay (`7151…js`)** queda deshabilitado por defecto en producción/desarrollo. En preview lo activamos con `SENTRY_REPLAYS_SESSION_SAMPLE_RATE=0.05` y `SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE=0.5` para validar la experiencia antes del GA.
- **Middleware** ya no existe en el edge bundle (0 kB). Los controles de sesión se mueven a `auth()` en layouts/páginas y guardas en los handlers (`app/api/portal/**`).
- **React/Next core**, `tailwind-merge` y `framer-motion` concentran ~440 kB raw. Revisar lazy-loading de animaciones y si `tailwind-merge` puede migrar a compilación estática.
- Incluir `scripts/performance/generate-bundle-summary.mjs` en el workflow `Monthly Bundle Audit` para guardar resultados como artefacto (`bundle-summary.json` + reporte Markdown).

## Historial (Next.js 15.5.6 – 20-oct-2025)

- First Load JS compartido: **103 kB** (↓ ~81 kB vs. snapshot inicial).
- Chunk `static/chunks/8145…js` (Sentry bundle diferido): 103 kB — se descargaba tras `requestIdleCallback`.
- Chunk `929f44d1-…js` (React DOM client): 54.4 kB.
- Ruta `/panel`: 20.1 kB; `/clientes/[customerId]`: 12.6 kB; `/checkout`: 10.6 kB.
- Middleware bundle: 161 kB.
