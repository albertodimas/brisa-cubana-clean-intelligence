# Patrón de Manager Components

**Última actualización:** 25 de octubre de 2025
**Versión:** 1.0.0
**Estado:** ✅ Producción

---

## 📋 Tabla de Contenidos

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Arquitectura del Patrón](#arquitectura-del-patrón)
3. [Componentes Manager](#componentes-manager)
4. [Guía de Implementación](#guía-de-implementación)
5. [Migration Guide](#migration-guide)
6. [Mejores Prácticas](#mejores-prácticas)

---

## Resumen Ejecutivo

El **Manager Pattern** es un patrón arquitectónico utilizado en Brisa Cubana Clean Intelligence para crear componentes de gestión consistentes y mantenibles.

### ✅ Beneficios

- **Consistencia**: Todos los managers siguen el mismo patrón
- **Mantenibilidad**: Código predecible y fácil de modificar
- **Reutilización**: Hooks compartidos (`usePaginatedResource`)
- **Type Safety**: TypeScript strict con `ActionResult`
- **UX Mejorada**: Toast notifications y loading states uniformes

### 📊 Componentes Implementados

| Manager           | Estado | Tests | Ubicación                                                                  |
| ----------------- | ------ | ----- | -------------------------------------------------------------------------- |
| BookingsManager   | ✅     | 6/6   | [bookings-manager.tsx](../../apps/web/components/bookings-manager.tsx)     |
| ServicesManager   | ✅     | 5/5   | [services-manager.tsx](../../apps/web/components/services-manager.tsx)     |
| UsersManager      | ✅     | 5/5   | [users-manager.tsx](../../apps/web/components/users-manager.tsx)           |
| PropertiesManager | ✅     | 5/5   | [properties-manager.tsx](../../apps/web/components/properties-manager.tsx) |
| CustomersManager  | ✅     | 3/3   | [customers-manager.tsx](../../apps/web/components/customers-manager.tsx)   |

---

## Arquitectura del Patrón

### Diagrama de Flujo

```
┌─────────────────────────────────────────────────────────────┐
│                     AdminPanel (Parent)                      │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ usePaginatedResource Hook                            │   │
│  │ • items, pageInfo, isLoading, isLoadingMore          │   │
│  │ • loadMore, refresh, currentQuery, setQuery          │   │
│  └──────────────────────────────────────────────────────┘   │
│                           │                                   │
│                           ▼                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Manager Component (BookingsManager, etc.)            │   │
│  │ • Estado interno (updatingId, filtros)               │   │
│  │ • Handlers (handleUpdate, handleRemoveFilter)        │   │
│  │ • UI (SearchBar, FilterChips, Pagination)            │   │
│  └──────────────────────────────────────────────────────┘   │
│                           │                                   │
│                           ▼                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Server Actions                                        │   │
│  │ • updateBooking() -> ActionResult                    │   │
│  │ • updateService() -> ActionResult                    │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Principios Clave

1. **Separation of Concerns**: Parent maneja data fetching, Manager maneja UI/UX
2. **Single Responsibility**: Cada manager gestiona un solo recurso
3. **Consistent API**: Todas las props siguen la misma estructura
4. **Internal State**: Loading states y filtros manejados internamente
5. **Callbacks**: Toast y refresh manejados vía callbacks

---

## Componentes Manager

### Props Interface Estándar

```typescript
type ManagerProps<T> = {
  // Datos paginados
  items: T[];
  pageInfo: PaginationInfo;
  isLoading: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => Promise<void> | void;

  // Acciones CRUD
  onCreate?: (formData: FormData) => Promise<ActionResult>;
  onUpdate: (id: string, formData: FormData) => Promise<ActionResult>;
  onToggleActive?: (id: string, active: boolean) => Promise<ActionResult>;

  // Gestión de queries
  currentQuery: QueryParams;
  setQuery: (query: QueryParams) => Promise<void>;
  resetQuery: () => Promise<void>;
  refresh: () => Promise<void>;

  // Feedback
  onToast: (message: string, type: "success" | "error") => void;

  // Datos relacionados (si aplica)
  relatedData?: RelatedResource[];
};
```

### ActionResult Type

```typescript
type ActionResult = {
  success?: string;
  error?: string;
};
```

**Uso:**

```typescript
async function updateBooking(
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  try {
    // ... lógica de actualización
    return { success: "Reserva actualizada correctamente" };
  } catch (error) {
    return { error: "Error al actualizar reserva" };
  }
}
```

### Estado Interno

Cada manager maneja su propio estado interno para:

1. **Loading States**: `updatingId`, `deletingId`, `pendingId`
2. **Filtros**: Sincronizados con `currentQuery` vía `useEffect`
3. **UI State**: Modals, expanded items, etc.

**Ejemplo BookingsManager:**

```typescript
export function BookingsManager({ currentQuery, setQuery, onUpdate, onToast, refresh, ... }: ManagerProps) {
  // Estado interno
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>(
    typeof currentQuery.search === "string" ? String(currentQuery.search) : "",
  );
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(
    typeof currentQuery.status === "string" ? (currentQuery.status as StatusFilter) : "ALL",
  );

  // Sincronizar con currentQuery
  useEffect(() => {
    const nextSearch = typeof currentQuery.search === "string" ? String(currentQuery.search) : "";
    setSearchTerm((prev) => (prev === nextSearch ? prev : nextSearch));
  }, [currentQuery.search]);

  // Actualizar query cuando filtros cambian
  useEffect(() => {
    const query: QueryParams = {};
    if (searchTerm.trim()) query.search = searchTerm.trim();
    if (statusFilter !== "ALL") query.status = statusFilter;
    void setQuery(query);
  }, [searchTerm, statusFilter, setQuery]);

  // Handler con ActionResult
  async function handleUpdate(id: string, formData: FormData) {
    setUpdatingId(id);
    const result = await onUpdate(id, formData);
    setUpdatingId(null);

    if (result.error) {
      onToast(result.error, "error");
    } else if (result.success) {
      onToast(result.success, "success");
      await refresh();
    }
  }

  return (
    <section>
      <SearchBar value={searchTerm} onChange={setSearchTerm} />
      <FilterChips filters={filterChips} onRemove={handleRemoveFilter} />
      {/* ... */}
    </section>
  );
}
```

---

## Guía de Implementación

### 1. Crear el Manager Component

```typescript
// apps/web/components/new-resource-manager.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import type { QueryParams } from "@/hooks/use-paginated-resource";
import { Button } from "./ui/button";
import { SearchBar } from "./ui/search-bar";
import { Pagination } from "./ui/pagination";
import type { NewResource, PaginationInfo } from "@/lib/api";

type ActionResult = {
  success?: string;
  error?: string;
};

type NewResourceManagerProps = {
  resources: NewResource[];
  pageInfo: PaginationInfo;
  isLoading: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => Promise<void> | void;
  onUpdate: (id: string, formData: FormData) => Promise<ActionResult>;
  currentQuery: QueryParams;
  setQuery: (query: QueryParams) => Promise<void>;
  resetQuery: () => Promise<void>;
  refresh: () => Promise<void>;
  onToast: (message: string, type: "success" | "error") => void;
};

export function NewResourceManager({
  resources,
  pageInfo,
  isLoading,
  isLoadingMore,
  onLoadMore,
  onUpdate,
  currentQuery,
  setQuery,
  resetQuery,
  refresh,
  onToast,
}: NewResourceManagerProps) {
  // 1. Estado interno
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>(
    typeof currentQuery.search === "string" ? String(currentQuery.search) : "",
  );

  // 2. Sincronizar con currentQuery
  useEffect(() => {
    const nextSearch = typeof currentQuery.search === "string" ? String(currentQuery.search) : "";
    setSearchTerm((prev) => (prev === nextSearch ? prev : nextSearch));
  }, [currentQuery.search]);

  // 3. Actualizar query cuando filtros cambian
  useEffect(() => {
    const query: QueryParams = {};
    if (searchTerm.trim()) query.search = searchTerm.trim();
    void setQuery(query);
  }, [searchTerm, setQuery]);

  // 4. Handler con ActionResult
  async function handleUpdate(id: string, formData: FormData) {
    setUpdatingId(id);
    const result = await onUpdate(id, formData);
    setUpdatingId(null);

    if (result.error) {
      onToast(result.error, "error");
    } else if (result.success) {
      onToast(result.success, "success");
      await refresh();
    }
  }

  // 5. Renderizado
  return (
    <section className="ui-stack ui-stack--lg">
      <h3 className="ui-section-title">Recursos</h3>

      <SearchBar value={searchTerm} onChange={setSearchTerm} />

      {/* Lista de recursos */}
      <div className="grid gap-4">
        {resources.map((resource) => (
          <form
            key={resource.id}
            className="ui-panel-surface"
            action={async (formData) => {
              await handleUpdate(resource.id, formData);
            }}
          >
            {/* Campos del formulario */}
            <Button
              type="submit"
              isLoading={updatingId === resource.id}
              disabled={updatingId === resource.id}
            >
              Actualizar
            </Button>
          </form>
        ))}

        <Pagination
          count={resources.length}
          hasMore={pageInfo.hasMore}
          isLoading={isLoadingMore}
          onLoadMore={onLoadMore}
        />
      </div>
    </section>
  );
}
```

### 2. Integrar en AdminPanel

```typescript
// apps/web/components/admin-panel.tsx
export function AdminPanel({ ... }) {
  const { showToast } = useToast();

  const handleToast = (message: string, type: "success" | "error") => {
    showToast(message, { type });
  };

  const {
    items: resourceItems,
    pageInfo: resourcePageInfo,
    isLoading: isResourcesRefreshing,
    isLoadingMore: isLoadingMoreResources,
    loadMore: loadMoreResources,
    refresh: refreshResources,
    currentQuery: resourceQuery,
    setQuery: setResourceQuery,
    resetQuery: resetResourceQuery,
  } = usePaginatedResource<NewResource>({
    initial: resources,
    endpoint: "/api/resources",
    initialQuery: { limit: 10 },
  });

  return (
    <section>
      <NewResourceManager
        resources={resourceItems}
        pageInfo={resourcePageInfo}
        isLoading={isResourcesRefreshing}
        isLoadingMore={isLoadingMoreResources}
        onLoadMore={loadMoreResources}
        onUpdate={updateResource}
        currentQuery={resourceQuery}
        setQuery={setResourceQuery}
        resetQuery={resetResourceQuery}
        refresh={refreshResources}
        onToast={handleToast}
      />
    </section>
  );
}
```

### 3. Crear Tests

```typescript
// apps/web/components/new-resource-manager.test.tsx
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { NewResourceManager } from "./new-resource-manager";

const defaultProps = {
  resources: [],
  pageInfo: { limit: 10, cursor: null, nextCursor: null, hasMore: false },
  isLoading: false,
  isLoadingMore: false,
  onLoadMore: vi.fn(),
  onUpdate: vi.fn().mockResolvedValue({ success: "Updated" }),
  currentQuery: {},
  setQuery: vi.fn(),
  resetQuery: vi.fn(),
  refresh: vi.fn(),
  onToast: vi.fn(),
};

describe("NewResourceManager", () => {
  it("updates query when search changes", async () => {
    const setQuery = vi.fn();
    const user = userEvent.setup();

    render(<NewResourceManager {...defaultProps} setQuery={setQuery} />);

    const searchInput = screen.getByPlaceholderText("Buscar...");
    await user.type(searchInput, "test");

    await waitFor(() => {
      expect(setQuery).toHaveBeenCalledWith({ search: "test" });
    });
  });

  it("calls onToast on successful update", async () => {
    const onToast = vi.fn();
    const onUpdate = vi.fn().mockResolvedValue({ success: "Resource updated" });

    render(
      <NewResourceManager
        {...defaultProps}
        resources={[{ id: "1", name: "Test" }]}
        onUpdate={onUpdate}
        onToast={onToast}
      />
    );

    // Trigger update...

    expect(onToast).toHaveBeenCalledWith("Resource updated", "success");
  });
});
```

---

## Migration Guide

### De Patrón Viejo a Patrón Nuevo

#### ❌ Patrón Antiguo (BookingsManager antes)

```typescript
type BookingFilterInput = {
  status: string;
  from: string;
  to: string;
  search: string;
};

type BookingsManagerProps = {
  filters: BookingFilterInput;
  onFiltersChange: (next: Partial<BookingFilterInput>) => Promise<void>;
  onUpdate: (bookingId: string, formData: FormData) => Promise<void>;
  updatingId: string | null; // Parent maneja state
  // ... sin onToast, refresh, currentQuery
};
```

#### ✅ Patrón Nuevo

```typescript
type BookingsManagerProps = {
  bookings: Booking[];
  pageInfo: PaginationInfo;
  isLoading: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => Promise<void> | void;
  onUpdate: (bookingId: string, formData: FormData) => Promise<ActionResult>;
  currentQuery: QueryParams;
  setQuery: (query: QueryParams) => Promise<void>;
  resetQuery: () => Promise<void>;
  refresh: () => Promise<void>;
  onToast: (message: string, type: "success" | "error") => void;
};
```

### Checklist de Migración

- [ ] Reemplazar `filters` por `currentQuery`
- [ ] Reemplazar `onFiltersChange` por `setQuery`
- [ ] Agregar `resetQuery` y `refresh` props
- [ ] Agregar `onToast` callback
- [ ] Cambiar `onUpdate` para retornar `ActionResult`
- [ ] Mover `updatingId` a estado interno
- [ ] Agregar `useEffect` para sincronizar filtros con `currentQuery`
- [ ] Actualizar tests para usar nuevo API

---

## Mejores Prácticas

### ✅ DO

1. **Siempre retorna ActionResult** en handlers de actualización
2. **Maneja loading state internamente** (updatingId, deletingId)
3. **Sincroniza filtros con currentQuery** usando `useEffect`
4. **Usa onToast para feedback** en lugar de console.log
5. **Llama refresh después de updates exitosos**
6. **Extrae valores de currentQuery con type guards**

```typescript
const [searchTerm, setSearchTerm] = useState<string>(
  typeof currentQuery.search === "string" ? String(currentQuery.search) : "",
);
```

7. **Usa void para llamadas async en useEffect**

```typescript
useEffect(() => {
  void setQuery(query);
}, [searchTerm, setQuery]);
```

### ❌ DON'T

1. ❌ **No pases loading state desde parent**
2. ❌ **No uses callbacks void** para updates
3. ❌ **No olvides refresh después de updates**
4. ❌ **No uses console.log** para feedback al usuario
5. ❌ **No mezcles patrones** (algunos managers con un estilo, otros con otro)
6. ❌ **No olvides type guards** al leer currentQuery

---

## Referencias

- **Código fuente**: [apps/web/components/\*-manager.tsx](../../apps/web/components/)
- **Tests**: [apps/web/components/\*-manager.test.tsx](../../apps/web/components/)
- **Hook base**: [use-paginated-resource.ts](../../apps/web/hooks/use-paginated-resource.ts)
- **Tipos compartidos**: [lib/api.ts](../../apps/web/lib/api.ts)

---

**Mantenido por:** Equipo de Desarrollo
**Última revisión:** 25 de octubre de 2025
