# Bundle Analyzer – Baseline 20-oct-2025

**Comando:** `pnpm analyze:web`  
**Salida:** `apps/web/.next/analyze/{client,edge,nodejs}.html` (HTML interactivos)

## Métricas clave (Next.js 15.5.5)

- First Load JS compartido: **103 kB** (↓ ~81 kB vs. snapshot inicial)
- Chunk `static/chunks/8145…js` (Sentry bundle diferido): 103 kB  
  ↳ se descarga tras `requestIdleCallback`, evitando bloquear el render inicial.
- Chunk `929f44d1-…js` (React DOM client): 54.4 kB
- Ruta `/panel`: 20.1 kB; `/clientes/[customerId]`: 12.6 kB; `/checkout`: 10.6 kB
- Middleware bundle: 161 kB

## Observaciones

- Lazy load de `@sentry/nextjs` reduce la carga inicial (Sentry se inicializa vía `requestIdleCallback`).
- Objetivo <500 kB total se mantiene; próximos candidatos: revisar dependencias en chunk React DOM (54 kB) y runtime Next (45 kB).
- Mantener los reportes generados como referencia histórica hasta la próxima corrida.

## Próximos pasos

1. Automatizar `pnpm analyze:web` en nightly mensual (modo artefacto) para detectar crecimientos.
2. Evaluar `@next/bundle-analyzer` output para identificar módulos con alto peso (p.ej. componentes de portal y panel).
3. Registrar hallazgos en `docs/tech-debt/legacy-chunk-885.md` cuando se detecten regresiones.
