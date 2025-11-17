# Guía Técnica · IA de Resúmenes Automáticos

**Última actualización:** 14 de noviembre de 2025  
**Relación con la visión SaaS:** Fase 2 – MVP (ver [`docs/product/saas-vision.md`](../../product/saas-vision.md))

---

## 1. Objetivo

Generar un resumen automático por servicio (turno) que pueda compartirse en el portal cliente y en el one-pager del panel. Debe incluir:

- Contexto del servicio (propiedad, fecha, duración, staff).
- Hallazgos relevantes (incidencias, restocks pendientes, upsells).
- Sentimiento y próximos pasos sugeridos.

## 2. Estado actual (nov-2025)

| Entregable                        | Estado | Notas                                                                             |
| --------------------------------- | ------ | --------------------------------------------------------------------------------- |
| Migración Prisma `BookingSummary` | ✅     | Tabla creada (`apps/api/prisma/migrations/20251114090000_add_booking_summaries`). |
| Servicio `AiSummaryService`       | ✅     | Vive en `apps/api/src/services/ai-summary-service.ts` + unit tests.               |
| Persistencia multi-tenant         | ✅     | Guardamos `tenantId`, modelo y tokens en cada resumen.                            |
| Exposición API + UI               | 🔄     | Endpoints y componentes pendientes (ver pasos siguientes).                        |

## 3. Alcance técnico

| Capa       | Implementación                                                                                                                             |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Datos      | `Booking` + `Notification` + evidencias (fotos/notes). Repositorio `apps/api/src/repositories/booking-repository.ts` ya expone `tenantId`. |
| Servicio   | `apps/api/src/services/ai-summary-service.ts` genera el texto y almacena tokens/modelo en `BookingSummary`.                                |
| Transporte | Endpoint `POST /api/bookings/:id/summary` (panel) y `GET /api/portal/bookings/:id/summary` (portal). **Pendiente de exponer.**             |
| UI         | Componentes `SummaryCard` (panel) y `PortalSummary` (portal) con fallback manual.                                                          |
| Costos     | 1 resumen por booking (máx. 1.5k tokens). Guardar texto final en tabla `BookingSummary` (por crear).                                       |

## 4. Fuentes y prompts

```
INPUT:
- booking metadata (property, scheduledAt, durationMin, staff)
- checklist outcomes (passed/failed)
- notes (staff + coordinador)
- incidencias abiertas

PROMPT (borrador):
  "Eres Brisa OS, asistente operativo. Resume el servicio para un property manager.
   1. Estado general (OK / atención)
   2. Incidencias detectadas (si las hay)
   3. Recomendaciones / upsells
   4. Próximos pasos y tiempos"
```

Modelo sugerido: `gpt-4o-mini` (OpenAI) o `claude-3.5-haiku` (Anthropic). La selección final dependerá del costo y disponibilidad de credenciales.

## 5. Pasos siguientes

1. **Endpoints panel/portal**: exponer `POST /api/bookings/:id/summary` (coordinador) y `GET /api/portal/bookings/:id/summary` (cliente). Incluir rate limit dedicado.
2. **UI Panel**: `SummaryCard` con badge “Generado por IA”, botón “Regenerar” y fallback manual.
3. **UI Portal**: `PortalSummary` con timestamp, modelo y enlace a historial.
4. **Observabilidad**: eventos PostHog (`ai_summary_generated`, `ai_summary_failed`) + métricas en `/health`.
5. **Operativa**: bandera `AI_SUMMARY_ENABLED` por tenant y script para re-generar backlog de bookings.

> **Nota:** seguir estrictamente la política de datos (no enviar PII en prompts) y vincular cada llamada al tenant correspondiente. Cualquier experimento debe referenciar este documento y la visión SaaS.
