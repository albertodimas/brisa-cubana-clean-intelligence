# Storybook Coverage – Apps/Web

> **Última actualización:** 9 de noviembre de 2025  
> **Meta:** cubrir todos los componentes de UI y landing con stories básicos para validar props, theming y estados responsive.

## Resumen

| Área                 | Componentes totales | Stories existentes | Stories faltantes |
| -------------------- | ------------------- | ------------------ | ----------------- |
| UI (carpeta `ui/`)   | 40                  | 40                 | 0                 |
| Landing (`landing/`) | 12                  | 12                 | 0                 |
| Managers/layouts     | 6                   | 0                  | 6                 |
| **Total**            | **58**              | **52**             | **6**             |

- **Stories actuales UI:** `accordion`, `alert`, `badge`, `breadcrumbs`, `button`, `card`, `checkbox`, `chip`, `count-up`, `dialog`, `dropdown-menu`, `empty-state`, `export-button`, `filter-chips`, `gradient-mesh`, `help-icon`, `infinite-list`, `input`, `kpi-card`, `label`, `pagination`, `page-transition`, `parallax`, `progress`, `radio`, `scroll-area`, `scroll-progress`, `scroll-reveal`, `search-bar`, `select`, `skeleton`, `spinner`, `switch`, `tabs`, `table`, `textarea`, `theme-toggle`, `tilt-card`, `toast`, `tooltip`.
- **Stories actuales Landing:** `animated-hero`, `animated-timeline`, `before-after-slider`, `faq-section`, `lead-capture-form`, `marketing-link`, `night-shift-media`, `pricing-card-3d`, `pricing-tiers`, `testimonial-card`, `video-section`, `kpi-card`.
- **Prioridad GA (WS1):** completar al menos los 33 componentes base + 12 landing antes del freeze de GA; managers/layouts siguen inmediatamente después para validar panel operativo.

## Checklist – Componentes UI (33)

1. [x] `accordion`
2. [x] `alert`
3. [x] `badge`
4. [x] `breadcrumbs`
5. [x] `checkbox`
6. [x] `chip`
7. [x] `dialog`
8. [x] `dropdown-menu`
9. [x] `export-button`
10. [x] `gradient-mesh`
11. [x] `help-icon`
12. [x] `infinite-list`
13. [x] `input`
14. [x] `label`
15. [x] `page-transition`
16. [x] `parallax`
17. [x] `progress`
18. [x] `radio`
19. [x] `scroll-area`
20. [x] `scroll-progress`
21. [x] `scroll-reveal`
22. [x] `search-bar`
23. [x] `select`
24. [x] `skeleton`
25. [x] `spinner`
26. [x] `switch`
27. [x] `table`
28. [x] `tabs`
29. [x] `textarea`
30. [x] `theme-toggle`
31. [x] `tilt-card`
32. [x] `toast`
33. [x] `tooltip`

## Checklist – Componentes Landing (12)

1. [x] `animated-hero`
2. [x] `animated-timeline`
3. [x] `before-after-slider`
4. [x] `faq-section`
5. [x] `lead-capture-form`
6. [x] `marketing-link`
7. [x] `night-shift-media`
8. [x] `pricing-card-3d`
9. [x] `pricing-tiers`
10. [x] `testimonial-card`
11. [x] `video-section`
12. [x] `kpi-card` (landing variant)

> Recomendación: reutilizar mocks de `apps/web/.storybook/mocks` y crear `fixtures.ts` sencillos con datos de marketing para mantener stories sin dependencias de API.

## Checklist – Managers & Layouts (6)

1. [x] `BookingsManager`
2. [x] `ServicesManager`
3. [x] `UsersManager`
4. [x] `PropertiesManager`
5. [x] `CustomersManager`
6. [x] `AdminPanel / Dashboard shell`

> Cada manager debe exponer estados: loading inicial, filtros activos, acción exitosa y acción con error (usando `ActionResult`). Se pueden simular hooks con mocks estáticos.

## Próximos pasos

1. Crear stories para los componentes marcados como prioridad GA siguiendo el orden (UI → Landing → Managers).
2. Incorporar `pnpm storybook:build` al pipeline y publicar preview una vez el build sea estable.
3. Automatizar un script (`scripts/check-storybook-coverage.mjs`) que compare componentes vs stories y falle en CI si la cobertura cae.
4. Actualizar este documento cada vez que se añadan stories nuevos para mantener el conteo súper visible.
