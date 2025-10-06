# Arquitectura - Brisa Cubana Clean Intelligence

## Overview

Brisa Cubana es una plataforma integral de limpieza inteligente construida como un **monorepo moderno** con arquitectura event-driven y diseño modular para escalabilidad horizontal.

## Principios de Diseño

### 1. Event-Driven Architecture

- **Event Mesh**: Redpanda/Kafka/NATS para mensajería asíncrona (en roadmap)
- **Workflows orquestados**: Temporal para procesos de larga duración
- **Reactividad**: Actualizaciones en tiempo real via WebSockets/SSE

### 2. Serverless & Edge-First

- **Edge computing**: Cloudflare Workers para latencia ultra-baja
- **Serverless functions**: Deploy en Vercel/AWS Lambda
- **Auto-scaling**: Escala automática basada en demanda

### 3. Security Zero-Trust

- **Authentication**: WebAuthn/Passkeys + JWT firmado
- **Authorization**: RBAC con roles granulares (CLIENT, STAFF, ADMIN)
- **Secrets management**: Variables de entorno + Vault (futuro)
- **API security**: Rate limiting, CORS, input sanitization

### 4. Observability by Design

- **Tracing**: OpenTelemetry para distributed tracing (roadmap)
- **Logging**: Pino estructurado con contexto (requestId, userId)
- **Monitoring**: Sentry para errores + métricas custom
- **Alerting**: Slack webhooks para alertas críticas

## Stack Tecnológico (Septiembre 2025)

### Frontend

```
Next.js 15.5.4 (App Router + Turbopack)
├── React 19.1.1
├── Tailwind CSS 4.1.13
├── Framer Motion 12 (animaciones)
├── Lucide React (iconos)
└── Auth.js v5 (NextAuth)
```

### Backend API

```
Hono 4.9.9 (Node.js 24.9.0)
├── Prisma 6.16.2 (ORM)
├── Zod 3.23.8 (validación)
├── bcryptjs 2.4.3 (hashing)
├── jsonwebtoken 9.0.2 (JWT)
└── Stripe SDK (payments)
```

### Database

```
PostgreSQL 17 (Docker Compose)
└── Redis 8 (cache - roadmap)
```

### Testing & QA

```
Vitest 3.2.4 (unit/integration)
├── Testing Library (React)
├── Playwright 1.55.1 (E2E)
└── c8 (coverage >70%)
```

### DevOps & Infrastructure

```
pnpm 10.17.1 + Turborepo 2.5.8
├── Docker Compose (dev)
├── GitHub Actions (CI/CD)
├── ESLint + Prettier + Husky
└── Vercel (deployment)
```

## Arquitectura de Alto Nivel

```
┌─────────────────────────────────────────────────────────────┐
│                      Edge Layer (Future)                     │
│              Cloudflare Workers / Edge Functions             │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                       Frontend Layer                         │
│  Next.js 15 App (SSR + Client Components)                   │
│  ├── Public Landing                                          │
│  ├── Auth Flow (NextAuth v5)                                │
│  └── Dashboard (Client/Staff/Admin)                         │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                        API Gateway                           │
│               Hono REST API (@brisa/api)                     │
│  ├── /api/auth (login, register)                            │
│  ├── /api/bookings (CRUD)                                   │
│  ├── /api/services (catalog)                                │
│  ├── /api/users (management)                                │
│  ├── /api/payments (Stripe integration)                     │
│  └── /api/alerts (Slack notifications)                      │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                      Business Logic                          │
│  ├── Authentication & Authorization (JWT + RBAC)            │
│  ├── Booking Management (create, update, assign)            │
│  ├── Payment Processing (Stripe Checkout + Webhooks)        │
│  ├── Notifications (Slack, Email via Resend)                │
│  └── Reconciliation (payment sync)                          │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                       Data Layer                             │
│  ├── PostgreSQL 17 (transaccional)                          │
│  │   └── Prisma ORM (type-safe queries)                     │
│  └── Redis 8 (cache - roadmap)                              │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    External Services                         │
│  ├── Stripe (payments)                                      │
│  ├── Resend (transactional email)                           │
│  ├── Slack (alerts)                                         │
│  ├── Sentry (error tracking)                                │
│  └── OpenAI/Anthropic (AI features - roadmap)               │
└─────────────────────────────────────────────────────────────┘
```

## Estructura del Monorepo

```
brisa-cubana-clean-intelligence/
├── apps/
│   ├── api/                    # Backend Hono + Prisma
│   │   ├── src/
│   │   │   ├── routes/         # API endpoints
│   │   │   ├── middleware/     # Auth, rate-limit, CSP nonce
│   │   │   ├── lib/            # Utilities (db, token, password, CORS)
│   │   │   ├── schemas.ts      # Zod validation schemas
│   │   │   └── generated/      # Prisma client
│   │   ├── prisma/
│   │   │   ├── schema.prisma   # Database schema
│   │   │   └── seed.ts         # Initial data
│   │   └── vitest.config.ts    # Test config
│   │
│   └── web/                    # Frontend Next.js
│       ├── src/
│       │   ├── app/            # App Router pages
│       │   │   ├── auth/       # Sign in/up
│       │   │   └── dashboard/  # Protected area
│       │   ├── components/     # React components
│       │   ├── server/         # Server actions, API clients, security helpers
│       │   └── types/          # TypeScript definitions
│       └── middleware.ts       # Auth + CSP nonce middleware
│
├── packages/
│   └── ui/                     # Shared design system
│       ├── src/
│       │   ├── button.tsx
│       │   ├── card.tsx
│       │   └── index.ts
│       └── package.json
│
├── docs/                       # MkDocs documentation
│   ├── for-developers/         # Guías técnicas, arquitectura, quickstart
│   ├── for-business/           # Visión, mercado, SOPs y decisiones
│   ├── operations/             # Runbooks y playbooks de despliegue
│   └── reference/              # Plantillas, fuentes y recursos
│
├── .github/
│   └── workflows/
│       ├── ci.yml              # Lint, test, build
│       ├── documentation.yml   # Docs build
│       └── payments-reconcile.yml
│
└── scripts/                    # Automation scripts
```

## Flujos Clave

### 1. Autenticación

```
Usuario → /auth/signin
  ↓
NextAuth v5 (Credentials)
  ↓
Verify con API → /api/auth/login
  ↓
API valida (bcrypt) → genera JWT
  ↓
NextAuth recibe JWT → crea session
  ↓
Cookie HttpOnly 'brisa_session'
  ↓
Redirect a /dashboard
```

### 2. Crear Booking

```
Dashboard → Formulario
  ↓
POST /api/bookings (con JWT)
  ↓
Validate con Zod schema
  ↓
Verify user owns property (RBAC)
  ↓
Create booking en DB (Prisma)
  ↓
If payments enabled:
  ↓
  Create Stripe Checkout session
  ↓
  Update booking con checkoutSessionId
  ↓
Return { booking, checkoutUrl }
  ↓
Redirect a Stripe Checkout
```

### 3. Stripe Webhook

```
Stripe → POST /api/payments/webhook
  ↓
Verify signature (STRIPE_WEBHOOK_SECRET)
  ↓
Parse event (checkout.session.completed)
  ↓
Extract metadata.bookingId
  ↓
Update booking:
  - paymentStatus: 'PAID'
  - status: 'CONFIRMED'
  ↓
If failed → create alert
  ↓
Return 200 OK
```

## Decisiones Arquitectónicas (ADRs)

Decisiones técnicas documentadas en [for-business/operations/decision-log/decisions.md](../for-business/operations/decision-log/decisions.md):

- **ADR-01**: Bun + Next.js 15 + React 19 (rendimiento y DX)
- **ADR-04**: Event mesh + Temporal (orquestación)
- **ADR-10**: Migración a pnpm + Turborepo (monorepo moderno)
- **ADR-11**: Zod + Husky obligatorio (calidad)
- **ADR-13**: Redis/Temporal en evaluación (no implementado)
- **ADR-14**: MkDocs Material Insiders (docs platform)

## Modelo de Datos

### Entidades Principales

```prisma
model User {
  id           String   @id @default(cuid())
  email        String   @unique
  passwordHash String?
  name         String?
  phone        String?
  role         UserRole @default(CLIENT)
  properties   Property[]
  bookings     Booking[]
}

model Property {
  id       String  @id @default(cuid())
  name     String
  address  String
  city     String?
  state    String?
  zipCode  String?
  type     PropertyType @default(RESIDENTIAL)
  size     Int?
  userId   String
  user     User    @relation(fields: [userId], references: [id])
  bookings Booking[]
}

model Service {
  id          String  @id @default(cuid())
  name        String
  description String?
  basePrice   Decimal
  duration    Int     // minutos
  active      Boolean @default(true)
  bookings    Booking[]
}

model Booking {
  id                  String      @id @default(cuid())
  userId              String
  propertyId          String
  serviceId           String
  scheduledAt         DateTime
  totalPrice          Decimal
  status              BookingStatus @default(PENDING)
  paymentStatus       PaymentStatus @default(PENDING_PAYMENT)
  paymentIntentId     String?
  checkoutSessionId   String?
  notes               String?
  completedAt         DateTime?
  user                User        @relation(...)
  property            Property    @relation(...)
  service             Service     @relation(...)
}
```

## Seguridad

### Autenticación

- **NextAuth v5** con Credentials provider
- JWT firmado con `JWT_SECRET` (8h expiración)
- Cookies HttpOnly con flag `secure` en producción
- Hash de passwords con bcrypt (12 rounds)

### Autorización

- Middleware RBAC en API (`requireAuth(['ADMIN', 'STAFF'])`)
- Validación de ownership (user can only access their own resources)
- Tokens con claims: `{ sub, email, role }`

### API Security

- CORS configurado por entorno
- Input validation con Zod (todos los endpoints)
- SQL injection prevention (Prisma parametrizado)
- XSS protection (sanitización input - futuro)
- Rate limiting (futuro - Hono middleware)

## Observabilidad

### Logging (Actual: console.log)

**Roadmap**: Migrar a Pino estructurado

```typescript
logger.info({ userId, bookingId, requestId }, "Booking created");
logger.error({ err, requestId }, "Payment failed");
```

### Monitoring

- **Sentry**: Error tracking (configurado, no activo)
- **Vercel Analytics**: Web vitals (configurado)
- **Custom metrics**: Dashboard admin (implementado)

### Health Checks

- `/healthz` - Liveness probe (básico)
- **Roadmap**: `/health/readiness` con DB/Redis checks

## Roadmap Arquitectónico

### Q4 2025

- [ ] Rate limiting (Hono middleware)
- [ ] Logger estructurado (Pino)
- [ ] Request ID tracking
- [ ] API versioning (/api/v1)
- [ ] OpenAPI/Swagger docs

### Q1 2026

- [ ] Redis cache layer
- [ ] Event Mesh (Redpanda/NATS)
- [ ] Temporal workflows
- [ ] WebSockets para real-time
- [ ] Mobile app (Expo/React Native)

### Q2 2026

- [ ] AI features (OpenAI integration)
- [ ] CleanScore™ algorithm
- [ ] Digital Twin operativo
- [ ] Advanced analytics dashboard

## Métricas de Calidad

### Cobertura de Tests

- **Target**: >70% (API), >80% (UI)
- **Actual**: Configurado, tests iniciales implementados

### Performance

- **Target**: Core Web Vitals "Good" (LCP <2.5s, FID <100ms, CLS <0.1)
- **Monitoreo**: Vercel Analytics

### Escalabilidad

- **Horizontal**: Stateless API (múltiples instancias)
- **Database**: Connection pooling (Prisma)
- **Cache**: Redis para queries frecuentes (roadmap)

## Referencias

### Documentación Detallada

- [Tech Stack](../for-business/tech-stack.md) - Detalles técnicos
- [Diagramas C4](../for-developers/diagrams/README.md) - Visualizaciones
- [Decision Log](../for-business/operations/decision-log/decisions.md) - ADRs

### Stack Docs

- [Next.js 15](https://nextjs.org/docs)
- [Hono](https://hono.dev/)
- [Prisma](https://www.prisma.io/docs)
- [Turborepo](https://turbo.build/repo/docs)

---

**Última actualización**: 30 de septiembre de 2025
**Versión**: 1.0
**Mantenedores**: Tech Lead - albertodimasmorazaldivar@gmail.com
