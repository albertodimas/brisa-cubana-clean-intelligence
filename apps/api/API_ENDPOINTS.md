# API Endpoints Documentation

Base URL: `http://localhost:3001`

## Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

Get a token by logging in (see Authentication endpoints).

---

## Health & Monitoring

### GET /health

Health check endpoint.

**Response:**

```json
{
  "status": "healthy",
  "service": "brisa-cubana-api",
  "version": "0.1.0",
  "timestamp": "2025-09-30T21:00:00.000Z"
}
```

### GET /metrics

Prometheus metrics endpoint (no auth required).

---

## Auth Endpoints

### POST /api/auth/login

Login with email and password.

**Request:**

```json
{
  "email": "admin@brisacubanaclean.com",
  "password": "demo123"
}
```

**Response (200):**

```json
{
  "id": "cmg72rzxi0000xqio1hygre4t",
  "email": "admin@brisacubanaclean.com",
  "name": "Admin User",
  "role": "ADMIN",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Errors:**

- `400`: Missing email or password
- `401`: Invalid credentials

**Example:**

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@brisacubanaclean.com",
    "password": "demo123"
  }'
```

### POST /api/auth/register

Register a new user.

**Request:**

```json
{
  "email": "newuser@example.com",
  "password": "SecurePass123!",
  "name": "John Doe",
  "phone": "+1-305-555-0100"
}
```

**Response (201):**

```json
{
  "id": "cm...",
  "email": "newuser@example.com",
  "name": "John Doe",
  "role": "CLIENT"
}
```

---

## Services

### GET /api/services

Get all active services (public endpoint, no auth required).

**Response (200):**

```json
[
  {
    "id": "basic-clean-1",
    "name": "Limpieza Básica",
    "description": "Limpieza estándar de espacios residenciales y oficinas",
    "basePrice": "89.99",
    "duration": 120,
    "active": true,
    "createdAt": "2025-09-30T21:34:16.050Z",
    "updatedAt": "2025-09-30T21:34:16.050Z"
  }
]
```

**Example:**

```bash
curl http://localhost:3001/api/services
```

### POST /api/services

Create a new service (Admin only).

**Auth Required:** Yes (ADMIN role)

**Request:**

```json
{
  "name": "Window Cleaning",
  "description": "Professional window cleaning service",
  "basePrice": 69.99,
  "duration": 90
}
```

**Response (201):**

```json
{
  "id": "cm...",
  "name": "Window Cleaning",
  ...
}
```

### PATCH /api/services/:id

Update a service (Admin only).

**Auth Required:** Yes (ADMIN role)

---

## Bookings

### GET /api/bookings

Get bookings for authenticated user.

**Auth Required:** Yes

**Query Parameters:**

- `status`: Filter by status (PENDING, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED)
- `from`: Start date (ISO format)
- `to`: End date (ISO format)

**Response (200):**

```json
[
  {
    "id": "booking-confirmed-1",
    "userId": "cm...",
    "propertyId": "prop-residential-1",
    "serviceId": "deep-clean-1",
    "scheduledAt": "2025-10-01T21:34:16.255Z",
    "totalPrice": "149.99",
    "status": "CONFIRMED",
    "paymentStatus": "PENDING_PAYMENT",
    "service": {
      "name": "Limpieza Profunda",
      "duration": 180
    },
    "property": {
      "name": "Brickell Luxury Apartment",
      "address": "1234 Brickell Ave, Unit 2501"
    }
  }
]
```

**Example:**

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3001/api/bookings?status=CONFIRMED"
```

### POST /api/bookings

Create a new booking.

**Auth Required:** Yes

**Request:**

```json
{
  "propertyId": "prop-residential-1",
  "serviceId": "basic-clean-1",
  "scheduledAt": "2025-10-15T14:00:00Z",
  "notes": "Please use eco-friendly products"
}
```

**Response (201):**

```json
{
  "id": "cm...",
  "userId": "cm...",
  "propertyId": "prop-residential-1",
  "serviceId": "basic-clean-1",
  "scheduledAt": "2025-10-15T14:00:00.000Z",
  "totalPrice": "89.99",
  "status": "PENDING",
  "paymentStatus": "PENDING_PAYMENT"
}
```

### GET /api/bookings/:id

Get a specific booking.

**Auth Required:** Yes

**Response (200):**

```json
{
  "id": "booking-confirmed-1",
  ...
}
```

### PATCH /api/bookings/:id

Update a booking.

**Auth Required:** Yes

**Request:**

```json
{
  "status": "CANCELLED",
  "cancellationReason": "Customer request"
}
```

---

## Properties

### GET /api/properties

Get properties for authenticated user.

**Auth Required:** Yes

**Response (200):**

```json
[
  {
    "id": "prop-residential-1",
    "name": "Brickell Luxury Apartment",
    "address": "1234 Brickell Ave, Unit 2501",
    "city": "Miami",
    "state": "FL",
    "zipCode": "33131",
    "type": "RESIDENTIAL",
    "size": 1200,
    "userId": "cm..."
  }
]
```

### POST /api/properties

Add a new property.

**Auth Required:** Yes

**Request:**

```json
{
  "name": "My Beach House",
  "address": "456 Ocean Drive",
  "city": "Miami Beach",
  "state": "FL",
  "zipCode": "33139",
  "type": "VACATION_RENTAL",
  "size": 1500
}
```

---

## Users

### GET /api/users/me

Get current user profile.

**Auth Required:** Yes

**Response (200):**

```json
{
  "id": "cm...",
  "email": "admin@brisacubanaclean.com",
  "name": "Admin User",
  "phone": "+1-305-555-0001",
  "role": "ADMIN",
  "createdAt": "2025-09-30T21:34:16.000Z"
}
```

### PATCH /api/users/me

Update current user profile.

**Auth Required:** Yes

**Request:**

```json
{
  "name": "Updated Name",
  "phone": "+1-305-555-9999"
}
```

### GET /api/users

Get all users (Admin only).

**Auth Required:** Yes (ADMIN role)

---

## Payments

### POST /api/payments/create-intent

Create a payment intent for a booking.

**Auth Required:** Yes

**Request:**

```json
{
  "bookingId": "booking-confirmed-1"
}
```

**Response (200):**

```json
{
  "clientSecret": "pi_xxx_secret_xxx",
  "amount": 14999
}
```

### POST /api/payments/webhook

Stripe webhook endpoint (Stripe signature validation).

**Auth Required:** No (validated via Stripe signature)

---

## Alerts

### POST /api/alerts

Send an alert (Admin/Staff only).

**Auth Required:** Yes (ADMIN or STAFF role)

**Request:**

```json
{
  "type": "BOOKING_REMINDER",
  "userId": "cm...",
  "message": "Your cleaning is scheduled for tomorrow at 2 PM",
  "channels": ["EMAIL", "SMS"]
}
```

**Response (200):**

```json
{
  "sent": true,
  "channels": {
    "EMAIL": "success",
    "SMS": "success"
  }
}
```

---

## Reports

### GET /api/reports/revenue

Get revenue report (Admin only).

**Auth Required:** Yes (ADMIN role)

**Query Parameters:**

- `from`: Start date (ISO format)
- `to`: End date (ISO format)

**Response (200):**

```json
{
  "totalRevenue": "1234.56",
  "bookingsCount": 15,
  "averageBookingValue": "82.30"
}
```

---

## Reconciliation

### GET /api/reconciliation

Get payment reconciliation data (Admin only).

**Auth Required:** Yes (ADMIN role)

**Query Parameters:**

- `from`: Start date
- `to`: End date

**Response (200):**

```json
{
  "period": {
    "from": "2025-09-01T00:00:00.000Z",
    "to": "2025-09-30T23:59:59.999Z"
  },
  "totals": {
    "expected": "5000.00",
    "received": "4850.00",
    "pending": "150.00"
  },
  "discrepancies": []
}
```

---

## Rate Limiting

API endpoints are rate limited:

- **Public endpoints**: 60 requests per minute
- **Authenticated endpoints**: 120 requests per minute
- **Admin endpoints**: 240 requests per minute

Rate limit headers included in responses:

```
X-RateLimit-Limit: 120
X-RateLimit-Remaining: 119
X-RateLimit-Reset: 1696089600
```

---

## Error Responses

All errors follow this format:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

**Common HTTP Status Codes:**

- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate resource)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

---

## Testing with cURL

### Login and store token

```bash
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@brisacubanaclean.com","password":"demo123"}' \
  | jq -r '.token')
```

### Use token in requests

```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/bookings
```

---

## Postman Collection

Import the Postman collection for easy testing:
[Download Postman Collection](./postman_collection.json)

---

## OpenAPI/Swagger

OpenAPI spec available at:
`/api/docs` (coming soon)
