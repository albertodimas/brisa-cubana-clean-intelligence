# Portal Cliente – Reporte de Accesibilidad

**Última verificación:** 17 de octubre de 2025
**Última actualización:** 17 de octubre de 2025 (fixes implementados: commit `ce37e09`)
**Cobertura:** `/clientes`, `/clientes/acceso`, `/clientes/acceso/confirmar`, `/clientes/[customerId]`, `/clientes/[customerId]/reservas/[bookingId]`
**Herramientas:** axe DevTools (Chrome 129), Lighthouse 12.1, revisiones manuales NVDA 2024.2

---

## 1. Resultados resumidos

| Categoría            | Estado | Notas                                                                               |
| -------------------- | ------ | ----------------------------------------------------------------------------------- |
| Violaciones axe      | ✅     | 0 issues críticos/serios detectados.                                                |
| Contraste            | ✅     | Ratios ≥ 4.5:1 en texto principal; badges principales mantienen ≥ 3:1 en modo dark. |
| Navegación teclado   | ✅     | Foco visible en CTA, botones de acciones y links de navegación.                     |
| Lectores de pantalla | ✅     | `aria-live="polite"` implementado en `PortalCallout` (commit `ce37e09`).            |
| Lighthouse A11y      | ✅     | Espera 100/100 tras fix `aria-hidden` en `ArrowPathIcon` (commit `ce37e09`).        |

---

## 2. Hallazgos

### 2.1 Modal de acciones (cancelar/reagendar) ✅ RESUELTO

- **Problema:** Mensaje de confirmación se inserta en DOM sin `aria-live`, lo que retrasa anuncios en lectores de pantalla.
- **Solución implementada:** Añadido `aria-live="polite"` a componente `PortalCallout` en [apps/web/components/portal/callout.tsx:19](../../apps/web/components/portal/callout.tsx#L19).
- **Commit:** `ce37e09` (17-oct-2025)
- **Validación pendiente:** Reejecutar test con NVDA para confirmar anuncios correctos.

### 2.2 Botón "Actualizar" en dashboard ✅ RESUELTO

- **Problema:** `ArrowPathIcon` genera anuncio redundante sin `aria-hidden="true"`.
- **Solución implementada:** Añadido `aria-hidden="true"` a `ArrowPathIcon` en [apps/web/app/clientes/[customerId]/portal-dashboard-client.tsx:340](../../apps/web/app/clientes/[customerId]/portal-dashboard-client.tsx#L340).
- **Commit:** `ce37e09` (17-oct-2025)
- **Resultado esperado:** Lighthouse A11y score 100/100 (pendiente validación en deploy).

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
- [x] Implementación `aria-live` en callouts (commit `ce37e09`).
- [x] Implementación `aria-hidden` en ícono de refresh (commit `ce37e09`).
- [ ] Validación post-deploy con NVDA + Lighthouse (programar para siguiente deploy).

---

## 4. Estado de resolución

| Issue       | Hallazgo                          | Estado      | Commit    | Próximo paso                       |
| ----------- | --------------------------------- | ----------- | --------- | ---------------------------------- |
| PORTAL-113a | `aria-live` en `PortalCallout`    | ✅ Resuelto | `ce37e09` | Validar en deploy con NVDA         |
| PORTAL-113b | `aria-hidden` en `ArrowPathIcon`  | ✅ Resuelto | `ce37e09` | Verificar Lighthouse score 100/100 |
| PORTAL-112  | `aria-describedby` en CTA externo | 🔵 Opcional | N/A       | Backlog (no bloquea GA)            |

## 5. Plan de mantenimiento

1. ✅ **Completado:** Fixes `aria-live` y `aria-hidden` implementados (commit `ce37e09`, 17-oct-2025).
2. **Próximo:** Reejecutar axe + Lighthouse tras deploy a producción; actualizar tabla §4 con score final.
3. **Continuo:** Incluir validación de accesibilidad en checklist QA pre-GA ([docs/qa/regression-checklist.md:299](regression-checklist.md#L299)).

---

## 6. Referencias

- [`docs/guides/portal-client.md`](../guides/portal-client.md) – guía operativa.
- [`docs/product/rfc-public-components.md`](../product/rfc-public-components.md) – arquitectura de componentes públicos.
- [`tests/e2e/portal-client.spec.ts`](../../tests/e2e/portal-client.spec.ts) – cobertura Playwright crítica.
