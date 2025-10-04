# OpenAPI & Swagger Setup

Guía para implementar documentación automática de la API con OpenAPI 3.1 y Swagger UI usando Hono.

## Beneficios

- 📚 **Documentación automática** desde el código fuente
- 🧪 **Playground interactivo** para probar endpoints
- 🔄 **Sincronización automática** entre código y docs
- ✅ **Validación de tipos** con Zod
- 🌐 **Estándar OpenAPI 3.1** compatible con ecosistema completo

## Instalación

### 1. Instalar Dependencias

```bash
# En el root del proyecto
pnpm --filter=@brisa/api add @hono/zod-openapi @hono/swagger-ui
```

### 2. Actualizar package.json

```json
{
  "dependencies": {
    "@hono/zod-openapi": "^0.18.0",
    "@hono/swagger-ui": "^0.4.1"
  }
}
```

## Implementación

### Paso 1: Crear Aplicación OpenAPI

Modifica `apps/api/src/app.ts` para usar `OpenAPIHono` en lugar de `Hono`:

```typescript
// apps/api/src/app.ts
import { OpenAPIHono } from "@hono/zod-openapi";
import { swaggerUI } from "@hono/swagger-ui";

// Cambiar de:
// const app = new Hono()

// A:
const app = new OpenAPIHono({
  defaultHook: (result, c) => {
    if (!result.success) {
      return c.json(
        {
          ok: false,
          message: "Validation failed",
          errors: result.error.flatten(),
        },
        400,
      );
    }
  },
});

// Agregar documentación de metadata
app.doc("/openapi.json", {
  openapi: "3.1.0",
  info: {
    title: "Brisa Cubana Clean Intelligence API",
    version: "0.1.0",
    description:
      "API REST para plataforma de servicios de limpieza premium en Miami-Dade",
    contact: {
      name: "Brisa Cubana Team",
      email: "albertodimasmorazaldivar@gmail.com",
      url: "https://github.com/albertodimas/brisa-cubana-clean-intelligence",
    },
    license: {
      name: "MIT",
      url: "https://opensource.org/licenses/MIT",
    },
  },
  servers: [
    {
      url: "http://localhost:3001",
      description: "Development server",
    },
    {
      url: "https://brisa-cubana-api.railway.app",
      description: "Production server",
    },
  ],
  tags: [
    { name: "Authentication", description: "Auth endpoints" },
    { name: "Users", description: "User management" },
    { name: "Services", description: "Cleaning services catalog" },
    { name: "Bookings", description: "Booking management" },
    { name: "Properties", description: "Property management" },
    { name: "Payments", description: "Payment and Stripe webhooks" },
    { name: "Health", description: "Health checks and monitoring" },
  ],
});

// Agregar Swagger UI
app.get(
  "/api-docs",
  swaggerUI({
    url: "/openapi.json",
  }),
);

// Agregar redoc (opcional)
app.get("/api-docs/redoc", (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Brisa Cubana API Docs</title>
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link href="https://fonts.googleapis.com/css?family=Montserrat:300,400,700|Roboto:300,400,700" rel="stylesheet">
        <style>
          body {
            margin: 0;
            padding: 0;
          }
        </style>
      </head>
      <body>
        <redoc spec-url='/openapi.json'></redoc>
        <script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"> </script>
      </body>
    </html>
  `);
});

export default app;
```

### Paso 2: Migrar Rutas a OpenAPI

Ejemplo de conversión de una ruta existente:

**Antes (Hono normal):**

```typescript
// apps/api/src/routes/services.ts
import { Hono } from "hono";
import { servicesSchema } from "../schemas";

const services = new Hono();

services.get("/", async (c) => {
  const all = await db.service.findMany();
  return c.json(all);
});
```

**Después (OpenAPI Hono):**

```typescript
// apps/api/src/routes/services.ts
import { createRoute } from "@hono/zod-openapi";
import { z } from "zod";

// Schema de respuesta
const ServiceSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  basePrice: z.number(),
  categoryId: z.string().uuid(),
  active: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

const ServicesListSchema = z.array(ServiceSchema);

// Definir ruta con OpenAPI
const listServicesRoute = createRoute({
  method: "get",
  path: "/services",
  tags: ["Services"],
  summary: "List all services",
  description: "Retrieve a list of all available cleaning services",
  responses: {
    200: {
      description: "Successful response",
      content: {
        "application/json": {
          schema: ServicesListSchema,
        },
      },
    },
    500: {
      description: "Internal server error",
      content: {
        "application/json": {
          schema: z.object({
            error: z.string(),
          }),
        },
      },
    },
  },
});

// Implementar handler
app.openapi(listServicesRoute, async (c) => {
  const all = await db.service.findMany();
  return c.json(all, 200);
});
```

### Paso 3: Añadir Autenticación a OpenAPI

```typescript
// apps/api/src/app.ts

// Definir esquema de seguridad
app.doc("/openapi.json", {
  // ... resto de config
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "JWT token obtenido desde /api/auth/login",
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
});

// En rutas protegidas:
const createBookingRoute = createRoute({
  method: "post",
  path: "/bookings",
  tags: ["Bookings"],
  security: [{ bearerAuth: [] }], // Requiere autenticación
  request: {
    body: {
      content: {
        "application/json": {
          schema: CreateBookingSchema,
        },
      },
    },
  },
  // ...
});
```

## Configuración Avanzada

### Schemas Reutilizables

Centraliza schemas en `apps/api/src/schemas.ts`:

```typescript
// apps/api/src/schemas.ts
import { z } from "zod";

// Base schemas
export const ErrorSchema = z.object({
  ok: z.literal(false),
  message: z.string(),
  errors: z.record(z.any()).optional(),
});

export const SuccessSchema = z.object({
  ok: z.literal(true),
  message: z.string(),
});

// Pagination
export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const PaginatedResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    data: z.array(dataSchema),
    pagination: z.object({
      page: z.number(),
      limit: z.number(),
      total: z.number(),
      pages: z.number(),
    }),
  });

// User schemas
export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  role: z.enum(["ADMIN", "STAFF", "CLIENT"]),
  active: z.boolean(),
  createdAt: z.string().datetime(),
});
```

### Ejemplos en la Documentación

```typescript
const createBookingRoute = createRoute({
  // ...
  request: {
    body: {
      content: {
        "application/json": {
          schema: CreateBookingSchema,
          example: {
            userId: "123e4567-e89b-12d3-a456-426614174000",
            serviceId: "123e4567-e89b-12d3-a456-426614174001",
            propertyId: "123e4567-e89b-12d3-a456-426614174002",
            scheduledAt: "2025-10-15T10:00:00Z",
            notes: "Por favor usar productos eco-friendly",
          },
        },
      },
    },
  },
});
```

## Testing con Swagger UI

### Acceder a la Documentación

1. Inicia el servidor: `pnpm dev:api`
2. Abre en tu navegador:
   - **Swagger UI:** http://localhost:3001/api-docs
   - **ReDoc:** http://localhost:3001/api-docs/redoc
   - **OpenAPI JSON:** http://localhost:3001/openapi.json

### Probar Endpoints

1. En Swagger UI, click en un endpoint
2. Click en **"Try it out"**
3. Completa los parámetros
4. Para rutas protegidas:
   - Click en **"Authorize"** (🔒 arriba derecha)
   - Ingresa: `Bearer <tu-jwt-token>`
   - Click en **"Authorize"**
5. Click en **"Execute"**
6. Revisa la respuesta

### Obtener JWT Token para Testing

```bash
# Login para obtener token
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@brisacubanaclean.com",
    "password": "Admin123!"
  }'

# Copiar el token de la respuesta
# Usar en Swagger UI: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Deployment

### Variables de Entorno

```bash
# .env.example
OPENAPI_ENABLED="true"              # Habilitar en dev, desactivar en prod si es API privada
OPENAPI_SERVERS="http://localhost:3001,https://brisa-cubana-api.railway.app"
```

### Configuración de Producción

```typescript
// apps/api/src/app.ts

const isProduction = process.env.NODE_ENV === "production";
const openApiEnabled = process.env.OPENAPI_ENABLED === "true" || !isProduction;

if (openApiEnabled) {
  app.doc("/openapi.json", {
    /* ... */
  });
  app.get(
    "/api-docs",
    swaggerUI({
      /* ... */
    }),
  );
}
```

## Integración con CI/CD

### Generar OpenAPI Spec en CI

```yaml
# .github/workflows/openapi.yml
name: OpenAPI Spec

on:
  push:
    branches: [main]
    paths:
      - "apps/api/**"

jobs:
  generate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: "24"

      - name: Install pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 10

      - name: Install dependencies
        run: pnpm install

      - name: Generate OpenAPI spec
        run: |
          pnpm --filter=@brisa/api dev &
          sleep 5
          curl http://localhost:3001/openapi.json > openapi.json

      - name: Upload artifact
        uses: actions/upload-artifact@v4
        with:
          name: openapi-spec
          path: openapi.json

      - name: Commit spec to docs
        run: |
          cp openapi.json docs/reference/openapi.json
          git config user.name "GitHub Actions"
          git config user.email "actions@github.com"
          git add docs/reference/openapi.json
          git commit -m "docs: update OpenAPI spec [skip ci]" || echo "No changes"
          git push
```

## Herramientas Adicionales

### Validación de OpenAPI

```bash
# Instalar openapi-lint
npm install -g @redocly/cli

# Validar spec
redocly lint http://localhost:3001/openapi.json
```

### Generación de Clientes

```bash
# Generar cliente TypeScript
npx openapi-typescript http://localhost:3001/openapi.json --output apps/web/src/types/api-client.ts

# Generar cliente Python
pip install openapi-python-client
openapi-python-client generate --url http://localhost:3001/openapi.json
```

## Troubleshooting

### Error: "Schema not registered"

```typescript
// Asegúrate de importar schemas antes de usarlos
import { CreateBookingSchema } from "../schemas";

// No uses schemas inline sin definir
app.openapi(route, async (c) => {
  // ❌ Mal
  const data = c.req.valid("json" as never);

  // ✅ Bien
  const data = c.req.valid("json");
});
```

### Swagger UI no carga

1. Verifica que `/openapi.json` responda:

   ```bash
   curl http://localhost:3001/openapi.json
   ```

2. Revisa consola del navegador para errores CORS

3. Asegúrate de que CORS esté habilitado:
   ```typescript
   import { cors } from "hono/cors";
   app.use("/*", cors());
   ```

## Referencias

- [Hono Zod OpenAPI Docs](https://hono.dev/examples/zod-openapi)
- [OpenAPI 3.1 Specification](https://spec.openapis.org/oas/v3.1.0)
- [Swagger UI](https://swagger.io/tools/swagger-ui/)
- [ReDoc](https://redocly.com/redoc/)
- [Zod Documentation](https://zod.dev/)

---

**Última actualización:** 2025-10-04
