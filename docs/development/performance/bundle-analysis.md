# Bundle Analyzer – Baseline 31-oct-2025 (Next.js 16.0.0)

> ✅ **Actualizado:** corte 31-oct-2025 tras migración a Next.js 16 con build forzado a Webpack (`--webpack`).  
> Se conservan los reportes HTML/JSON en `apps/web/.next/analyze/` para auditorías posteriores.

**Comandos recomendados**

- `pnpm --filter @brisa/web analyze -- --webpack` → genera los reportes HTML (`client.html`, `edge.html`, `nodejs.html`).
- `ANALYZE_MODE=json pnpm --filter @brisa/web analyze -- --webpack` → emite `client.json`, `edge.json`, `nodejs.json`.
- `node scripts/performance/generate-bundle-summary.mjs --markdown` → calcula métricas (First Load, rutas clave, middleware) a partir del último build.

## Resumen del baseline nuevo

<!-- BUNDLE_SUMMARY:start -->

- **First Load JS compartido (gzip): 117.75 kB** (396.59 kB sin comprimir) distribuidos en 4 chunks. Los más pesados: `static/chunks/a941743b-f89ae0077888149a.js` (60.87 kB gzip) y `static/chunks/3568-c480df771cd6bff7.js` (53.77 kB gzip).
- **Chunk diferido de Sentry:** `static/chunks/6863.0da212aa33765fc5.js` → 354.50 kB analizados / 115.75 kB gzip. Sigue cargándose tras `requestIdleCallback`.
- **Middleware (`server/middleware.js`): 1631.64 kB gzip** (4478.54 kB sin comprimir). El crecimiento proviene de Auth.js 5 beta + rutas híbridas; documentado como foco de optimización.
<!-- BUNDLE_SUMMARY:end -->

## Rutas críticas (gzip / raw)

<!-- BUNDLE_ROUTES:start -->

| Ruta                                          | Chunk                                                                                   | Tamaño gzip  | Tamaño raw |
| --------------------------------------------- | --------------------------------------------------------------------------------------- | ------------ | ---------- |
| `/`                                           | `static/chunks/app/page-6ba55173262991c2.js`                                            | **6.75 kB**  | 21.66 kB   |
| `/panel`                                      | `static/chunks/app/panel/page-bf2c4416b5d21464.js`                                      | **13.03 kB** | 58.83 kB   |
| `/clientes`                                   | `static/chunks/app/clientes/page-7dc15a4416a444fd.js`                                   | **0.47 kB**  | 1.59 kB    |
| `/clientes/[customerId]`                      | `static/chunks/app/clientes/[customerId]/page-f80e960a970f1b67.js`                      | **6.57 kB**  | 25.04 kB   |
| `/clientes/[customerId]/reservas/[bookingId]` | `static/chunks/app/clientes/[customerId]/reservas/[bookingId]/page-68dcbc201c769bd7.js` | **5.54 kB**  | 19.28 kB   |
| `/checkout`                                   | `static/chunks/app/checkout/page-c028d0b0653f4efb.js`                                   | **5.56 kB**  | 19.07 kB   |
| `/login`                                      | `static/chunks/app/login/page-84de322a574c2e39.js`                                      | **1.42 kB**  | 3.58 kB    |

<!-- BUNDLE_ROUTES:end -->

## Observaciones

- **Objetivo First Load <120 kB gzip** se mantiene pese al upgrade; vigilar que la suma compartida no crezca tras integrar nuevos providers React 19.
- **Middleware** supera ampliamente el umbral histórico (161 kB). Se requiere tarea específica para segmentar middlewares (Auth.js + rewrites) y estudiar migración a `next-safe-middleware`.
- No se observaron chunks críticos adicionales: la carga diferida de Sentry sigue evitando impacto inmediato en el TTFB inicial.
- Incluir `scripts/performance/generate-bundle-summary.mjs` en el workflow `Monthly Bundle Audit` para guardar resultados como artefacto (`bundle-summary.json` + reporte Markdown).

## Historial (Next.js 15.5.6 – 20-oct-2025)

- First Load JS compartido: **103 kB** (↓ ~81 kB vs. snapshot inicial).
- Chunk `static/chunks/8145…js` (Sentry bundle diferido): 103 kB — se descargaba tras `requestIdleCallback`.
- Chunk `929f44d1-…js` (React DOM client): 54.4 kB.
- Ruta `/panel`: 20.1 kB; `/clientes/[customerId]`: 12.6 kB; `/checkout`: 10.6 kB.
- Middleware bundle: 161 kB.
