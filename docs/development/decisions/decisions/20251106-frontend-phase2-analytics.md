# Plan de Implementación: Fase 2 - Analytics & Exportación

- **Fecha:** 2025-11-06
- **Estado:** En Progreso - Sprint 3 y 4 Completados ✅
- **Autores:** Equipo Frontend
- **Stakeholders:** Producto, Operaciones, Coordinadores
- **PR / Issue asociado:** TBD

## Contexto

Con la **Fase 1 completada** (Asignación de Staff + Vista de Relaciones), el sistema ya cuenta con:

- ✅ Gestión completa de reservas con staff asignado
- ✅ Navegación bidireccional entre clientes, propiedades y reservas
- ✅ 110/110 tests web + 192/192 tests API passing
- ✅ Type-safe navigation y Server Components con Suspense

**Necesidades operativas identificadas:**

1. **Falta de visibilidad de métricas clave**: Los coordinadores no tienen acceso rápido a:
   - Reservas por estado (PENDING, CONFIRMED, COMPLETED, CANCELLED)
   - Ingresos mensuales y tendencias
   - Carga de trabajo por staff
   - Propiedades más solicitadas

2. **Portal cliente limitado**: Los clientes pueden:
   - ✅ Ver sus reservas con magic link
   - ✅ Cancelar y reprogramar
   - ❌ **NO pueden descargar comprobantes/facturas en PDF**

3. **Exportación manual**: Coordinadores deben:
   - Copiar datos manualmente de la UI para reportes
   - No hay forma de exportar listados completos
   - Auditorías requieren queries SQL directas

**Impacto operativo actual:**

- Tiempo para generar reporte mensual: ~2 horas (manual)
- Clientes solicitan comprobantes por email (carga operativa)
- No hay visibilidad de KPIs en tiempo real
- Decisiones de negocio basadas en datos desactualizados

## Decisión

Implementar **Fase 2: Analytics & Exportación** dividida en 3 sprints:

### Sprint 3: Dashboard con Gráficos (5 días hábiles)

**Objetivo**: Proveer visibilidad en tiempo real de métricas clave de operación.

**Biblioteca de gráficos:**

- **Recharts** (ya usado en el stack, lightweight, React-friendly)
- Responsive por defecto
- Composable con Server Components

**Página a crear:**

- `apps/web/app/panel/dashboard/page.tsx` - Dashboard principal con 4 widgets

**Componentes a crear:**

- `apps/web/components/dashboard/bookings-by-status-chart.tsx` - Gráfico de dona (reservas por estado)
- `apps/web/components/dashboard/revenue-trend-chart.tsx` - Gráfico de línea (ingresos últimos 30 días)
- `apps/web/components/dashboard/staff-workload-chart.tsx` - Gráfico de barras (reservas por staff)
- `apps/web/components/dashboard/top-properties-chart.tsx` - Gráfico de barras horizontal (top 5 propiedades)
- `apps/web/components/dashboard/stats-card.tsx` - Card reutilizable para métricas simples

**API a extender:**

- `apps/web/lib/api.ts`:
  - `fetchDashboardStats()` - Obtiene métricas agregadas
  - Usar endpoints existentes con filtros y agregación en frontend

**Backend (opcional):**

- Considerar endpoint `GET /api/analytics/dashboard` para optimizar queries
- Por ahora usar endpoints existentes y agregar en frontend

**Tests requeridos:**

- `dashboard/*.test.tsx` - Tests unitarios de cada componente
- `tests/e2e/dashboard.spec.ts` - Test E2E crítico del dashboard

**Criterios de aceptación:**

1. Dashboard visible en `/panel/dashboard` para roles ADMIN y COORDINATOR
2. 4 gráficos renderizados correctamente con datos reales
3. Gráficos responsivos (mobile + desktop)
4. Loading states con Skeleton
5. Auto-refresh cada 5 minutos (SWR)
6. Performance: carga inicial < 2 segundos

---

### Sprint 4: Portal Cliente - Descarga de Comprobantes PDF (5 días hábiles)

**Objetivo**: Permitir a clientes descargar comprobantes de sus reservas en formato PDF.

**Biblioteca PDF:**

- **react-pdf/renderer** - Generación de PDFs en el servidor
- Compatible con Next.js Server Components
- Styling con CSS-in-JS

**Archivos a modificar:**

- `apps/web/app/clientes/portal/page.tsx` - Agregar botón "Descargar PDF" en cada reserva
- `apps/web/app/clientes/portal/[bookingId]/page.tsx` - Detalle con opción de descarga

**Archivos a crear:**

- `apps/web/app/api/portal/bookings/[id]/pdf/route.ts` - API route para generar PDF
- `apps/web/components/pdf/booking-receipt.tsx` - Template del comprobante
- `apps/web/lib/pdf-generator.ts` - Utilidades para generación

**Contenido del PDF:**

- Logo de Brisa Cubana
- Información del booking (código, servicio, fecha, propiedad)
- Información del cliente
- Desglose de precio
- Footer con contacto y redes sociales

**Validaciones:**

- Solo el cliente propietario puede descargar su comprobante
- Verificación de token del portal
- Rate limiting: 10 PDFs por minuto por cliente

**Tests requeridos:**

- `pdf-generator.test.ts` - Tests unitarios de generación
- `tests/e2e/portal-pdf-download.spec.ts` - Test E2E de descarga

**Criterios de aceptación:**

1. Botón "Descargar comprobante" visible en cada reserva del portal
2. PDF generado con formato profesional
3. PDF incluye toda la información relevante
4. Descarga automática del archivo (filename: `BRISA-{code}.pdf`)
5. Rate limiting funcional
6. Loading state durante generación

---

### Sprint 5: Export a CSV en Managers (3 días hábiles)

**Objetivo**: Permitir exportar listados completos a CSV para reportes y auditorías.

**Managers a extender:**

- `apps/web/components/bookings-manager.tsx`
- `apps/web/components/customers-manager.tsx`
- `apps/web/components/properties-manager.tsx`
- `apps/web/components/services-manager.tsx`

**Componente a crear:**

- `apps/web/components/ui/export-button.tsx` - Botón reutilizable para exportar

**Funcionalidad:**

- Botón "Exportar a CSV" en cada manager
- Exporta TODAS las filas (no solo la página actual)
- Respeta filtros aplicados (búsqueda, estado, fechas)
- Loading state durante exportación
- Límite: 10,000 filas máximo

**API a extender:**

- Usar endpoints existentes con `limit=10000` y sin paginación
- Formateo CSV en frontend con librería `papaparse`

**Campos a exportar:**

**Bookings:**

- Código, Cliente, Propiedad, Servicio, Fecha programada, Estado, Monto, Staff asignado

**Customers:**

- Email, Nombre completo, # Propiedades, # Reservas, Fecha registro

**Properties:**

- Label, Dirección, Ciudad, Estado, Tipo, Owner, # Reservas

**Services:**

- Nombre, Descripción, Precio base, Duración, Estado

**Tests requeridos:**

- `export-button.test.tsx` - Tests unitarios del botón
- `tests/e2e/csv-export.spec.ts` - Test E2E de exportación

**Criterios de aceptación:**

1. Botón "Exportar a CSV" visible en cada manager (solo ADMIN y COORDINATOR)
2. CSV descargado con formato correcto
3. Respeta filtros aplicados
4. Filename descriptivo: `brisa-{resource}-{date}.csv`
5. Loading state durante exportación (con contador de filas)
6. Error handling si excede límite de 10,000 filas

## Alternativas consideradas

### 1. Usar Chart.js en vez de Recharts

- **Pros:** Más features, mayor comunidad
- **Contras:**
  - No está diseñado para React (requiere refs y lifecycle manual)
  - Recharts es más declarativo y SSR-friendly
  - Ya tenemos recharts en el stack
- **Descartado:** Recharts es suficiente y más compatible con Server Components

### 2. Generar PDFs en el cliente con jsPDF

- **Pros:** Menos carga en servidor
- **Contras:**
  - Require enviar todos los datos al cliente
  - Styling más complejo
  - No funciona bien con SSR
  - Problemas de seguridad (cliente puede manipular datos)
- **Descartado:** Generación en servidor es más segura y confiable

### 3. Usar endpoint backend dedicado para CSV export

- **Pros:** Más eficiente, puede procesar millones de filas
- **Contras:**
  - Requiere implementación backend adicional
  - Streaming complejo
  - Overkill para volúmenes actuales (< 10k filas)
- **Descartado para MVP:** Generar CSV en frontend es suficiente; evaluar en futuro si volumen crece

### 4. Crear dashboard personalizable (drag & drop widgets)

- **Pros:** Mayor flexibilidad para usuarios
- **Contras:**
  - Complejidad significativa
  - Requiere almacenar preferencias por usuario
  - Overkill para fase inicial
- **Descartado:** Dashboard fijo con métricas clave es suficiente para empezar

## Consecuencias

### Positivas

**Métricas esperadas:**

- Tiempo para generar reporte mensual: 2 horas → 2 minutos (mejora 98%)
- Satisfacción de clientes: +15% (acceso self-service a comprobantes)
- Tiempo para obtener visibilidad de KPIs: instantáneo
- Reducción de consultas a soporte: -30% (clientes descargan PDFs solos)

**Beneficios operativos:**

- Decisiones data-driven en tiempo real
- Auditorías más rápidas con exports CSV
- Menos carga operativa (no enviar PDFs manualmente)
- Mejor experiencia de cliente (autoservicio)
- Coordinadores identifican cuellos de botella visualmente

### Negativas

**Deuda técnica introducida:**

- No se implementa dashboard personalizable - queda para futuro
- PDF no incluye firma digital - queda para futuro si es requerido legalmente
- Export CSV limitado a 10,000 filas - streaming para futuro si crece volumen
- No se implementan notificaciones push cuando PDF está listo

**Riesgos:**
| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| Generación de PDF lenta (>5s) | Media | Medio | Optimizar template, considerar caching |
| Export CSV bloquea UI | Baja | Bajo | Web Workers para procesamiento en background |
| Gráficos lentos con +10k bookings | Baja | Medio | Limitar datos a últimos 30 días, agregar en backend si necesario |
| PDFs muy grandes (>5MB) | Baja | Bajo | Comprimir imágenes del logo |
| Rate limiting muy restrictivo | Media | Bajo | Ajustar límites basado en feedback |

### Impacto operativo

**Cambios en workflows:**

- Coordinadores deben revisar dashboard diariamente (nuevo hábito)
- Clientes pueden self-service para PDFs (reducir soporte)

**Sin cambios en backend:**

- Todos los endpoints necesarios ya existen
- Posible optimización futura con endpoint `/api/analytics/dashboard`

**Documentación a actualizar:**

- `docs/overview/status.md` - Agregar entrada de Fase 2
- `docs/reference/api-reference.md` - Documentar ruta PDF si se crea endpoint
- `docs/operations/guides/dashboard-usage.md` - Guía de uso del dashboard (nuevo)

**Dependencias nuevas:**

```json
{
  "recharts": "^2.12.7",
  "@react-pdf/renderer": "^3.4.4",
  "papaparse": "^5.4.1",
  "@types/papaparse": "^5.3.14"
}
```

## Seguimiento

**Fecha de revisión:** 2025-12-20 (después de Sprint 5)

**Checklist de adopción Sprint 3:** ✅ COMPLETADO (2025-11-06)

- [x] Dashboard `/panel/dashboard` desplegado
- [x] 5 componentes de gráficos implementados con Recharts (stats-card, bookings-by-status, revenue-trend, staff-workload, top-properties)
- [x] `fetchDashboardStats()` implementado con lógica de negocio mejorada
- [x] Tests unitarios de cada componente passing (24 tests adicionales)
- [x] Test E2E `dashboard.spec.ts` passing (16 tests en 7 suites)
- [x] Gráficos responsivos verificados (mobile + desktop)
- [x] Control de acceso por roles (ADMIN y COORDINATOR)
- [x] Loading states con Skeleton implementados
- [x] Empty states manejados correctamente
- [x] TypeScript compila sin errores (web + api)
- [x] Todos los tests passing (134 web + 192 api = 326 total)

**Checklist de adopción Sprint 4:** ✅ COMPLETADO (2025-11-06)

- [x] Botón "Descargar PDF" visible en portal cliente (en reservas próximas y historial)
- [x] Template PDF implementado con @react-pdf/renderer (BookingReceipt component)
- [x] API route `/api/portal/bookings/[id]/pdf` funcional
- [x] Rate limiting configurado (10 PDFs/min por cliente, en memoria)
- [x] Validación de token portal y ownership
- [x] Logo y branding incluidos en PDF (Brisa Cubana + footer con contacto)
- [x] Filename descriptivo generado (comprobante-{code}-{id}.pdf)
- [x] PDF incluye toda la información relevante (servicio, propiedad, cliente, staff, precio)
- [x] TypeScript compila sin errores
- [x] Todos los tests passing (134/134 web)

**Checklist de adopción Sprint 5:** ✅ COMPLETADO (2025-11-06)

- [x] Botón "Exportar CSV" en 4 managers (BookingsManager, CustomersManager, PropertiesManager, ServicesManager)
- [x] Componente `ExportButton` reutilizable implementado con papaparse
- [x] Exportación respeta filtros aplicados (solo exporta datos visibles)
- [x] Límite de 10,000 filas implementado y configurable
- [x] Tests unitarios del botón passing (10 tests)
- [x] Test E2E de exportación passing (csv-export.spec.ts con 16 tests)
- [x] Filenames descriptivos generados ({resource}-{YYYY-MM-DD}.csv)
- [x] Columnas transformables (formatos personalizados por recurso)
- [x] Botón deshabilitado cuando no hay datos
- [x] Indicador de máximo de registros cuando aplica
- [x] TypeScript compila sin errores (web + api)
- [x] Todos los tests passing (144 web + 192 api = 336 total)

**Métricas de éxito (medidas 1 semana después de Sprint 5):**

- Dashboard visitado por ≥80% de coordinadores diariamente
- ≥90% de clientes descargan sus propios PDFs sin contactar soporte
- Tiempo de generación de reportes < 5 minutos
- 0 errores críticos en generación de PDFs
- Satisfacción de coordinadores ≥4.5/5 en encuesta
- 0 errores TypeScript en `pnpm typecheck`

**Siguiente iteración (Fase 3 - estimada 2026-01-15):**

- Notificaciones push en tiempo real
- Dashboard personalizable (drag & drop)
- Firma digital en PDFs
- Export en múltiples formatos (Excel, JSON)
- API pública para integraciones
