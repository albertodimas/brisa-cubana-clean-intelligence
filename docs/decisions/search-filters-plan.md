# Plan de Implementación: Búsquedas y Filtros en Listados Operativos

**Fecha:** 14 de octubre de 2025  
**Estado:** PLANIFICADO (Sprint objetivo: Q1 2026, posterior a Tailwind v4)  
**Stakeholders:** Equipo Frontend, Equipo Producto, QA

## 1. Contexto

Los listados de servicios, propiedades, reservas y usuarios ya utilizan paginación cursor-based y pueden manejar centenares de registros. Sin embargo, la UI actual sólo expone controles de paginación (“Load more”) y filtros básicos para reservas. La documentación de producto (`docs/product/user-management.md:470`) identifica la ausencia de búsqueda como un bloqueo para operaciones reales.

## 2. Objetivo

Habilitar búsqueda y filtros combinables (texto + filtros específicos) en las vistas operativas para servicios, propiedades, reservas, clientes y usuarios, manteniendo compatibilidad con la paginación cursor-based existente.

## 3. Requisitos Funcionales

1. **Back-end:**
   - Extender `/api/services`, `/api/properties`, `/api/bookings`, `/api/customers`, `/api/users` con query param `search`.
   - Permitir filtros específicos por recurso (p.ej. `?status=`, `?city=`, `?role=`) combinables con `search`.
   - Mantener paginación cursor-based y soft delete filtrado.

2. **Front-end:**
   - Agregar barra de búsqueda/interfaz de filtros por recurso.
   - Debounce de 300 ms y estado de “buscando…” para UX fluida.
   - Mostrar chips o resumen de filtros activos.
   - Preservar compatibilidad con teclado y accesibilidad (labels claros, `aria-*`).

3. **QA & Documentación:**
   - Tests Vitest para la lógica de hooks y adaptadores.

- Tests Playwright (`@critical`) para escenarios clave (búsqueda exitosa, sin resultados, limpieza de filtros).
- Actualizar OpenAPI y docs de producto con ejemplos.

## 4. Plan de Trabajo (Estimado 5-7 horas)

### Fase 1 – Diseño de API (1.5 h)

- Definir interfaz común `SearchableQuery` en `apps/api/src/lib/pagination.ts`.
- Actualizar repositories (`ServiceRepository`, `PropertyRepository`, etc.) con cláusulas `contains` case-insensitive.
- Añadir validaciones en `apps/api/src/routes/*` (`zod`) para nuevos parámetros.
- Actualizar tests en `app.integration.test.ts` (1 por recurso).

### Fase 2 – Hooks y Componentes (2 h)

- Extender `usePaginatedResource` para aceptar `search` y filtros arbitrarios.
- Crear componente `SearchBar` reutilizable (input + botón limpiar).
- Inyectar controles en `ServicesManager`, `PropertiesManager`, `BookingsManager`, `CustomersManager`, `AdminPanel` (usuarios).
- Añadir estados visuales (spinner, mensaje “sin resultados”).

### Fase 3 – QA Automatizada (1.5 h)

- Vitest: unidad para hook (`use-paginated-resource.test.ts`) cubriendo cambios de query y sucesión de cursores.
- Playwright: nuevo archivo `tests/e2e/search-and-filters.spec.ts` con escenarios:
  1. Buscar servicio por nombre.
  2. Filtrar usuarios por rol.
  3. Buscar reserva inexistente → mensaje “sin resultados”.
- Etiquetar pruebas con `@critical` para suite principal.

### Fase 4 – Documentación y Rollout (0.5-1 h)

- OpenAPI: extender documentación de parámetros de búsqueda/filtros.
- Docs: actualizar `docs/product/*` y `docs/overview/status.md`.
- Changelog + entrada en `docs/decisions/dependency-updates.md` (Fase 6).
- Demo interna + checklist QA.

## 5. Riesgos y Mitigaciones

| Riesgo                                    | Probabilidad | Impacto | Mitigación                                                                                              |
| ----------------------------------------- | ------------ | ------- | ------------------------------------------------------------------------------------------------------- |
| Consultas costosas en tablas grandes      | Media        | Medio   | Índices en columnas usadas por búsquedas (`name`, `email`, `city`) y limitar resultados por paginación. |
| UX lenta por debounce insuficiente        | Media        | Bajo    | Ajustar debounce a 300 ms, mostrar skeletons durante espera.                                            |
| Inconsistencia entre filtros y paginación | Baja         | Medio   | Resetear cursor al cambiar filtros; pruebas en hook con escenarios combinados.                          |
| Falta de cobertura E2E                    | Baja         | Alto    | Añadir escenarios Playwright y ejecutarlos en suite `critical`.                                         |

## 6. Métricas de Éxito

- Tiempo de respuesta de búsquedas < 400 ms en dataset de 1 000 registros (ambiente staging).
- 100% de los listados con controles visibles y accesibles (`@testing-library/axe` sin errores).
- +5 pruebas nuevas (3 Vitest + 2 Playwright) en suites existentes.
- Feedback positivo de usuarios internos (operaciones) durante sesión de validación.

## 7. Dependencias

- **Previas:** Release Tailwind v4 (Fase 5) para evitar rehacer componentes de UI.
- **Paralelas:** Ninguna, aunque se recomienda ejecutar junto a iniciativa de auditoría de usuarios para maximizar valor operativo.

## 8. Timeline sugerido

- **Semana 1 (después de Tailwind v4):** Fases 1 y 2.
- **Semana 2:** Fase 3 + documentación.
- **Entrega estimada:** Dentro de sprint “Q1 2026 Tailwind v4” + 1 semana buffer.

---

**Última revisión:** 14 de octubre de 2025. Actualizar si cambian prioridades o arquitecturas de datos.
