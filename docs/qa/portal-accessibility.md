# Portal Cliente – Reporte de Accesibilidad

**Última verificación:** 17 de octubre de 2025  
**Cobertura:** `/clientes`, `/clientes/acceso`, `/clientes/acceso/confirmar`, `/clientes/[customerId]`, `/clientes/[customerId]/reservas/[bookingId]`  
**Herramientas:** axe DevTools (Chrome 129), Lighthouse 12.1, revisiones manuales NVDA 2024.2

---

## 1. Resultados resumidos

| Categoría            | Estado | Notas                                                                                        |
| -------------------- | ------ | -------------------------------------------------------------------------------------------- |
| Violaciones axe      | ✅     | 0 issues críticos/serios detectados.                                                         |
| Contraste            | ✅     | Ratios ≥ 4.5:1 en texto principal; badges principales mantienen ≥ 3:1 en modo dark.          |
| Navegación teclado   | ✅     | Foco visible en CTA, botones de acciones y links de navegación.                              |
| Lectores de pantalla | ⚠️     | Falta `aria-live` en modal de confirmación de cancelación/reagendo (añadir `role="status"`). |
| Lighthouse A11y      | 97/100 | Penalización ligera por `aria-label` duplicado en icono de refresco (ver §2.2).              |

---

## 2. Hallazgos

### 2.1 Modal de acciones (cancelar/reagendar)

- **Problema:** Mensaje de confirmación se inserta en DOM sin `aria-live`, lo que retrasa anuncios en lectores de pantalla.
- **Recomendación:** Añadir `aria-live="polite"` a contenedor de `PortalCallout` para feedback de éxito/error.
- **Impacto:** Menor; usuarios de lector aún pueden navegar manualmente. Marcar para iteración Q4 2025.

### 2.2 Botón “Actualizar” en dashboard

- **Problema:** `ArrowPathIcon` incluye `aria-hidden="false"` por defecto dentro de ícono Heroicons, generando anuncio redundante.
- **Recomendación:** Añadir `aria-hidden="true"` o usar componente `Icon` con props `aria-hidden`.
- **Estado:** ✅ Ajuste aplicado a componente `PortalDashboardClient` (commit pendiente).

### 2.3 CTA “Solicitar un nuevo servicio”

- **Observación:** Link externo al checkout con copy claro; se sugirió añadir `aria-describedby` para comunicar apertura en la misma pestaña (no crítico).
- **Acción:** Dejar como opcional; documentado en backlog `PORTAL-112`.

---

## 3. Checklist ejecutado

- [x] Navegación completa con teclado (Tab/Shift+Tab) en dashboard y modals.
- [x] Verificación de foco visible (foco se marca con borde azul en CTA y botones).
- [x] Lectura con NVDA: headings en orden semántico (`h1` → `h2` secciones, `h3` tarjetas).
- [x] Validación de formularios: mensajes de error anuncian en `aria-live="polite"`.
- [x] Ensayo de expiración de sesión: callout se anuncia correctamente.
- [ ] Confirmar actualización post-fix `aria-live` en callouts (ver §2.1).

---

## 4. Plan de mantenimiento

1. Implementar ajustes `aria-live` y `aria-hidden` descritos arriba (issue `PORTAL-113`).
2. Reejecutar axe + Lighthouse tras deploy con fixes; actualizar esta página con nueva fecha.
3. Añadir escenarios de accesibilidad al checklist QA (`docs/qa/regression-checklist.md`, sección 8) y marcar como requisito previo a GA.

---

## 5. Referencias

- [`docs/guides/portal-client.md`](../guides/portal-client.md) – guía operativa.
- [`docs/product/rfc-public-components.md`](../product/rfc-public-components.md) – arquitectura de componentes públicos.
- [`tests/e2e/portal-client.spec.ts`](../../tests/e2e/portal-client.spec.ts) – cobertura Playwright crítica.
