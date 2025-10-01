# Design System Roadmap

> En construcción: Storybook 8/Playroom se publicará desde CI (`ENG-150`). Este índice agregará enlaces al build estático, tokens y guías de uso de `@brisa/ui`.

## Próximos pasos

1. Generar Storybook (`pnpm --filter=@brisa/ui storybook:build`) y publicar artefacto en CI (ver ADR-15, ticket `ENG-150`).
2. Exponer tokens de diseño y componentes principales con ejemplos interactivos.
3. Integrar pruebas visuales/regresión y enlaces a Playroom.

## Estado actual

- Componentes base (`Button`, `Badge`, `Card`, `Section`, `Metric`) disponibles en `packages/ui`.
- Documentación automática pendiente de pipeline (`ENG-150`).
- `pnpm docs:build:artifacts` genera la salida en `packages/ui/storybook-static` y `docs/_build/api`; adjuntar estos artefactos a releases.

## Enlaces rápidos (una vez generados)

- `packages/ui/storybook-static/index.html`: build estático generado por `pnpm docs:storybook`.
- `docs/_build/api/index.html`: referencia TypeDoc para consumir los componentes desde proyectos externos.
