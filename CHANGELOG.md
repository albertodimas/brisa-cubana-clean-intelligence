# Changelog

Todos los cambios notables del proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added - 2025-10-02

#### Production-Ready Security & Performance

- **Next.js Security Headers** (`apps/web/next.config.ts`):
  - HSTS (Strict-Transport-Security) with 2-year max-age + preload
  - Content Security Policy (CSP) with strict directives
  - X-Frame-Options: DENY (clickjacking protection)
  - X-Content-Type-Options: nosniff
  - Permissions-Policy for camera/microphone/geolocation
  - Referrer-Policy: strict-origin-when-cross-origin
  - References: [Next.js CSP Docs](https://nextjs.org/docs/pages/guides/content-security-policy), [Arcjet Security Checklist](https://blog.arcjet.com/next-js-security-checklist/)

- **Production CORS Configuration** (`apps/api/src/app.ts`):
  - Explicit origin allowlist (no wildcards in production)
  - Function-based origin validation
  - 24-hour preflight cache (`maxAge: 86400`)
  - References: [Hono CORS Docs](https://hono.dev/docs/middleware/builtin/cors), [StudyRaid CORS Guide](https://app.studyraid.com/en/read/11303/352730/cors-configuration-in-hono)

- **Database Connection Pooling Optimization** (`.env.example`):
  - Prisma 6.16+ connection pool configuration
  - `connection_limit=10` and `pool_timeout=10` parameters documented
  - Production guidance for Railway (long-running) vs Vercel (serverless)
  - References: [Prisma Connection Pool Docs](https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/databases-connections/connection-pool), [Prisma Connection Management](https://www.prisma.io/docs/guides/performance-and-optimization/connection-management)

- **Production Runbook** (`docs/for-developers/production-runbook.md`):
  - Pre-deployment checklist (security, infrastructure, compliance)
  - Environment configuration (Railway API + Vercel Web)
  - Deployment procedures (automated CI/CD + manual emergency)
  - Health checks & monitoring (endpoints, KPIs, dashboards)
  - Incident response playbook (severity levels, on-call procedures)
  - Rollback procedures (Railway, Vercel, Git, Database)
  - Performance optimization (database, API, web)
  - Security hardening checklist

### Changed - 2025-10-02

- **Dependencies Updated**:
  - React: 19.1.1 → 19.2.0
  - @types/react: 19.1.15 → 19.2.0
  - @types/react-dom: 19.1.9 → 19.2.0
  - Prisma: 6.16.2 → 6.16.3
  - @types/node: 24.6.0 → 24.6.2
  - pino: 9.12.0 → 9.13.0
  - puppeteer: 24.22.3 → 24.23.0
  - resend: 6.1.1 → 6.1.2
  - typescript: 5.9.2 → 5.9.3

- **Security**: CORS configuration migrated from static allowlist to function-based validation
- **Performance**: Database URL examples now include connection pooling parameters

### Security - 2025-10-02

- Production-grade HTTP security headers (8 headers) enforced via Next.js config
- CORS restricted to explicit production domains (no wildcards)
- Database connection pooling optimized to prevent exhaustion
- Rate limiting already active (100 req/15min per IP on API routes)

### Deprecated

- `next lint` command (warning shown, will be removed in Next.js 16)
- `@types/bcryptjs@3.0.0` (marked as deprecated by npm)

### Notes - 2025-10-02

**Breaking Changes NOT Applied** (require manual migration):

- `bcryptjs` 2.4.3 → 3.0.2 (ESM module changes)
- `stripe` 17.7.0 → 19.0.0 (API changes, need Stripe changelog review)
- `zod` 3.25.76 → 4.1.11 (major breaking changes, see [Zod v4 Migration Guide](https://zod.dev/v4/changelog))

These updates deferred to avoid production disruption. Current versions are stable and secure.

### Added - 2025-09-30

#### Property Management System

- Complete CRUD for properties with form validation
- Property creation page (`/dashboard/properties/new`)
- Property detail page with booking history (`/dashboard/properties/[id]`)
- Property edit page (`/dashboard/properties/[id]/edit`)
- Support for 4 property types: RESIDENTIAL, VACATION_RENTAL, OFFICE, HOSPITALITY
- Optional fields: size, bedrooms, bathrooms, notes
- Role-based authorization (users see own properties, admins see all)

#### Booking Management System

- Booking creation form with service and property selection (`/dashboard/bookings/new`)
- Booking detail page with full information (`/dashboard/bookings/[id]`)
- Status management workflow for ADMIN/STAFF:
  - PENDING → CONFIRMED → IN_PROGRESS → COMPLETED
  - Cancel option from any status
- Automatic completion date setting when marking as COMPLETED
- Minimum 2-hour advance booking validation
- Dynamic price summary in booking form
- "Nueva Reserva" button added to bookings listing page

#### Revenue Analytics Dashboard

- Admin-only revenue analytics page (`/dashboard/reports/revenue`)
- Key metrics: total revenue, bookings count, average value
- Revenue breakdown by service with count and averages
- Payment status distribution (PENDING_PAYMENT, PAID, FAILED, REFUNDED)
- Recent bookings table (last 10 completed services)
- Date filtering support (from/to query params)
- Localized currency (USD) and date formats (es-ES)

#### Type Safety & Code Quality

- Shared API types file (`apps/web/src/types/api.ts`)
- Complete TypeScript coverage across frontend
- Type definitions for: BookingStatus, PaymentStatus, PropertyType, Service, Property, Booking
- All tests passing (66/66 tests, 100% success rate)
- Zero TypeScript errors
- Zero ESLint errors (9 acceptable warnings in API layer)

#### Documentation

- SESSION_LOG_2025-09-30.md with complete session details
- CONTRIBUTING.md con guías de contribución completas
- CODE_OF_CONDUCT.md basado en Contributor Covenant 2.1
- ARCHITECTURE.md con overview de alto nivel del sistema
- CHANGELOG.md migrado desde docs/changelog/
- Guía de estándares editoriales (`docs/development/documentation-standards.md`) enlazada en MkDocs

### Changed

- Node 20 → 24 en workflow payments-reconcile.yml
- `engines.node` actualizado a `>=24.9.0` en apps/web/package.json
- Variables de entorno: agregado WEB_APP_URL para reemplazar NEXT_PUBLIC_APP_URL en API
- Documentación de estrategia de .env en SETUP.md
- Prisma: propiedades permiten campos opcionales (`size`, `bedrooms`, `bathrooms`, `notes`) y comparten validaciones en `schemas.ts`
- Frontend: tarjetas y formularios de propiedades muestran y persisten notas, metros cuadrados y distribución de habitaciones con tipado consistente
- README, SETUP y QUICKSTART reescritos con instrucciones reales (puertos 3001/5433/6380/8026) y tono profesional
- Portal de documentación actualizado (`docs/index.md`, `mkdocs.yml`) con recuento real y nuevo estándar editorial

### Fixed

- Comentarios TODO obsoletos eliminados en routes/users.ts y routes/services.ts
- Fecha de changelog corregida (2025-10-01 → 2025-09-30)
- Plantillas `.env` y guías corrigieron mapeos reales (PostgreSQL 5433, Redis 6380, API 3001, MailHog 8026)
- Rate limiting asegura todos los verbos en `/api/properties` antes de hits a base de datos

### Removed

- N/A

## [0.1.0] - 2025-09-30

### Added

- Autenticación API reforzada con contraseñas hasheadas (bcrypt 12 rounds)
- JWT firmado con `JWT_SECRET` y middleware RBAC en Hono
- NextAuth v5 con estrategia Credentials + DAL pattern
- Dashboard autenticado con reservas próximas y catálogo de servicios
- Integración completa Stripe Checkout + webhook handling
- Panel staff/admin para gestionar estados de reservas
- Sistema de alertas Slack para pagos fallidos
- Historial de conciliación con notas por staff
- Export CSV desde `/api/audit/export`
- Script `pnpm stripe:listen` para testing local de webhooks
- Métricas y filtros de conciliación en dashboard
- Enlaces directos a Stripe Dashboard desde auditoría
- Workflow automatizado payments-reconcile.yml (cron horario)
- Suites Vitest completas para auth, bookings, payments, services, users
- Cliente server-side centralizado (`apps/web/src/server/api/client.ts`)
- Documentación actualizada con nuevos flujos y secretos

### Changed

- Migración a Next.js 15.5.4 + pnpm 10.17.1 + Turborepo 2.5.8
- React actualizado a 19.1.1
- Prisma actualizado a 6.16.2
- Hono actualizado a 4.9.9
- Stack unificado TypeScript con Turbopack para dev

### Fixed

- Flujo de autenticación NextAuth + API JWT sincronizado
- Validaciones Zod centralizadas en schemas.ts
- Middleware de autenticación consistente en todas las rutas protegidas

### Security

- Passwords hasheados con bcrypt (SALT_ROUNDS=12)
- JWT tokens con expiración de 8 horas
- Cookies HttpOnly 'brisa_session' con flag secure en producción
- Stripe webhook signature verification
- RBAC enforcement en API routes

## [0.0.1] - 2025-09-29

### Added

- Documentación inicial del plan maestro (visión, mercado, arquitectura)
- Secciones enterprise-ready: marketing, QA, riesgos, datos, soporte
- Decision log (ADR-lite) para decisiones técnicas
- Templates operacionales: entrevistas, minutas, ADR, IA evaluation
- Checklists de Sprint 0 y lanzamiento
- SOPs operativos: onboarding, inventario, emergencias, mantenimiento
- Modelo financiero (outline)
- Plan GTM y producto roadmap
- Risk register y support playbook
- Políticas: privacidad (borrador), gobernanza IA
- Model cards para Concierge MVP y CleanScore
- Datos de mercado 2024: turismo, salarios, competencia
- Diagramas C4 (contexto y contenedores)
- Makefi

le para automatización de docs

- Scripts de setup y utilities

### Changed

- Migración a MkDocs Material para documentación
- Estructura de docs organizada por secciones temáticas

## [0.0.0] - 2025-09-28

### Added

- Inicialización del repositorio
- Setup monorepo con pnpm workspaces
- Configuración Docker Compose (PostgreSQL 17, Redis 8, MailHog)
- API base con Hono + Prisma
- Frontend base con Next.js 15
- Package UI con componentes compartidos
- CI/CD inicial con GitHub Actions
- ESLint, Prettier, Husky pre-commit hooks
- Vitest y Playwright configurados
- Primeras seeds de datos (services, demo user)

---

## Guía de Versionado

### Formato: `[MAJOR.MINOR.PATCH]`

- **MAJOR**: Cambios incompatibles en API
- **MINOR**: Nueva funcionalidad compatible hacia atrás
- **PATCH**: Bug fixes compatibles hacia atrás

### Categorías de Cambios

- **Added**: Nuevas features
- **Changed**: Cambios en funcionalidad existente
- **Deprecated**: Features que serán removidas pronto
- **Removed**: Features eliminadas
- **Fixed**: Bug fixes
- **Security**: Cambios relacionados con seguridad

---

**Mantenido por**: Brisa Cubana Team
**Contacto**: albertodimasmorazaldivar@gmail.com
**Última actualización**: 30 de septiembre de 2025
