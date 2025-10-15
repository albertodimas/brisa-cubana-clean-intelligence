# Paginación - Brisa Cubana Clean Intelligence

## Resumen

El sistema implementa paginación cursor-based en los endpoints de la API para mejorar el performance y la experiencia de usuario cuando hay grandes volúmenes de datos.  
Desde la **Fase 2 (15/oct/2025)**, los listados de servicios, propiedades, reservas y clientes incorporan **búsqueda debounced (300 ms)** y **chips de filtros activos** alineados con la API.

## Búsqueda y Filtros – Fase 2

| Recurso     | Parámetros soportados                                                                        | UI Asociada                                              |
| ----------- | -------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| Servicios   | `search`, `active`, `limit`, `cursor`                                                        | SearchBar + select “Estado”; chips por texto/estado.     |
| Propiedades | `search`, `city`, `type`, `limit`, `cursor`                                                  | SearchBar + selects “Filtrar por ciudad/tipo”.           |
| Reservas    | `search`, `status`, `from`, `to`, `propertyId`, `serviceId`, `customerId`, `limit`, `cursor` | SearchBar + filtros existentes (estado/fechas).          |
| Clientes    | `search`, `limit`, `cursor`                                                                  | SearchBar (nombre/email).                                |
| Usuarios    | `search`, `role`, `isActive`, `limit`, `cursor`                                              | **Pendiente** (sección AdminPanel sin manager dedicado). |

El componente `SearchBar` es reutilizable (forwardRef, clear button, estados `loading`/`disabled`) y el componente `FilterChips` muestra los filtros activos con opción “Limpiar todos”. Ambos componentes cuentan con pruebas unitarias dedicadas.

## Implementación

### Cursor-Based Pagination

La paginación cursor-based es más eficiente que la paginación offset-based para:

- Datasets grandes
- Datos que cambian frecuentemente
- Prevenir resultados duplicados o saltados cuando los datos cambian entre páginas

### Endpoints con Paginación

#### GET /api/bookings

**Parámetros de Query:**

| Parámetro     | Tipo     | Requerido | Default | Descripción                                                                          |
| ------------- | -------- | --------- | ------- | ------------------------------------------------------------------------------------ |
| `search`      | string   | No        | -       | Coincidencia parcial en código, nombre de cliente o etiqueta de propiedad.           |
| `status`      | string   | No        | -       | Filtra por estado (`PENDING`, `CONFIRMED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`). |
| `from` / `to` | datetime | No        | -       | Rango de fechas (ISO 8601).                                                          |
| `propertyId`  | string   | No        | -       | Filtra por propiedad (`cuid`).                                                       |
| `serviceId`   | string   | No        | -       | Filtra por servicio (`cuid`).                                                        |
| `customerId`  | string   | No        | -       | Filtra por cliente (`cuid`).                                                         |
| `limit`       | integer  | No        | 20      | Número de resultados por página (1-100).                                             |
| `cursor`      | string   | No        | -       | ID del último elemento de la página anterior (`cuid`).                               |

**Orden:** `scheduledAt` ASC, `id` ASC

#### GET /api/services

**Parámetros de Query:**

| Parámetro | Tipo                           | Requerido | Default | Descripción                                            |
| --------- | ------------------------------ | --------- | ------- | ------------------------------------------------------ |
| `search`  | string                         | No        | -       | Coincidencia parcial en `name` o `description`.        |
| `active`  | string (`"true"` \| `"false"`) | No        | -       | Filtra servicios activos o inactivos.                  |
| `limit`   | integer                        | No        | 50      | Número de resultados por página (1-100).               |
| `cursor`  | string                         | No        | -       | ID del último elemento de la página anterior (`cuid`). |

**Orden:** `name` ASC, `id` ASC

#### GET /api/properties

**Parámetros de Query:**

| Parámetro | Tipo    | Requerido | Default | Descripción                                                   |
| --------- | ------- | --------- | ------- | ------------------------------------------------------------- |
| `search`  | string  | No        | -       | Coincidencia parcial en `label`, `city` o `addressLine`.      |
| `city`    | string  | No        | -       | Filtra por ciudad exacta.                                     |
| `type`    | string  | No        | -       | Filtra por tipo (`RESIDENTIAL`, `VACATION_RENTAL`, `OFFICE`). |
| `limit`   | integer | No        | 50      | Número de resultados por página (1-100).                      |
| `cursor`  | string  | No        | -       | ID del último elemento de la página anterior (`cuid`).        |

**Orden:** `createdAt` DESC, `id` ASC

**Respuesta:**

```json
{
  "data": [
    {
      "id": "c00000000000000000000001b",
      "code": "BRISA-0001",
      "scheduledAt": "2024-10-15T10:00:00Z"
      // ... otros campos
    }
    // ... más reservas
  ],
  "pagination": {
    "limit": 20,
    "cursor": null,
    "nextCursor": "c00000000000000000000014b",
    "hasMore": true
  }
}
```

**Campos de Paginación:**

- `limit`: Número de resultados solicitados
- `cursor`: ID desde donde se comenzó a paginar (null en primera página)
- `nextCursor`: ID para solicitar la siguiente página (null si no hay más resultados)
- `hasMore`: Booleano indicando si hay más resultados disponibles

#### GET /api/customers

**Parámetros de Query:**

| Parámetro | Tipo    | Requerido | Default | Descripción                                            |
| --------- | ------- | --------- | ------- | ------------------------------------------------------ |
| `search`  | string  | No        | -       | Coincidencia parcial en `fullName` o `email`.          |
| `limit`   | integer | No        | 50      | Número de resultados por página (1-100).               |
| `cursor`  | string  | No        | -       | ID del último elemento de la página anterior (`cuid`). |

**Orden:** `createdAt` ASC, `id` ASC

#### GET /api/users

> Estado: parámetros disponibles en API (15/oct/2025); integración UI pendiente para sección de usuarios en `AdminPanel`.

| Parámetro  | Tipo                           | Requerido | Default | Descripción                                                 |
| ---------- | ------------------------------ | --------- | ------- | ----------------------------------------------------------- |
| `search`   | string                         | No        | -       | Coincidencia parcial en `fullName` o `email`.               |
| `role`     | string                         | No        | -       | Filtra por rol (`ADMIN`, `COORDINATOR`, `STAFF`, `CLIENT`). |
| `isActive` | string (`"true"` \| `"false"`) | No        | -       | Filtra por estado activo/inactivo.                          |
| `limit`    | integer                        | No        | 50      | Número de resultados por página (1-100).                    |
| `cursor`   | string                         | No        | -       | ID del último elemento de la página anterior (`cuid`).      |

**Orden:** `createdAt` DESC, `id` ASC

## Ejemplos de Uso

### Primera Página (Default)

```bash
GET /api/bookings
```

Respuesta:

```json
{
  "data": [...],
  "pagination": {
    "limit": 20,
    "cursor": null,
    "nextCursor": "c00000000000000000000014b",
    "hasMore": true
  }
}
```

### Primera Página (Custom Limit)

```bash
GET /api/bookings?limit=10
```

### Segunda Página (Usando Cursor)

```bash
GET /api/bookings?limit=20&cursor=c00000000000000000000014b
```

Respuesta:

```json
{
  "data": [...],
  "pagination": {
    "limit": 20,
    "cursor": "c00000000000000000000014b",
    "nextCursor": "c00000000000000000000028b",
    "hasMore": true
  }
}
```

### Última Página

Cuando no hay más resultados:

```json
{
  "data": [...],
  "pagination": {
    "limit": 20,
    "cursor": "c00000000000000000000042b",
    "nextCursor": null,
    "hasMore": false
  }
}
```

## Combinación con Filtros

La paginación funciona con todos los filtros existentes:

```bash
# Reservas confirmadas, paginadas de 5 en 5
GET /api/bookings?status=CONFIRMED&limit=5

# Reservas en rango de fechas, página 2
GET /api/bookings?from=2024-10-01T00:00:00Z&to=2024-10-31T23:59:59Z&limit=10&cursor=c00000000000000000000010b

# Reservas de una propiedad específica
GET /api/bookings?propertyId=c00000000000000000000005l&limit=15
```

## Validaciones

### Límites

- **Mínimo**: 1 resultado por página
- **Máximo**: 100 resultados por página
- **Default**: 20 resultados por página

### Errores

#### Limit fuera de rango

```bash
GET /api/bookings?limit=0
```

Respuesta: `400 Bad Request`

```bash
GET /api/bookings?limit=101
```

Respuesta: `400 Bad Request`

#### Cursor inválido

```bash
GET /api/bookings?cursor=invalid-id
```

Respuesta: `400 Bad Request`

## Implementación en Cliente

### JavaScript/TypeScript

```typescript
interface PaginatedBookings {
  data: Booking[];
  pagination: {
    limit: number;
    cursor: string | null;
    nextCursor: string | null;
    hasMore: boolean;
  };
}

async function fetchAllBookings(): Promise<Booking[]> {
  const allBookings: Booking[] = [];
  let cursor: string | null = null;
  let hasMore = true;

  while (hasMore) {
    const url = new URL("/api/bookings", API_BASE_URL);
    url.searchParams.set("limit", "50");
    if (cursor) {
      url.searchParams.set("cursor", cursor);
    }

    const response = await fetch(url.toString());
    const result: PaginatedBookings = await response.json();

    allBookings.push(...result.data);
    cursor = result.pagination.nextCursor;
    hasMore = result.pagination.hasMore;
  }

  return allBookings;
}
```

### React Hook Example

```typescript
import { useState, useEffect } from "react";

function useBookings(limit = 20) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const loadMore = async () => {
    if (!hasMore || loading) return;

    setLoading(true);
    const url = new URL("/api/bookings", API_BASE_URL);
    url.searchParams.set("limit", String(limit));
    if (cursor) {
      url.searchParams.set("cursor", cursor);
    }

    const response = await fetch(url.toString());
    const result: PaginatedBookings = await response.json();

    setBookings((prev) => [...prev, ...result.data]);
    setCursor(result.pagination.nextCursor);
    setHasMore(result.pagination.hasMore);
    setLoading(false);
  };

  useEffect(() => {
    loadMore();
  }, []);

  return { bookings, loadMore, hasMore, loading };
}
```

## Orden de Resultados

### GET /api/bookings

1. `scheduledAt` (ascendente)
2. `id` (ascendente) - como tiebreaker

### GET /api/services

1. `name` (ascendente)
2. `id` (ascendente) - como tiebreaker

### GET /api/properties

1. `createdAt` (descendente) - más recientes primero
2. `id` (ascendente) - como tiebreaker

Esto garantiza un orden consistente y predecible en la paginación.

## Performance

### Ventajas de Cursor-Based

- ✅ **Consistencia**: No se saltan ni duplican resultados aunque cambien los datos
- ✅ **Performance**: Queries más eficientes usando índices de primary key
- ✅ **Escalabilidad**: Performance O(1) independiente del offset

### Comparación con Offset-Based

| Aspecto           | Cursor-Based | Offset-Based |
| ----------------- | ------------ | ------------ |
| Performance       | O(1)         | O(n)         |
| Consistencia      | Alta         | Baja         |
| Implementación    | Media        | Simple       |
| Saltar a página N | No           | Sí           |

## Testing

### Tests Unitarios

Ubicación: `apps/api/src/app.test.ts`

**Bookings:**

- ✅ Paginación con límite por defecto (20)
- ✅ Paginación con límite personalizado
- ✅ Navegación con cursor
- ✅ Validación de límites (min/max)

**Services:**

- ✅ Paginación con límite por defecto (50)
- ✅ Paginación con límite personalizado
- ✅ Navegación con cursor
- ✅ Validación de límites (min/max)

**Properties:**

- ✅ Paginación con límite por defecto (50)
- ✅ Paginación con límite personalizado
- ✅ Navegación con cursor
- ✅ Validación de límites (min/max)

### Tests E2E

Ubicación: `tests/e2e/operations.spec.ts`

- ✅ API request con paginación default
- ✅ Custom limit
- ✅ Navegación entre páginas con cursor
- ✅ Validación de límites

## UI de Paginación (Frontend)

### Estado actual (14-oct-2025)

- Componente reusable `Pagination` en `apps/web/components/ui/pagination.tsx`.
- Muestra contador “Mostrando X de Y registros” y botón “Cargar más” con estados de carga y mensaje “No hay más resultados”.
- Integrado en los managers de servicios, propiedades, reservas y clientes, refrescando datos tras crear/actualizar/togglear elementos.
- Cobertura de pruebas:
  - `apps/web/components/ui/pagination.test.tsx`
  - `apps/web/components/services-manager.test.tsx`
  - `apps/web/components/properties-manager.test.tsx`
  - `apps/web/components/bookings-manager.test.tsx`
- Validado via `pnpm test:e2e:smoke` para garantizar la experiencia end-to-end.

### Próximos pasos sugeridos

- Explorar infinite scroll adaptativo para mobile como mejora opcional.
- Añadir métricas de paginación (total estimado) cuando la API exponga conteos.

## Referencias

- [Prisma Cursor-based Pagination](https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination)
- [API Pagination Best Practices](https://www.moesif.com/blog/technical/api-design/REST-API-Design-Filtering-Sorting-and-Pagination/)
- [OpenAPI Specification](../reference/openapi.yaml)

---

**Última actualización**: 14 de octubre de 2025
**Implementado en**: v0.3.0 (API + UI)

### Changelog

- **v0.2.1** (9 octubre 2025): Paginación implementada en `/api/bookings`
- **v0.2.2** (10 octubre 2025): Paginación implementada en `/api/services` y `/api/properties`
- **v0.3.0** (14 octubre 2025): Controles de paginación visibles en frontend (`Pagination` UI component)
