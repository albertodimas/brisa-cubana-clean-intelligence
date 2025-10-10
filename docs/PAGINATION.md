# Paginación - Brisa Cubana Clean Intelligence

## Resumen

El sistema implementa paginación cursor-based en los endpoints de la API para mejorar el performance y la experiencia de usuario cuando hay grandes volúmenes de datos.

## Implementación

### Cursor-Based Pagination

La paginación cursor-based es más eficiente que la paginación offset-based para:

- Datasets grandes
- Datos que cambian frecuentemente
- Prevenir resultados duplicados o saltados cuando los datos cambian entre páginas

### Endpoints con Paginación

#### GET /api/bookings

**Parámetros de Query:**

| Parámetro | Tipo    | Requerido | Default | Descripción                                         |
| --------- | ------- | --------- | ------- | --------------------------------------------------- |
| `limit`   | integer | No        | 20      | Número de resultados por página (1-100)             |
| `cursor`  | string  | No        | -       | ID del último elemento de la página anterior (CUID) |

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

Los resultados están ordenados por:

1. `scheduledAt` (ascendente)
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

- ✅ Paginación con límite por defecto (20)
- ✅ Paginación con límite personalizado
- ✅ Navegación con cursor
- ✅ Validación de límites (min/max)

### Tests E2E

Ubicación: `tests/e2e/operations.spec.ts`

- ✅ API request con paginación default
- ✅ Custom limit
- ✅ Navegación entre páginas con cursor
- ✅ Validación de límites

## Próximos Pasos

### Endpoints Pendientes

1. **GET /api/services**
   - Mismo patrón de paginación
   - Límite sugerido: 50 (crecimiento más lento)

2. **GET /api/properties**
   - Mismo patrón de paginación
   - Límite sugerido: 50 (crecimiento más lento)

3. **GET /api/users** (solo ADMIN)
   - Mismo patrón de paginación
   - Límite sugerido: 100 (lista administrativa)

### UI de Paginación

- Implementar componente de paginación en frontend
- Infinite scroll para mobile
- Load more button para desktop
- Indicadores de progreso (página X de Y estimado)

## Referencias

- [Prisma Cursor-based Pagination](https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination)
- [API Pagination Best Practices](https://www.moesif.com/blog/technical/api-design/REST-API-Design-Filtering-Sorting-and-Pagination/)
- [OpenAPI Specification](../docs/openapi.yaml)

---

**Última actualización**: 9 de octubre de 2025
**Implementado en**: v0.2.1
