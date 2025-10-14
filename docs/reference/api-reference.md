# API Documentation - OpenAPI/Swagger

**Última actualización:** 14 de octubre de 2025

---

## Overview

La API de Brisa Cubana Clean Intelligence está completamente documentada con **OpenAPI 3.1** specification. Toda la documentación interactiva está disponible a través de **Scalar API Reference**, una interfaz moderna y funcional para explorar y probar los endpoints.

---

## Acceso a la Documentación Interactiva

### Producción

**URL:** https://brisa-cubana-clean-intelligence-api.vercel.app/api/docs

Interfaz interactiva con:

- 📖 Especificación completa de todos los endpoints
- 🧪 Pruebas en vivo (Try it out)
- 📋 Ejemplos de request/response
- 🔐 Autenticación JWT integrada
- 📱 Responsive design
- 🎨 Tema purple personalizado

### Desarrollo Local

**URL:** http://localhost:3001/api/docs

Misma interfaz que producción, con datos locales.

---

## Especificación OpenAPI JSON

### Producción

**URL:** https://brisa-cubana-clean-intelligence-api.vercel.app/api/openapi.json

Especificación completa en formato JSON, útil para:

- Importar en Postman/Insomnia
- Generación de clientes automáticos (OpenAPI Generator, Swagger Codegen)
- Integración con herramientas CI/CD
- Validación de contratos

### Desarrollo Local

**URL:** http://localhost:3001/api/openapi.json

---

## Estructura de la Especificación

### 1. Información General

```yaml
openapi: 3.1.0
info:
  title: Brisa Cubana Clean Intelligence API
  version: 0.3.0
  description: API para gestión de servicios de limpieza, reservas, propiedades y usuarios
  contact:
    name: Brisa Cubana Support
    email: admin@brisacubanaclean.com
```

### 2. Servidores

```yaml
servers:
  - url: https://brisa-cubana-clean-intelligence-api.vercel.app
    description: Production
  - url: http://localhost:3001
    description: Development
```

### 3. Tags (Agrupación de Endpoints)

- **Authentication**: Autenticación y gestión de sesión
- **Users**: Gestión de usuarios (ADMIN only)
- **Services**: Catálogo de servicios de limpieza
- **Properties**: Gestión de propiedades
- **Bookings**: Reservas de servicios
- **Customers**: Clientes del sistema
- **Health**: Health checks y monitoreo

### 4. Seguridad

**Esquema:** Bearer Authentication (JWT)

```yaml
securitySchemes:
  BearerAuth:
    type: http
    scheme: bearer
    bearerFormat: JWT
    description: JWT token obtained from /api/authentication/login
```

**Uso en endpoints:**

```yaml
security:
  - BearerAuth: []
```

---

## Endpoints Documentados

### Health & Monitoring

- `GET /api` - API root endpoint
- `GET /api/health` - Health check con validación de base de datos
- `GET /api/openapi.json` - Especificación OpenAPI JSON
- `GET /api/docs` - Interfaz interactiva Scalar

### Authentication

- `POST /api/authentication/login` - Login de usuario (rate limited: 5/60s por defecto, configurable vía `LOGIN_RATE_LIMIT`)
- `POST /api/authentication/logout` - Logout de usuario
- `GET /api/authentication/me` - Obtener usuario actual

### Users (ADMIN only)

- `GET /api/users` - Listar todos los usuarios
- `POST /api/users` - Crear nuevo usuario
- `PATCH /api/users/{userId}` - Actualizar usuario
- `DELETE /api/users/{userId}` - Desactivar usuario (ADMIN, soft delete)

### Services

- `GET /api/services` - Listar servicios (público)
- `POST /api/services` - Crear servicio (ADMIN/COORDINATOR)
- `PATCH /api/services/{serviceId}` - Actualizar servicio (ADMIN/COORDINATOR)
- `DELETE /api/services/{serviceId}` - Desactivar servicio (ADMIN, soft delete)

### Properties

- `GET /api/properties` - Listar propiedades (público)
- `POST /api/properties` - Crear propiedad (ADMIN/COORDINATOR)
- `PATCH /api/properties/{propertyId}` - Actualizar propiedad (ADMIN/COORDINATOR)
- `DELETE /api/properties/{propertyId}` - Desactivar propiedad (ADMIN, soft delete)

### Bookings

- `GET /api/bookings` - Listar reservas (con filtros)
- `POST /api/bookings` - Crear reserva (ADMIN/COORDINATOR)
- `PATCH /api/bookings/{bookingId}` - Actualizar reserva
- `DELETE /api/bookings/{bookingId}` - Desactivar reserva (ADMIN/COORDINATOR, soft delete)

### Customers

- `GET /api/customers` - Listar clientes (ADMIN/COORDINATOR)

---

## Ejemplos de Uso

### 1. Obtener Token de Autenticación

**Request:**

```bash
curl -X POST https://brisa-cubana-clean-intelligence-api.vercel.app/api/authentication/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@brisacubanaclean.com",
    "password": "Brisa123!"
  }'
```

**Response:**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "clxyz123456789",
    "email": "admin@brisacubanaclean.com",
    "fullName": "Admin User",
    "role": "ADMIN",
    "isActive": true
  }
}
```

### 2. Usar Token en Requests Autenticados

**Request:**

```bash
curl -X GET https://brisa-cubana-clean-intelligence-api.vercel.app/api/users \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### 3. Crear Usuario (ADMIN only)

**Request:**

```bash
curl -X POST https://brisa-cubana-clean-intelligence-api.vercel.app/api/users \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "fullName": "Jane Smith",
    "password": "SecurePass123",
    "role": "STAFF"
  }'
```

**Response (201):**

```json
{
  "data": {
    "id": "clxyz987654321",
    "email": "newuser@example.com",
    "fullName": "Jane Smith",
    "role": "STAFF",
    "isActive": true,
    "createdAt": "2025-10-09T12:00:00.000Z",
    "updatedAt": "2025-10-09T12:00:00.000Z"
  }
}
```

---

## Schemas de Datos

Todos los schemas están completamente documentados en la especificación OpenAPI y visibles en [/api/docs](https://brisa-cubana-clean-intelligence-api.vercel.app/api/docs).

### Principales Schemas

- **User**: Usuario del sistema con roles (ADMIN, COORDINATOR, STAFF, CLIENT)
- **Service**: Servicio de limpieza con precio y duración
- **Property**: Propiedad inmobiliaria (RESIDENTIAL, VACATION_RENTAL, OFFICE)
- **Booking**: Reserva de servicio con estados (PENDING, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED)
- **Customer**: Cliente del sistema

### Validaciones

Todas las validaciones están documentadas con:

- `required`: Campos obligatorios
- `minLength`/`maxLength`: Longitud de strings
- `minimum`/`maximum`: Valores numéricos
- `format`: Tipos especiales (email, date-time, password)
- `enum`: Valores permitidos
- `nullable`: Permite null

---

## Respuestas de Error Estándar

### 400 Bad Request

```json
{
  "error": "Validación fallida: email es requerido"
}
```

### 401 Unauthorized

```json
{
  "error": "Unauthorized"
}
```

### 403 Forbidden

```json
{
  "error": "Requiere rol ADMIN"
}
```

### 404 Not Found

```json
{
  "error": "Recurso no encontrado"
}
```

### 409 Conflict

```json
{
  "error": "Email ya registrado"
}
```

### 429 Too Many Requests

```json
{
  "error": "Too many requests"
}
```

### 500 Internal Server Error

```json
{
  "error": "Internal server error"
}
```

---

## Importar en Postman

### Opción 1: URL de Especificación

1. Abrir Postman
2. File → Import
3. Seleccionar "Link"
4. Pegar: `https://brisa-cubana-clean-intelligence-api.vercel.app/api/openapi.json`
5. Import

### Opción 2: Archivo JSON

1. Descargar: `curl -o openapi.json https://brisa-cubana-clean-intelligence-api.vercel.app/api/openapi.json`
2. Postman → File → Import
3. Seleccionar archivo `openapi.json`
4. Import

**Resultado:**

- Colección completa con todos los endpoints
- Ejemplos de request/response
- Variables de entorno pre-configuradas

---

## Importar en Insomnia

1. Abrir Insomnia
2. Application → Preferences → Data → Import Data
3. From URL: `https://brisa-cubana-clean-intelligence-api.vercel.app/api/openapi.json`
4. Import

---

## Generar Clientes Automáticamente

### JavaScript/TypeScript (fetch)

```bash
npx @openapitools/openapi-generator-cli generate \
  -i https://brisa-cubana-clean-intelligence-api.vercel.app/api/openapi.json \
  -g typescript-fetch \
  -o ./generated-client
```

### Python

```bash
npx @openapitools/openapi-generator-cli generate \
  -i https://brisa-cubana-clean-intelligence-api.vercel.app/api/openapi.json \
  -g python \
  -o ./python-client
```

### Java

```bash
npx @openapitools/openapi-generator-cli generate \
  -i https://brisa-cubana-clean-intelligence-api.vercel.app/api/openapi.json \
  -g java \
  -o ./java-client
```

### Otros lenguajes soportados

- `csharp`
- `go`
- `php`
- `ruby`
- `swift`
- `kotlin`
- `rust`
- Y [más de 50 lenguajes](https://openapi-generator.tech/docs/generators)

---

## Validación de Contratos

### Validar Especificación

```bash
# Instalar validator
npm install -g @apidevtools/swagger-cli

# Validar
swagger-cli validate https://brisa-cubana-clean-intelligence-api.vercel.app/api/openapi.json
```

### Validar Responses en Tests

```typescript
import { validateAgainstSchema } from "openapi-response-validator";

const response = await fetch("/api/users", {
  headers: { Authorization: `Bearer ${token}` },
});
const data = await response.json();

// Validar contra schema OpenAPI
const valid = validateAgainstSchema({
  schema: openApiSpec.components.schemas.User,
  data: data.data[0],
});

expect(valid).toBe(true);
```

---

## Interfaz Scalar - Features

### 🎨 Tema Purple Personalizado

```typescript
app.get(
  "/api/docs",
  apiReference({
    url: "/api/openapi.json",
    theme: "purple",
    pageTitle: "Brisa Cubana Clean Intelligence API",
  }),
);
```

### 🧪 Try It Out

- Ejecutar requests directamente desde la interfaz
- Guardar tokens de autenticación
- Ver responses en tiempo real
- Copiar como cURL, JavaScript, Python, etc.

### 📋 Code Examples

Ejemplos automáticos en múltiples lenguajes:

- cURL
- JavaScript (fetch, axios)
- Python (requests)
- PHP (cURL, Guzzle)
- Ruby (Net::HTTP)
- Go (net/http)
- Java (OkHttp, Unirest)

### 🔍 Search

Búsqueda rápida de endpoints por:

- Nombre
- Path
- Método HTTP
- Tag
- Descripción

### 📱 Responsive

Interfaz optimizada para:

- Desktop
- Tablet
- Mobile

---

## Mantenimiento de la Documentación

### Actualizar Especificación

**Archivo:** `apps/api/src/lib/openapi-spec.ts`

Cuando agregues nuevos endpoints o modifiques existentes:

1. Actualiza `openapi-spec.ts` con los nuevos paths/schemas
2. Ejecuta `pnpm typecheck` para validar TypeScript
3. Prueba en local: http://localhost:3001/api/docs
4. Commit y push (se despliega automáticamente)

### Validar Cambios

```bash
# TypeCheck
pnpm typecheck

# Lint
pnpm lint

# Tests
pnpm test

# Verificar spec localmente
curl http://localhost:3001/api/openapi.json | jq
```

### Versionado

La versión de la API está sincronizada con `apps/api/package.json`:

```json
{
  "version": "0.3.0"
}
```

Cuando haya breaking changes:

1. Incrementar `MAJOR` version (0.3.0 → 1.0.0)
2. Actualizar `openapi-spec.ts`:
   ```typescript
   info: {
     version: "1.0.0";
   }
   ```
3. Documentar cambios en `CHANGELOG.md`

---

## CI/CD Integration

La documentación se despliega automáticamente con cada push a `main`:

```yaml
# .github/workflows/ci.yml
- name: Deploy API to Vercel
  run: vercel deploy --prod --token=${{ secrets.VERCEL_TOKEN }}
```

**URLs actualizadas automáticamente:**

- Production: https://brisa-cubana-clean-intelligence-api.vercel.app/api/docs
- Preview (PRs): https://brisa-cubana-clean-intelligence-api-{branch}.vercel.app/api/docs

---

## Troubleshooting

### Documentación no se actualiza

**Causa:** Cache de CDN de Scalar

**Solución:**

```bash
# Forzar refresh hard en navegador
Ctrl+Shift+R (Windows/Linux)
Cmd+Shift+R (Mac)

# O agregar query param
/api/docs?v=2
```

### Error "Failed to fetch /api/openapi.json"

**Causa:** CORS o ruta incorrecta

**Verificar:**

```bash
curl -I https://brisa-cubana-clean-intelligence-api.vercel.app/api/openapi.json
```

**Solución:** Verificar que `ALLOWED_ORIGINS` incluya el dominio en Vercel env vars.

### Scalar no carga en local

**Causa:** Puerto incorrecto o servicio no iniciado

**Verificar:**

```bash
# Verificar que API esté corriendo
curl http://localhost:3001/api/health

# Iniciar dev server
pnpm dev
```

---

## Referencias

- [OpenAPI 3.1 Specification](https://spec.openapis.org/oas/v3.1.0)
- [Scalar Documentation](https://guides.scalar.com/)
- [OpenAPI Generator](https://openapi-generator.tech/)
- [Hono Framework](https://hono.dev/)
- [Scalar for Hono](https://guides.scalar.com/scalar/scalar-api-references/integrations/hono)

**Última actualización:** 14 de octubre de 2025
**Versión de la API:** 0.3.0
**Versión de OpenAPI:** 3.1.0
**Interfaz:** Scalar API Reference v0.9.21
