# API Reference - Endpoints

Documentación completa de la API REST de Brisa Cubana Clean Intelligence.

**Base URL:** `http://localhost:3001` (desarrollo) | `https://api.brisacubana.com` (producción)

**Formato:** JSON

**Autenticación:** JWT Bearer Token (excepto endpoints públicos)

---

## Tabla de Contenidos

- [Autenticación](#autenticacion)
- [Usuarios](#usuarios)
- [Servicios](#servicios)
- [Reservas (Bookings)](#reservas-bookings)
- [Pagos](#pagos)
- [Alertas](#alertas)
- [Conciliación](#conciliacion)
- [Health Check](#health-check)

---

## Autenticación {#autenticacion}

### POST `/api/auth/login`

Autentica usuario y retorna JWT token.

**Acceso:** Público

**Request Body:**

```json
{
  "email": "admin@brisacubanaclean.com",
  "password": "Admin123!"
}
```

**Response 200:**

```json
{
  "id": "uuid-del-usuario",
  "email": "admin@brisacubanaclean.com",
  "name": "Admin User",
  "role": "ADMIN",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response 400:** `{ "error": "Invalid credentials payload", "details": {...} }`

**Response 401:** `{ "error": "Invalid email or password" }`

**Uso del Token:**

Todos los endpoints protegidos requieren el header:

```
Authorization: Bearer <token>
```

**Expiración:** 8 horas

---

## Usuarios

### GET `/api/users`

Lista todos los usuarios (paginado).

**Roles permitidos:** `ADMIN`, `STAFF`

**Headers:** `Authorization: Bearer <token>`

**Response 200:**

```json
[
  {
    "id": "uuid",
    "email": "client@brisacubanaclean.com",
    "name": "Cliente Demo",
    "phone": "+1234567890",
    "role": "CLIENT",
    "createdAt": "2025-09-30T10:00:00.000Z",
    "_count": {
      "bookings": 5,
      "properties": 2
    }
  }
]
```

**Response 403:** `{ "error": "Forbidden" }`

---

### GET `/api/users/:id`

Obtiene un usuario por ID.

**Roles permitidos:** `ADMIN`, `STAFF`, o el propio usuario

**Headers:** `Authorization: Bearer <token>`

**Response 200:**

```json
{
  "id": "uuid",
  "email": "client@brisacubanaclean.com",
  "name": "Cliente Demo",
  "phone": "+1234567890",
  "role": "CLIENT",
  "createdAt": "2025-09-30T10:00:00.000Z",
  "updatedAt": "2025-09-30T10:00:00.000Z",
  "properties": [
    {
      "id": "prop-uuid",
      "name": "Casa Principal",
      "address": "123 Main St",
      "sqft": 2000,
      "bedrooms": 3
    }
  ],
  "bookings": [
    {
      "id": "booking-uuid",
      "status": "CONFIRMED",
      "scheduledAt": "2025-10-05T14:00:00.000Z",
      "totalPrice": "150.00",
      "service": { "name": "Limpieza Estándar" },
      "property": { "name": "Casa Principal" }
    }
  ]
}
```

**Response 404:** `{ "error": "User not found" }`

---

### POST `/api/users`

Crea un nuevo usuario.

**Roles permitidos:** `ADMIN`

**Request Body:**

```json
{
  "email": "nuevo@example.com",
  "name": "Nuevo Usuario",
  "phone": "+1987654321",
  "password": "SecurePass123!",
  "role": "CLIENT"
}
```

**Response 201:**

```json
{
  "id": "uuid",
  "email": "nuevo@example.com",
  "name": "Nuevo Usuario",
  "phone": "+1987654321",
  "role": "CLIENT",
  "createdAt": "2025-09-30T12:00:00.000Z"
}
```

**Response 400:** Email ya existe o validación falló

---

### PATCH `/api/users/:id`

Actualiza un usuario.

**Roles permitidos:** `ADMIN` o el propio usuario

**Request Body:**

```json
{
  "name": "Nombre Actualizado",
  "phone": "+1111111111",
  "role": "STAFF"
}
```

**Response 200:** Usuario actualizado

**Response 400:** `{ "error": "No updates supplied" }`

---

### PATCH `/api/users/:id/password`

Cambia contraseña del usuario.

**Roles permitidos:** `ADMIN` o el propio usuario

**Request Body:**

```json
{
  "password": "NewSecurePass123!"
}
```

**Response 200:** `{ "ok": true }`

---

## Servicios

### GET `/api/services`

Lista todos los servicios activos.

**Acceso:** Público (no requiere autenticación)

**Response 200:**

```json
[
  {
    "id": "service-uuid",
    "name": "Limpieza Estándar",
    "description": "Limpieza completa de todas las áreas",
    "basePrice": "120.00",
    "duration": 180,
    "active": true,
    "createdAt": "2025-09-30T10:00:00.000Z"
  },
  {
    "id": "service-uuid-2",
    "name": "Limpieza Profunda",
    "description": "Limpieza intensiva con desinfección",
    "basePrice": "250.00",
    "duration": 300,
    "active": true,
    "createdAt": "2025-09-30T10:00:00.000Z"
  }
]
```

---

### GET `/api/services/:id`

Obtiene un servicio por ID.

**Acceso:** Público

**Response 200:** Objeto del servicio

**Response 404:** `{ "error": "Service not found" }`

---

### POST `/api/services`

Crea un nuevo servicio.

**Roles permitidos:** `ADMIN`

**Request Body:**

```json
{
  "name": "Limpieza de Ventanas",
  "description": "Limpieza de ventanas interiores y exteriores",
  "basePrice": 80,
  "duration": 120,
  "active": true
}
```

**Response 201:** Servicio creado

---

### PATCH `/api/services/:id`

Actualiza un servicio.

**Roles permitidos:** `ADMIN`

**Request Body:**

```json
{
  "basePrice": 90,
  "active": false
}
```

**Response 200:** Servicio actualizado

---

## Reservas (Bookings)

### GET `/api/bookings`

Lista todas las reservas (paginado).

**Roles permitidos:** `ADMIN`, `STAFF`

**Query Parameters:**

- `page` (default: 1)
- `limit` (default: 10, max: 100)

**Response 200:**

```json
{
  "data": [
    {
      "id": "booking-uuid",
      "userId": "user-uuid",
      "propertyId": "prop-uuid",
      "serviceId": "service-uuid",
      "scheduledAt": "2025-10-05T14:00:00.000Z",
      "status": "CONFIRMED",
      "paymentStatus": "PAID",
      "totalPrice": "150.00",
      "notes": "Traer productos hipoalergénicos",
      "user": {
        "id": "user-uuid",
        "name": "Cliente Demo",
        "email": "client@brisacubanaclean.com"
      },
      "property": {
        "id": "prop-uuid",
        "name": "Casa Principal",
        "address": "123 Main St"
      },
      "service": {
        "id": "service-uuid",
        "name": "Limpieza Estándar",
        "basePrice": "120.00"
      }
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 42,
    "totalPages": 5
  }
}
```

---

### GET `/api/bookings/mine`

Obtiene reservas del usuario autenticado.

**Roles permitidos:** `CLIENT`, `ADMIN`, `STAFF`

**Response 200:** Array de reservas (últimas 10)

---

### GET `/api/bookings/:id`

Obtiene una reserva por ID.

**Roles permitidos:** `ADMIN`, `STAFF`, o el propio cliente

**Response 200:** Objeto de la reserva completo

**Response 404:** `{ "error": "Booking not found" }`

**Response 403:** Si el cliente intenta ver reserva de otro usuario

---

### POST `/api/bookings`

Crea una nueva reserva.

**Roles permitidos:** Todos los usuarios autenticados

**Request Body:**

```json
{
  "userId": "user-uuid",
  "propertyId": "prop-uuid",
  "serviceId": "service-uuid",
  "scheduledAt": "2025-10-10T10:00:00.000Z",
  "totalPrice": 150,
  "notes": "Favor de tocar el timbre"
}
```

**Response 201:**

```json
{
  "booking": {
    "id": "new-booking-uuid",
    "userId": "user-uuid",
    "propertyId": "prop-uuid",
    "serviceId": "service-uuid",
    "scheduledAt": "2025-10-10T10:00:00.000Z",
    "status": "PENDING",
    "paymentStatus": "PENDING_PAYMENT",
    "totalPrice": "150.00",
    "checkoutSessionId": "cs_test_...",
    "paymentIntentId": "pi_...",
    "user": {...},
    "property": {...},
    "service": {...}
  },
  "checkoutUrl": "https://checkout.stripe.com/c/pay/cs_test_..."
}
```

**Notas:**

- Si Stripe está habilitado, se crea automáticamente una sesión de Checkout
- El usuario es redirigido a `checkoutUrl` para completar el pago
- Clientes solo pueden crear reservas para sus propias propiedades

---

### PATCH `/api/bookings/:id`

Actualiza estado de una reserva.

**Roles permitidos:** `ADMIN`, `STAFF`

**Request Body:**

```json
{
  "status": "IN_PROGRESS",
  "notes": "Iniciando servicio"
}
```

**Valores permitidos para `status`:**

- `PENDING`
- `CONFIRMED`
- `IN_PROGRESS`
- `COMPLETED`
- `CANCELLED`

**Response 200:** Reserva actualizada

**Nota:** Si status cambia a `COMPLETED`, se registra automáticamente `completedAt`

---

### DELETE `/api/bookings/:id`

Cancela una reserva (cambia status a CANCELLED).

**Roles permitidos:** `ADMIN`, `STAFF`

**Response 200:** Reserva cancelada

---

## Pagos

### POST `/api/payments/checkout-session`

Crea una sesión de Stripe Checkout para una reserva existente.

**Roles permitidos:** Todos (con restricciones)

**Request Body:**

```json
{
  "bookingId": "booking-uuid"
}
```

**Response 200:**

```json
{
  "booking": {
    "id": "booking-uuid",
    "checkoutSessionId": "cs_test_...",
    "paymentStatus": "PENDING_PAYMENT",
    "paymentIntentId": "pi_..."
  },
  "checkoutUrl": "https://checkout.stripe.com/c/pay/cs_test_..."
}
```

**Response 400:** Stripe deshabilitado o bookingId faltante

**Response 403:** Clientes solo pueden pagar sus propias reservas

**Response 404:** Reserva no encontrada

---

### POST `/api/payments/webhook`

Webhook de Stripe para eventos de pago.

**Acceso:** Solo desde Stripe (verifica signature)

**Headers:**

- `stripe-signature`: Firma del webhook

**Eventos procesados:**

- `checkout.session.completed`: Pago exitoso → status `CONFIRMED`, paymentStatus `PAID`
- `checkout.session.expired`: Sesión expirada → paymentStatus `FAILED`
- `payment_intent.payment_failed`: Pago fallido → paymentStatus `FAILED`

**Response 200:** `ok`

**Response 400:** Signature inválida o faltante

**Configuración requerida:**

```bash
# En apps/api/.env
STRIPE_WEBHOOK_SECRET="whsec_..."
```

**Testing local:**

```bash
stripe listen --forward-to localhost:3001/api/payments/webhook
```

---

## Alertas

### GET `/api/alerts/payment`

Lista alertas de pagos.

**Roles permitidos:** `ADMIN`, `STAFF`

**Query Parameters:**

- `limit` (default: 20, max: 100)
- `startDate` (ISO 8601)
- `endDate` (ISO 8601)
- `minFailed` (número mínimo de pagos fallidos)
- `minPending` (número mínimo de pagos pendientes)

**Response 200:**

```json
[
  {
    "id": "alert-uuid",
    "failedPayments": 3,
    "pendingPayments": 12,
    "payloadHash": "3-12",
    "triggeredAt": "2025-09-30T15:30:00.000Z"
  }
]
```

---

### POST `/api/alerts/payment`

Crea alerta de pagos (envía a Slack si configurado).

**Roles permitidos:** `ADMIN`, `STAFF`

**Request Body:**

```json
{
  "failedPayments": 2,
  "pendingPayments": 8
}
```

**Response 200:**

```json
{
  "queued": true,
  "alert": {
    "id": "alert-uuid",
    "failedPayments": 2,
    "pendingPayments": 8,
    "triggeredAt": "2025-09-30T16:00:00.000Z"
  }
}
```

**Respuestas alternativas:**

- `{ "queued": false, "reason": "threshold" }` - No alcanza umbral (failed=0 y pending≤5)
- `{ "queued": false, "reason": "duplicate" }` - Ya existe alerta idéntica en últimos 10 minutos

**Configuración Slack:**

```bash
# En apps/api/.env
ALERTS_SLACK_WEBHOOK="https://hooks.slack.com/services/..."
```

---

## Conciliación {#conciliacion}

### GET `/api/reconciliation/history/resolved`

Lista notas de conciliación resueltas.

**Roles permitidos:** `ADMIN`, `STAFF`

**Query Parameters:**

- `limit` (default: 20, max: 100)
- `startDate` (ISO 8601)
- `endDate` (ISO 8601)
- `authorEmail` (filtro por email del autor)
- `bookingId` (filtro por reserva)

**Response 200:** Array de notas con status `RESOLVED`

---

### GET `/api/reconciliation/history/open`

Lista notas de conciliación abiertas.

**Roles permitidos:** `ADMIN`, `STAFF`

**Query Parameters:** Igual que `/history/resolved`

**Response 200:** Array de notas con status `OPEN`

---

### GET `/api/reconciliation/booking/:bookingId`

Obtiene todas las notas de conciliación para una reserva.

**Roles permitidos:** `ADMIN`, `STAFF`

**Query Parameters:**

- `status` (`OPEN` | `RESOLVED`)

**Response 200:**

```json
[
  {
    "id": "note-uuid",
    "bookingId": "booking-uuid",
    "authorId": "user-uuid",
    "message": "Cliente reporta pago duplicado en Stripe",
    "status": "RESOLVED",
    "createdAt": "2025-09-29T10:00:00.000Z",
    "resolvedAt": "2025-09-30T14:00:00.000Z",
    "resolvedById": "admin-uuid",
    "author": {
      "id": "user-uuid",
      "name": "Staff Member",
      "email": "staff@brisacubana.com"
    },
    "resolvedBy": {
      "id": "admin-uuid",
      "name": "Admin User",
      "email": "admin@brisacubanaclean.com"
    }
  }
]
```

---

### POST `/api/reconciliation/booking/:bookingId`

Crea una nota de conciliación para una reserva.

**Roles permitidos:** `ADMIN`, `STAFF`

**Request Body:**

```json
{
  "message": "Verificar pago en Stripe - cliente reporta cobro incorrecto",
  "status": "OPEN"
}
```

**Response 201:** Nota creada

---

### PATCH `/api/reconciliation/note/:noteId`

Actualiza una nota de conciliación.

**Roles permitidos:** `ADMIN`, `STAFF`

**Request Body:**

```json
{
  "message": "Reembolso procesado - caso cerrado",
  "status": "RESOLVED"
}
```

**Response 200:** Nota actualizada

**Nota:** Al cambiar a `RESOLVED`, se registra automáticamente `resolvedAt` y `resolvedById`

---

## Health Check

### GET `/health`

Verifica que la API esté funcionando.

**Acceso:** Público

**Response 200:**

```json
{
  "status": "ok",
  "timestamp": "2025-09-30T12:34:56.789Z",
  "version": "1.0.0"
}
```

---

## Códigos de Estado HTTP

- **200 OK**: Operación exitosa
- **201 Created**: Recurso creado exitosamente
- **400 Bad Request**: Payload inválido o parámetros incorrectos
- **401 Unauthorized**: Token faltante o inválido
- **403 Forbidden**: Usuario no tiene permisos para esta operación
- **404 Not Found**: Recurso no encontrado
- **500 Internal Server Error**: Error del servidor

---

## Roles y Permisos

### Roles disponibles

- **`CLIENT`**: Usuario regular, puede ver/crear sus propias reservas
- **`STAFF`**: Personal de limpieza, acceso a gestión de reservas
- **`ADMIN`**: Acceso completo al sistema

### Matriz de permisos

| Endpoint                  | CLIENT | STAFF | ADMIN |
| ------------------------- | ------ | ----- | ----- |
| `POST /auth/login`        | ✅     | ✅    | ✅    |
| `GET /services`           | ✅     | ✅    | ✅    |
| `GET /users`              | ❌     | ✅    | ✅    |
| `GET /users/:id` (propio) | ✅     | ✅    | ✅    |
| `GET /users/:id` (otro)   | ❌     | ✅    | ✅    |
| `POST /users`             | ❌     | ❌    | ✅    |
| `POST /services`          | ❌     | ❌    | ✅    |
| `GET /bookings`           | ❌     | ✅    | ✅    |
| `GET /bookings/mine`      | ✅     | ✅    | ✅    |
| `POST /bookings`          | ✅     | ✅    | ✅    |
| `PATCH /bookings/:id`     | ❌     | ✅    | ✅    |
| `GET /alerts/*`           | ❌     | ✅    | ✅    |
| `GET /reconciliation/*`   | ❌     | ✅    | ✅    |

---

## Variables de Entorno Requeridas

```bash
# JWT
JWT_SECRET="clave-secreta-minimo-32-caracteres"

# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/db"

# Stripe (opcional pero recomendado)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# URLs de la app web
WEB_APP_URL="http://localhost:3000"
STRIPE_SUCCESS_URL="${WEB_APP_URL}/dashboard?payment=success"
STRIPE_CANCEL_URL="${WEB_APP_URL}/dashboard?payment=cancelled"

# Alertas Slack (opcional)
ALERTS_SLACK_WEBHOOK="https://hooks.slack.com/services/..."
```

---

## Ejemplos de Uso con cURL

### Login

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@brisacubanaclean.com","password":"Admin123!"}'
```

### Listar servicios

```bash
curl http://localhost:3001/api/services
```

### Crear reserva (autenticado)

```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

curl -X POST http://localhost:3001/api/bookings \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-uuid",
    "propertyId": "prop-uuid",
    "serviceId": "service-uuid",
    "scheduledAt": "2025-10-15T10:00:00Z",
    "totalPrice": 120
  }'
```

### Mis reservas

```bash
curl http://localhost:3001/api/bookings/mine \
  -H "Authorization: Bearer $TOKEN"
```

---

## Testing con Postman/Insomnia

1. Importar collection con base URL: `http://localhost:3001`
2. Crear environment variable `{{token}}`
3. Ejecutar `POST /api/auth/login` y copiar token
4. Configurar Authorization: `Bearer {{token}}` en collection

---

## Rate Limiting (Roadmap)

⚠️ **Actualmente no implementado** - Planificado para v0.2.0:

- 100 requests/minuto por IP
- 500 requests/hora por usuario autenticado

---

## Versionado

**Versión actual:** v1 (sin prefijo en URL)

**Roadmap:** Se agregará versionado `/api/v1/` en futuras versiones para mantener compatibilidad retroactiva.

---

**Documentación generada:** 30 de septiembre de 2025

**Changelog:** [Registro de cambios](../changelog/index.md)
