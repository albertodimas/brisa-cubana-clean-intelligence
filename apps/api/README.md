# Brisa Cubana API (@brisa/api)

Backend REST API built with Hono.js, Prisma ORM, and PostgreSQL for the Brisa Cubana Clean Intelligence platform.

## 🚀 Quick Start

```bash
# From project root
pnpm install

# Setup environment variables
cp apps/api/.env.example apps/api/.env
# Edit apps/api/.env with your values

# Start PostgreSQL
docker compose up -d postgres

# Generate Prisma Client
pnpm --filter=@brisa/api db:generate

# Run migrations
pnpm --filter=@brisa/api db:push

# Seed database
pnpm --filter=@brisa/api db:seed

# Start development server
pnpm --filter=@brisa/api dev
```

API will be available at: **http://localhost:3001**

---

## 📋 Table of Contents

- [🏗️ Architecture](#️-architecture)
- [🛠️ Tech Stack](#️-tech-stack)
- [📡 API Endpoints](#-api-endpoints)
- [🔐 Authentication](#-authentication)
- [🗄️ Database Schema](#️-database-schema)
- [🧪 Testing](#-testing)
- [💻 Development](#-development)
- [🚀 Deployment](#-deployment)

---

## 🏗️ Architecture

```
apps/api/
├── prisma/
│   ├── schema.prisma      # Database schema
│   ├── seed.ts            # Initial data
│   └── migrations/        # Migration history
├── src/
│   ├── routes/            # API route handlers
│   │   ├── auth.ts        # Authentication endpoints
│   │   ├── users.ts       # User management
│   │   ├── properties.ts  # Property CRUD
│   │   ├── services.ts    # Service catalog
│   │   ├── bookings.ts    # Booking management
│   │   ├── payments.ts    # Stripe integration
│   │   ├── alerts.ts      # Payment alerts
│   │   └── reconciliation.ts # Payment reconciliation
│   ├── middleware/
│   │   └── auth.ts        # JWT authentication
│   ├── lib/
│   │   ├── db.ts          # Prisma client
│   │   ├── token.ts       # JWT utilities
│   │   ├── password.ts    # Password hashing
│   │   └── stripe.ts      # Stripe client
│   ├── telemetry/
│   │   └── sentry.ts      # Error tracking
│   ├── generated/         # Prisma generated client
│   ├── schemas.ts         # Zod validation schemas
│   ├── app.ts             # Hono app setup
│   └── server.ts          # Entry point
├── scripts/
│   └── reconcile-payments.ts  # Payment sync script
├── vitest.config.ts       # Test configuration
└── tsconfig.json          # TypeScript config
```

---

## 🛠️ Tech Stack

- **Framework**: [Hono 4.9.9](https://hono.dev/) - Ultrafast web framework
- **ORM**: [Prisma 6.16.2](https://www.prisma.io/) - Type-safe database client
- **Database**: PostgreSQL 17
- **Validation**: [Zod 3.23.8](https://zod.dev/) - Schema validation
- **Authentication**: JWT with bcryptjs
- **Payments**: [Stripe SDK 17.6.0](https://stripe.com/docs/api)
- **Testing**: [Vitest 3.2.4](https://vitest.dev/) - Unit testing
- **Runtime**: Node.js 24.9.0 (Bun compatible)

---

## 📡 API Endpoints

### Authentication

```http
POST   /api/auth/login      # Login with email/password
POST   /api/auth/register   # Register new user
```

### Users

```http
GET    /api/users           # List users (ADMIN/STAFF)
GET    /api/users/:id       # Get user by ID
POST   /api/users           # Create user (ADMIN)
PATCH  /api/users/:id       # Update user
PATCH  /api/users/:id/password  # Update password
DELETE /api/users/:id       # Delete user (ADMIN)
```

### Properties

```http
GET    /api/properties      # List user's properties
GET    /api/properties/:id  # Get property by ID
POST   /api/properties      # Create property
PATCH  /api/properties/:id  # Update property
DELETE /api/properties/:id  # Delete property
```

### Services

```http
GET    /api/services        # List available services
GET    /api/services/:id    # Get service by ID
POST   /api/services        # Create service (ADMIN)
PATCH  /api/services/:id    # Update service (ADMIN)
DELETE /api/services/:id    # Delete service (ADMIN)
```

### Bookings

```http
GET    /api/bookings        # List bookings
GET    /api/bookings/:id    # Get booking by ID
POST   /api/bookings        # Create booking (with payment)
PATCH  /api/bookings/:id    # Update booking
DELETE /api/bookings/:id    # Delete booking
```

### Payments

```http
POST   /api/payments/checkout-session  # Create Stripe checkout
POST   /api/payments/webhook           # Stripe webhook handler
```

### Alerts & Reconciliation

```http
GET    /api/alerts/payment             # List payment alerts (ADMIN/STAFF)
POST   /api/reconciliation/notes       # Create reconciliation note
GET    /api/reconciliation/notes       # List notes
PATCH  /api/reconciliation/notes/:id   # Update note status
```

**Full API Documentation:** See [docs/api/endpoints.md](../../docs/api/endpoints.md)

---

## 🔐 Authentication

### JWT Token Flow

1. **Login**: POST `/api/auth/login`

   ```json
   {
     "email": "user@example.com",
     "password": "password123"
   }
   ```

2. **Response**: Receive JWT token

   ```json
   {
     "token": "eyJhbGciOiJIUzI1NiIs...",
     "user": {
       "id": "...",
       "email": "user@example.com",
       "role": "CLIENT"
     }
   }
   ```

3. **Protected Routes**: Include token in Authorization header
   ```http
   Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
   ```

### JWT Token Structure

```typescript
interface AccessTokenPayload {
  sub: string; // User ID
  email: string; // User email
  role: UserRole; // CLIENT | STAFF | ADMIN
  iat: number; // Issued at
  exp: number; // Expires at (8 hours)
}
```

### Role-Based Access Control (RBAC)

| Role       | Permissions                           |
| ---------- | ------------------------------------- |
| **CLIENT** | Own bookings, properties              |
| **STAFF**  | All bookings, alerts, reconciliation  |
| **ADMIN**  | Full access (users, services, config) |

---

## 🗄️ Database Schema

### Core Models

```prisma
model User {
  id           String   @id @default(cuid())
  email        String   @unique
  passwordHash String
  name         String?
  phone        String?
  role         UserRole @default(CLIENT)
  properties   Property[]
  bookings     Booking[]
}

model Property {
  id       String       @id @default(cuid())
  name     String
  address  String
  type     PropertyType
  size     Int          // square feet
  userId   String
  user     User         @relation(...)
  bookings Booking[]
}

model Service {
  id          String  @id @default(cuid())
  name        String
  description String?
  basePrice   Decimal
  duration    Int     // minutes
  active      Boolean @default(true)
}

model Booking {
  id                String        @id @default(cuid())
  userId            String
  propertyId        String
  serviceId         String
  scheduledAt       DateTime
  totalPrice        Decimal
  status            BookingStatus
  paymentStatus     PaymentStatus
  paymentIntentId   String?
  checkoutSessionId String?
  user              User          @relation(...)
  property          Property      @relation(...)
  service           Service       @relation(...)
}
```

**Full Schema**: See [`prisma/schema.prisma`](./prisma/schema.prisma)

---

## 🧪 Testing

### Run Tests

```bash
# All tests
pnpm --filter=@brisa/api test

# Watch mode
pnpm --filter=@brisa/api test:watch

# With coverage
pnpm --filter=@brisa/api test --coverage
```

### Test Structure

```
src/
├── routes/
│   ├── auth.ts
│   ├── auth.test.ts      ✓ Login, Register
│   ├── users.ts
│   ├── users.test.ts     ✓ CRUD operations
│   ├── bookings.ts
│   └── bookings.test.ts  ✓ Booking flow
```

### Coverage Thresholds

- **Lines**: 70%
- **Functions**: 70%
- **Branches**: 70%
- **Statements**: 70%

---

## 💻 Development

### Available Scripts

```bash
# Development
pnpm dev              # Start dev server with hot reload
pnpm dev:bun          # Run with Bun runtime

# Building
pnpm build            # Build for production (tsup)

# Database
pnpm db:generate      # Generate Prisma Client
pnpm db:push          # Sync schema to database
pnpm db:migrate       # Create and apply migration
pnpm db:studio        # Open Prisma Studio GUI
pnpm db:seed          # Seed database with initial data

# Testing
pnpm test             # Run unit tests
pnpm test:watch       # Run tests in watch mode
pnpm typecheck        # TypeScript type checking
pnpm lint             # ESLint

# Utilities
pnpm payments:reconcile  # Sync Stripe payment statuses
```

### Environment Variables

**Required:**

```env
DATABASE_URL="postgresql://user:password@host:5432/dbname"
JWT_SECRET="64-char-hex-string"
```

**Optional:**

```env
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
ALERTS_SLACK_WEBHOOK="https://hooks.slack.com/..."
SENTRY_DSN="https://...@sentry.io/..."
```

**Full list**: See [`.env.example`](./.env.example)

### Database Migrations

```bash
# Create new migration
pnpm db:migrate

# Reset database (⚠️ deletes all data)
pnpm prisma migrate reset

# View pending migrations
pnpm prisma migrate status
```

### Stripe Webhooks (Local Development)

```bash
# Terminal 1: Start API
pnpm dev

# Terminal 2: Forward Stripe webhooks
pnpm stripe:listen

# Terminal 3: Trigger test event
pnpm stripe:trigger checkout.session.completed
```

---

## 🚀 Deployment

### Production Build

```bash
# Build optimized bundle
pnpm build

# Output: dist/server.js (ESM format, minified)
```

### Environment Setup

1. **Database**: PostgreSQL 17 (Railway, Neon, Supabase)
2. **Secrets**: Configure in deployment platform
3. **Migrations**: Run `prisma migrate deploy`
4. **Seed**: Run seed script for initial data

### Deployment Platforms

#### Railway

```bash
# railway.json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "pnpm install && pnpm --filter=@brisa/api build"
  },
  "deploy": {
    "startCommand": "node apps/api/dist/server.js"
  }
}
```

#### Fly.io

See [`apps/api/Dockerfile`](./Dockerfile) (to be created)

#### Docker

```bash
# Build image
docker build -t brisa-api:latest -f apps/api/Dockerfile .

# Run container
docker run -p 3001:3001 --env-file apps/api/.env brisa-api:latest
```

---

## 🔧 Troubleshooting

### Error: "Cannot find module '@prisma/client'"

```bash
pnpm --filter=@brisa/api db:generate
```

### Error: "P1001: Can't reach database server"

```bash
# Start PostgreSQL
docker compose up -d postgres

# Check connection
psql $DATABASE_URL -c "SELECT 1"
```

### Error: "JWT verification failed"

- Check `JWT_SECRET` matches across all services
- Verify token hasn't expired (8 hour lifetime)
- Regenerate secret: `openssl rand -hex 64`

### Error: "Stripe signature verification failed"

- Verify `STRIPE_WEBHOOK_SECRET` is correct
- Use Stripe CLI for local testing: `pnpm stripe:listen`
- Check webhook endpoint in Stripe Dashboard

---

## 📚 Additional Resources

- [Hono Documentation](https://hono.dev/)
- [Prisma Guides](https://www.prisma.io/docs/)
- [Stripe API Reference](https://stripe.com/docs/api)
- [Full Project Documentation](../../docs/)
- [API Endpoint Reference](../../docs/api/endpoints.md)
- [Deployment Guide](../../docs/deployment/environments.md)
- [GitHub Secrets Setup](../../docs/deployment/github-secrets.md)

---

## 🤝 Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for development guidelines.

---

**Maintainer:** albertodimasmorazaldivar@gmail.com
**License:** MIT
**Last Updated:** September 30, 2025
