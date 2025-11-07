# Plan de Implementación: Funcionalidades Críticas del Frontend

- **Fecha:** 2025-11-06
- **Estado:** Propuesto - Verificado con código real
- **Autores:** Equipo Frontend
- **Stakeholders:** Producto, Operaciones, Coordinadores
- **PR / Issue asociado:** TBD

## Contexto

El análisis exhaustivo del frontend reveló que, aunque la aplicación cuenta con arquitectura sólida (47 componentes UI, panel admin funcional, portal cliente con SWR), **faltan 2 funcionalidades operativas críticas**:

1. **Asignación de Staff a Reservas**: El endpoint backend `PATCH /api/bookings/:id/assign-staff` existe desde Sprint 2 (ver `apps/api/src/routes/bookings.ts:412-485` y `docs/overview/status.md`), pero:
   - ❌ El tipo `Booking` en frontend NO incluye `assignedStaff` (`apps/web/lib/api.ts:14-24`)
   - ✅ El backend YA serializa `assignedStaff` correctamente (`apps/api/src/lib/serializers.ts:12-18`, `60-64`)
   - ❌ No hay UI para que coordinadores asignen personal a reservas
   - ✅ El schema Prisma tiene `assignedStaffId` con índice (`apps/api/prisma/schema.prisma:119-127`)
   - ✅ Tests de integración completos (`apps/api/tests/integration/routes/bookings-sprint2.integration.test.ts`)

2. **Vista de Relaciones Cliente-Propiedades**: No existe navegación desde listados hacia páginas de detalle que muestren relaciones (cliente → propiedades → historial de reservas).
   - ❌ No hay endpoint `GET /api/customers/:id` (solo existe búsqueda en `GET /api/customers/`)
   - ✅ Endpoint `GET /api/properties/:id` ya existe
   - ❌ No hay páginas de detalle para clientes ni propiedades

**Impacto operativo actual:**

- Coordinadores deben asignar staff manualmente vía API/DB
- Imposible visualizar el histórico completo de un cliente desde UI
- No se puede auditar qué propiedades pertenecen a cada owner sin queries manuales

**Métricas actuales:**

- 6 managers implementados (Services, Properties, Bookings, Customers, Users, Leads)
- 47 componentes UI reutilizables (verificado en `apps/web/components/ui/`)
- 0% de reservas tienen staff asignado vía UI
- Tiempo promedio para asignar staff: ~2 min (manual)
- Backend serializa `assignedStaff` pero frontend no lo consume

## Decisión

Implementar **Fase 1: Funcionalidades Críticas** dividida en 2 sprints:

### Sprint 1: Asignación de Staff (5 días hábiles)

**Tipos a modificar (CRÍTICO):**

- `apps/web/lib/api.ts` - Agregar `assignedStaff` al tipo `Booking` (línea 14-24):
  ```typescript
  export type Booking = {
    id: string;
    code: string;
    scheduledAt: string;
    durationMin: number;
    totalAmount: number;
    status: string;
    notes?: string | null;
    service: { id: string; name: string; basePrice: number };
    property: { id: string; label: string; city: string };
    customer?: { id: string; fullName: string | null; email: string };
    // AGREGAR:
    assignedStaff?: {
      id: string;
      email: string;
      fullName: string | null;
      role: string;
      isActive: boolean;
    } | null;
  };
  ```

**Componentes a modificar:**

- `apps/web/components/bookings-manager.tsx` - Agregar columna "Staff asignado" + `<Select>` (reutilizar componente existente `apps/web/components/ui/select.tsx`)
- `apps/web/app/actions.ts` - Server action `assignStaffToBooking(bookingId, staffId)`
- `apps/web/lib/api.ts` - Función `fetchStaffUsers()` usando `GET /api/users?role=STAFF&isActive=true`

**Páginas a crear:**

- `apps/web/app/panel/staff/page.tsx` - Dashboard para staff (vista de sus asignaciones)

**Validaciones frontend:**

- Solo usuarios con `role=STAFF` y `isActive=true`
- Deshabilitar selector si booking está `COMPLETED` o `CANCELLED`
- Feedback visual inmediato (toast + revalidación SWR)

**Endpoints backend utilizados:**

- ✅ `PATCH /api/bookings/:id/assign-staff` (ya existe)
- ✅ `GET /api/users?role=STAFF&isActive=true` (ya existe)
- ✅ `GET /api/bookings?assignedStaffId=:id` (filtro ya implementado)

**Tests requeridos:**

- `bookings-manager.test.tsx` - Extender con casos de staff assignment
- `tests/e2e/staff-assignment.spec.ts` (Playwright `@critical`)

**Criterios de aceptación:**

1. Tipo `Booking` incluye `assignedStaff` y TypeScript no arroja errores
2. Coordinador puede asignar/cambiar staff desde bookings manager usando `<Select>`
3. Filtro "Por staff" funcional en búsqueda de reservas
4. Staff ve sus asignaciones en `/panel/staff` con paginación
5. Logging de asignaciones para auditoría (backend ya implementado en `apps/api/src/routes/bookings.ts:462-475`)

---

### Sprint 2: Vista de Relaciones (5 días hábiles)

**Backend a implementar (REQUERIDO):**

- `apps/api/src/routes/customers.ts` - Agregar endpoint `GET /api/customers/:id`:
  ```typescript
  router.get(
    "/:id",
    authenticate,
    requireRoles(["ADMIN", "COORDINATOR"]),
    async (c) => {
      const id = c.req.param("id");
      const repository = getCustomerRepository();
      const customer = await repository.findById(id);
      if (!customer) {
        return c.json({ error: "Customer not found" }, 404);
      }
      return c.json({ data: customer });
    },
  );
  ```
- Tests de integración en `apps/api/tests/integration/routes/customers.integration.test.ts`

**Páginas a crear:**

- `apps/web/app/panel/customers/[id]/page.tsx` - Detalle de cliente
- `apps/web/app/panel/properties/[id]/page.tsx` - Detalle de propiedad

**Componentes a crear:**

- `apps/web/components/customer-detail-view.tsx` - Tabs: Info, Propiedades, Historial
- `apps/web/components/property-detail-view.tsx` - Info, Historial de servicios, Owner

**Componentes a modificar:**

- `apps/web/components/customers-manager.tsx` - Botón "Ver perfil" con Link a `/panel/customers/[id]`
- `apps/web/components/properties-manager.tsx` - Link a detalle `/panel/properties/[id]`

**API a extender:**

- `apps/web/lib/api.ts`:
  - `fetchCustomerById(id)` - Usar nuevo endpoint `GET /api/customers/:id`
  - `fetchPropertyById(id)` - Endpoint backend ya existe `GET /api/properties/:id`
  - Reutilizar `fetchBookingsPage` con filtros `customerId` / `propertyId`

**Tests requeridos:**

- `customer-detail-view.test.tsx` (Vitest)
- `tests/e2e/customer-navigation.spec.ts` (Playwright `@critical`)

**Criterios de aceptación:**

1. Backend endpoint `GET /api/customers/:id` retorna cliente con propiedades
2. Desde customers manager → clic en cliente → ver detalle completo
3. Detalle muestra: email, fullName, lista de propiedades, historial completo de reservas
4. Desde property detail → ver owner + todas las reservas de esa propiedad
5. Navegación bidireccional (cliente ↔ propiedades ↔ reservas)

## Alternativas consideradas

### 1. No actualizar tipo Booking, solo usar response del backend

- **Pros:** Menos cambios en frontend
- **Contras:**
  - TypeScript no infiere `assignedStaff` automáticamente
  - Aumenta probabilidad de errores en runtime
  - Dificulta refactoring futuro
- **Descartado:** Viola principio de type safety

### 2. Crear componente StaffSelector nuevo en vez de reutilizar Select

- **Pros:** Mayor control sobre comportamiento específico
- **Contras:**
  - Duplica código existente
  - Componente `Select` ya tiene todas las funcionalidades necesarias
  - Incrementa deuda técnica
- **Descartado:** DRY (Don't Repeat Yourself)

### 3. Usar endpoint GET /api/customers/?search=:email en vez de crear /:id

- **Pros:** No requiere cambios en backend
- **Contras:**
  - Búsqueda por email puede retornar múltiples resultados
  - No es semánticamente correcto (GET por ID ≠ búsqueda)
  - Dificulta caching
- **Descartado:** Mejor práctica REST requiere endpoints individuales

## Consecuencias

### Positivas

**Métricas esperadas:**

- Tiempo de asignación de staff: 2 min → 10 seg (mejora 92%)
- Coordinadores pueden auditar 100% de reservas con staff asignado
- Operaciones pueden ver histórico completo de clientes en < 3 clics
- 0 queries manuales a DB para buscar relaciones cliente-propiedades

**Beneficios operativos:**

- Distribución de trabajo más eficiente
- Visibilidad completa de carga de cada staff
- Auditoría de asignaciones (logs ya implementados en backend)
- Mejor atención a clientes VIP (histórico visible)

### Negativas

**Deuda técnica introducida:**

- No se implementa búsqueda global (Command+K) - queda para Fase 4
- No hay analytics/gráficos - queda para Fase 2
- Portal cliente sigue sin descarga de comprobantes - queda para Fase 2

**Riesgos:**
| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| Select lento con +100 usuarios | Baja | Medio | Componente Select ya implementado, sin búsqueda filtrable (si necesario, agregar debounce) |
| Navegación confusa entre vistas | Baja | Alto | Breadcrumbs + botón "Volver" consistente |
| Refresh manual tedioso | Media | Bajo | SWR revalida on focus automáticamente |
| Race condition en asignación concurrente | Baja | Medio | Optimistic updates + error handling robusto |
| Tipo Booking desincronizado con backend | Baja | Alto | Validar que serializer backend coincida con tipo frontend (tests E2E) |

### Impacto operativo

**Cambios en workflows:**

- Coordinadores deben aprender nuevo flujo de asignación (capacitación ~15 min)
- Staff debe revisar dashboard diariamente para ver asignaciones

**Cambios en backend (Sprint 2):**

- Crear endpoint `GET /api/customers/:id`
- Migrar tests para cubrir nuevo endpoint
- Sin migración de DB (tablas ya existen)

**Sin cambios en:**

- Observabilidad (logs ya existen en backend)
- Performance (queries optimizadas, índices existentes en `Booking.assignedStaffId`)

**Documentación a actualizar:**

- `docs/overview/status.md` - Agregar entrada de Fase 1
- `docs/reference/api-reference.md` - Documentar endpoint `GET /api/customers/:id`
- `docs/development/guides/quickstart.md` - Mencionar nuevas páginas

## Seguimiento

**Fecha de revisión:** 2025-11-20 (después de Sprint 2)

**Checklist de adopción Sprint 1:** ✅ COMPLETADO (2025-11-06)

- [x] Tipo `Booking` actualizado en `apps/web/lib/api.ts` con campo `assignedStaff`
- [x] Columna "Staff" visible en `bookings-manager.tsx` usando `<Select>` existente
- [x] `fetchStaffUsers()` implementado (GET /api/users?role=STAFF&isActive=true)
- [x] Server action `assignStaffToBooking()` implementado en `apps/web/app/actions.ts`
- [x] Filtro por staff funcional en `BookingsManager`
- [x] Dashboard `/panel/staff` desplegado en `apps/web/app/panel/staff/page.tsx`
- [x] Test E2E `staff-assignment.spec.ts` passing en suite `critical` (6 tests)
- [x] Tests unitarios actualizados en `bookings-manager.test.tsx` (12/12 passing)

**Checklist de adopción Sprint 2:** ✅ COMPLETADO (2025-11-06)

- [x] **Backend:** Endpoint `GET /api/customers/:id` implementado en `apps/api/src/routes/customers.ts`
- [x] **Backend:** `CustomerRepository.findById()` implementado
- [x] **Backend:** Filtro `ownerId` agregado a `PropertySearchParams`
- [x] **Backend:** Tests de integración passing (192/192)
- [x] Página `/panel/customers/[id]` desplegada con Server Components + Suspense
- [x] Página `/panel/properties/[id]` desplegada con Server Components + Suspense
- [x] Navegación desde managers funcional (type-safe hrefs)
- [x] Tests unitarios passing (110/110 web)
- [x] TypeScript compila sin errores (web + api)

**Métricas de éxito (medidas 1 semana después de Sprint 2):**

- ≥80% de reservas nuevas tienen staff asignado vía UI
- Tiempo promedio de asignación < 15 seg
- 0 bugs críticos reportados en navegación de relaciones
- Satisfacción de coordinadores ≥4/5 en encuesta interna
- 0 errores TypeScript en `pnpm typecheck`

**Siguiente iteración (Fase 2 - estimada 2025-12-02):**

- Dashboard con gráficos (recharts)
- Portal cliente: descarga de comprobantes (PDF)
- Export a CSV en managers
