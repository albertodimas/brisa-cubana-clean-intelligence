# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Brisa Cubana Clean Intelligence** is a monorepo-based cleaning service management platform with:

- **API Backend** (`apps/api`): Hono REST API with Prisma ORM, PostgreSQL, Stripe payments, Resend emails, Twilio SMS
- **Web Frontend** (`apps/web`): Next.js 15 App Router with NextAuth authentication
- **UI Package** (`packages/ui`): Shared React component design system
- **Documentation** (`docs/`): MkDocs Material documentation site

## Essential Commands

### Development Workflow

```bash
# First-time setup
pnpm install
docker compose up -d
pnpm --filter=@brisa/api db:generate
pnpm --filter=@brisa/api db:push
pnpm --filter=@brisa/api db:seed

# Start development (all services)
pnpm dev                    # Runs both API (3001) and Web (3000)

# Individual services
pnpm dev:api                # API only on port 3001
pnpm dev:web                # Web only on port 3000

# Database management
pnpm --filter=@brisa/api db:generate    # Generate Prisma Client
pnpm --filter=@brisa/api db:push        # Push schema changes
pnpm --filter=@brisa/api db:migrate     # Create migration
pnpm --filter=@brisa/api db:studio      # Open Prisma Studio (port 5555)
pnpm --filter=@brisa/api db:seed        # Seed database
```

### Testing

```bash
# Run all tests
pnpm test

# API tests
pnpm --filter=@brisa/api test               # Unit tests
pnpm --filter=@brisa/api test -- --watch    # Watch mode
pnpm test:coverage                          # Coverage report

# E2E tests (Playwright)
pnpm test:e2e                               # Full E2E suite
pnpm playwright test --ui                   # Debug mode
```

### Quality Checks

```bash
# Lint (TS + Markdown + Spelling)
pnpm lint

# Type checking
pnpm typecheck

# Format code
pnpm format

# Pre-push validation (runs all checks)
./scripts/pre-push-check.sh
```

### Build & Deploy

```bash
# Build all packages
pnpm build

# Deploy to production (via CI/CD)
git push origin main                        # Triggers deploy-production.yml
```

## Architecture & Key Patterns

### Monorepo Structure

```
apps/
  api/              # Hono backend (Node.js/Bun)
    src/
      routes/       # REST endpoints (auth, bookings, properties, etc.)
      middleware/   # Auth, rate-limit, error handling
      lib/          # Utilities (db, logger, token, email, sms)
      schemas.ts    # Zod validation schemas
    prisma/
      schema.prisma # Database schema
      seed.ts       # Initial data

  web/              # Next.js frontend
    src/
      app/          # App Router pages
      server/       # Server actions
      components/   # UI components
    e2e/            # Playwright tests

packages/
  ui/               # Shared design system
```

### Authentication Flow

1. User submits credentials to Next.js `/auth/signin`
2. NextAuth Credentials provider calls API `POST /api/auth/login`
3. API validates with bcrypt, returns JWT (signed with `JWT_SECRET`, 8h expiry)
4. NextAuth stores JWT in session as `session.user.accessToken`
5. Protected API routes validate JWT via `requireAuth()` middleware

**Test Credentials** (from seed):

- Admin: `admin@brisacubanaclean.com` / `Admin123!`
- Staff: `staff@brisacubanaclean.com` / `Staff123!`
- Client: `client@brisacubanaclean.com` / `Client123!`

### API Patterns

**Route Structure**: All API routes in `apps/api/src/routes/`

- `auth.ts` - Login/signup
- `bookings.ts` - Booking management
- `properties.ts` - Property CRUD
- `services.ts` - Service catalog
- `payments.ts` - Stripe integration
- `users.ts` - User management
- `alerts.ts` - Alert system
- `metrics.ts` - Prometheus metrics

**Validation**: All endpoints use Zod schemas from `apps/api/src/schemas.ts`

**Authorization**:

- `requireAuth()` - JWT validation
- `requireRole(['ADMIN', 'STAFF'])` - Role-based access
- Ownership checks in route handlers

**Error Handling**: Standardized JSON responses with proper HTTP status codes

### Database Schema (Prisma)

**Core Models**:

- `User` - Users with role-based access (CLIENT, STAFF, ADMIN)
- `Property` - Properties (APARTMENT, HOUSE, OFFICE, etc.)
- `Service` - Cleaning services catalog
- `Booking` - Reservations with status tracking
- `ReconciliationNote` - Payment reconciliation
- `Alert` - System alerts
- `Conversation` - AI Concierge conversations
- `CleanScoreReport` - AI cleaning quality scores

**Key Relationships**:

- User → Properties (one-to-many)
- User → Bookings (one-to-many)
- Booking → Property (many-to-one)
- Booking → Service (many-to-one)

### Environment Variables Strategy

**Three-tier configuration**:

1. **Root `.env`** (monorepo-wide):
   - `DATABASE_URL` - PostgreSQL connection
   - `REDIS_URL` - Redis connection
   - Feature flags (`ENABLE_*`)

2. **`apps/api/.env`** (backend-specific):
   - `JWT_SECRET` - Token signing (generate: `openssl rand -hex 64`)
   - `API_PORT` - Default 3001
   - `WEB_APP_URL` - Frontend URL for redirects
   - `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
   - `RESEND_API_KEY` - Email service
   - `TWILIO_*` - SMS credentials
   - `ALERTS_SLACK_WEBHOOK` - Slack notifications

3. **`apps/web/.env.local`** (frontend-specific):
   - `NEXTAUTH_SECRET` - Session signing (generate: `openssl rand -base64 32`)
   - `NEXTAUTH_URL` - Callback URL
   - `NEXT_PUBLIC_API_URL` - API endpoint

### Stripe Integration

**Webhook Testing**:

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Forward webhooks to local API
pnpm stripe:listen                      # Wrapper for stripe listen

# Trigger test events
pnpm stripe:trigger checkout.session.completed

# Manual reconciliation
pnpm --filter=@brisa/api payments:reconcile
```

**Webhook Flow**:

1. Stripe sends event to `/api/payments/webhook`
2. Signature verified with `STRIPE_WEBHOOK_SECRET`
3. `checkout.session.completed` updates booking status
4. Errors logged and sent to Slack webhook

## Development Guidelines

### Adding a New API Endpoint

1. Define Zod schema in `apps/api/src/schemas.ts`:

   ```typescript
   export const createItemSchema = z.object({
     name: z.string(),
     description: z.string().optional(),
   });
   ```

2. Create route file `apps/api/src/routes/items.ts`:

   ```typescript
   import { Hono } from "hono";
   import { requireAuth } from "../middleware/auth";
   import { createItemSchema } from "../schemas";

   const items = new Hono();

   items.post("/", requireAuth(), async (c) => {
     const json = await c.req.json();
     const result = createItemSchema.safeParse(json);
     // ... handle validation and business logic
   });
   ```

3. Register in `apps/api/src/server.ts`:

   ```typescript
   import items from "./routes/items";
   app.route("/api/items", items);
   ```

4. Add tests in `apps/api/src/routes/items.test.ts`:

   ```typescript
   import { describe, it, expect } from "vitest";
   import { generateAccessToken } from "../lib/token";

   describe("POST /api/items", () => {
     it("should create item with valid token", async () => {
       // Test implementation
     });
   });
   ```

### Database Schema Changes

```bash
# 1. Modify apps/api/prisma/schema.prisma
# 2. Generate Prisma Client
pnpm --filter=@brisa/api db:generate

# 3. For development (no migration files)
pnpm --filter=@brisa/api db:push

# 4. For production (creates migration)
pnpm --filter=@brisa/api db:migrate

# 5. Update seed data if needed
# Edit apps/api/prisma/seed.ts
pnpm --filter=@brisa/api db:seed
```

### Adding E2E Tests (Playwright)

Create test file in `apps/web/e2e/`:

```typescript
import { test, expect } from "@playwright/test";

test("user can create booking", async ({ page }) => {
  await page.goto("http://localhost:3000");
  await page.click("text=Sign In");
  await page.fill('input[name="email"]', "client@brisacubanaclean.com");
  await page.fill('input[name="password"]', "Client123!");
  await page.click('button[type="submit"]');

  await page.waitForURL("**/dashboard");
  // ... rest of test
});
```

Run: `pnpm test:e2e`

## CI/CD Pipeline

**GitHub Actions** (`.github/workflows/deploy-production.yml`):

1. **Lint & Test** job:
   - ESLint, TypeScript check, Markdown lint, spell check
   - Unit tests with coverage
   - Web app build

2. **Deploy API** job (Railway):
   - Requires `RAILWAY_PRODUCTION_TOKEN` secret
   - Uses Dockerfile build
   - Health check on `/healthz`

3. **Deploy Web** job (Vercel):
   - Requires `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`
   - Builds with production env vars

**Slack Notifications**: Success/failure alerts via `SLACK_WEBHOOK_URL`

## Local Services (Docker Compose)

```bash
docker compose up -d        # Start all services
docker compose ps           # Check status
docker compose logs -f      # View logs
docker compose down         # Stop services
docker compose down -v      # Stop and remove volumes (⚠️ deletes data)
```

**Services**:

- PostgreSQL 17: `localhost:5433` (container: 5432)
- Redis 8: `localhost:6380` (container: 6379)
- MailHog: `localhost:8026` (email testing UI)

## Documentation

```bash
# Serve MkDocs locally
make serve                  # http://localhost:8000

# Or with Python venv
make setup                  # First time only
source .venv/bin/activate
mkdocs serve

# Generate TypeDoc + Storybook
pnpm docs:build:artifacts
```

## Troubleshooting

### "Cannot find module '@prisma/client'"

```bash
pnpm --filter=@brisa/api db:generate
```

### "Connection refused" to PostgreSQL

```bash
docker compose down
docker compose up -d
sleep 5
pnpm --filter=@brisa/api db:push
```

### Port already in use (3000/3001)

```bash
lsof -i :3000
lsof -i :3001
kill -9 <PID>
```

### Clean reinstall

```bash
rm -rf node_modules apps/*/node_modules packages/*/node_modules
rm pnpm-lock.yaml
pnpm install
pnpm --filter=@brisa/api db:generate
```

## Key Technical Decisions

- **Monorepo**: Turborepo + pnpm workspaces for code sharing
- **Database**: Prisma with PostgreSQL for type-safe queries
- **Authentication**: JWT tokens (8h expiry) managed by NextAuth
- **Validation**: Zod schemas shared between frontend/backend
- **Testing**: Vitest (unit) + Playwright (E2E)
- **Deployment**: Railway (API) + Vercel (Web)
- **Observability**: Pino logging, Prometheus metrics, Sentry errors

## Commit Convention

Use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `test:` - Tests
- `refactor:` - Code refactoring
- `chore:` - Dependencies, tooling

Examples:

```bash
git commit -m "feat(api): add rate limiting middleware"
git commit -m "fix(web): resolve dashboard loading issue"
git commit -m "docs(setup): update Node version requirements"
```

---

## Session Context & Memory (Updated: 2025-10-01)

### Latest Audit Results (October 1, 2025)

**Overall Score: 8.5/10** (Excellent)

#### ✅ Strengths

- **166 unit tests** passing (17 test files, ~7s execution)
- **Modern architecture**: Monorepo with Turborepo + pnpm
- **Robust security**: JWT (8h), bcrypt (12 rounds), RBAC, rate limiting
- **Well-designed database**: 16 optimized indexes, 9 Prisma models
- **Updated stack**: Node 24, Next.js 15.5.4, React 19, Prisma 6.16
- **Comprehensive docs**: 1,130+ lines in README, complete guides
- **Enterprise observability**: Pino logging, Prometheus metrics, Sentry
- **End-to-end TypeScript** with strict mode

#### 🔴 Critical Issues

1. **MISSING CI/CD Pipeline** (Priority: URGENT)
   - `.github/workflows/` directory does NOT exist in repo
   - Documented workflows not implemented
   - Manual deployments without automated testing
   - **Impact:** High risk of deploying untested code
   - **Action Required:** Create CI/CD workflows immediately

2. **Missing `vercel.json`**
   - No Vercel configuration file
   - Frontend deployment not automated
   - **Action Required:** Create Vercel config

#### 🟡 High Priority Issues

1. **Rate Limiting in Production**
   - Current: In-memory store (lost on restart)
   - **Needed:** Migrate to Redis for multi-instance deployments
   - **Impact:** Memory leaks, rate limit bypass on restart

2. **Limited E2E Tests**
   - Current: Only 3 Playwright specs
   - **Needed:** Expand to 10+ critical flow specs
   - **Impact:** UI regressions not caught

3. **CORS Wildcard**
   - Current: `CORS_ORIGIN` allows `*` in production
   - **Needed:** Specify exact domain
   - **Impact:** Security risk (low)

#### 🟢 Medium Priority Issues

1. **API Versioning**
   - Current: No version prefix (`/api/bookings`)
   - **Needed:** Implement `/api/v1/*`
   - **Impact:** Difficult to introduce breaking changes

2. **OpenAPI Documentation**
   - Current: No auto-generated API docs
   - **Needed:** Integrate `@hono/zod-openapi`
   - **Impact:** Manual API documentation

3. **Content Security Policy**
   - Current: No CSP headers
   - **Needed:** Configure CSP in Next.js
   - **Impact:** Increased XSS risk

4. **Soft Deletes**
   - Current: Hard deletes in database
   - **Needed:** Add `deletedAt` field to critical models
   - **Impact:** Cannot recover accidentally deleted data

### 30-Day Roadmap

**Week 1: CI/CD (CRITICAL)**

- [ ] Create `.github/workflows/ci.yml`
- [ ] Create `.github/workflows/deploy-production.yml`
- [ ] Create `vercel.json`
- [ ] Configure GitHub secrets
- [ ] Setup Husky pre-commit hooks

**Week 2: Testing**

- [ ] Expand Playwright tests (3 → 10+ specs)
- [ ] Add visual regression tests
- [ ] Configure CI to run E2E tests

**Week 3: Security & Performance**

- [ ] Migrate rate limiting to Redis
- [ ] Implement CSP headers
- [ ] Fix CORS wildcard
- [ ] Add database connection pooling

**Week 4: Documentation & Quality**

- [ ] Integrate `@hono/zod-openapi` for Swagger
- [ ] Add C4 architecture diagrams
- [ ] Implement API versioning (`/api/v1/*`)
- [ ] Configure Dependabot

### Code Quality Metrics

| Metric               | Value          | Status       |
| -------------------- | -------------- | ------------ |
| Total LOC (API)      | 7,824 lines TS | ✅ Healthy   |
| Test files           | 17 files       | ✅ Excellent |
| Total tests          | 166 tests      | ✅ Excellent |
| Coverage (estimated) | ~85%+          | ✅ Very good |
| Project size         | 23 MB          | ✅ Optimal   |
| Dependencies         | Up to date     | ✅ Current   |

### Detailed Scores by Category

| Category      | Score    | Status          |
| ------------- | -------- | --------------- |
| Architecture  | 9/10     | ✅ Excellent    |
| Backend       | 9/10     | ✅ Excellent    |
| Frontend      | 8/10     | ✅ Very good    |
| Database      | 9/10     | ✅ Excellent    |
| Testing       | 9/10     | ✅ Excellent    |
| Security      | 8/10     | ✅ Very good    |
| Documentation | 9/10     | ✅ Excellent    |
| **CI/CD**     | **3/10** | 🔴 **Critical** |
| Performance   | 8/10     | ✅ Very good    |

### Professional Guidelines

**✅ DO:**

- Implement functional code (workflows, configs, features)
- Update existing docs when functionality changes
- Follow project conventions (Conventional Commits, TypeScript strict)
- Create necessary technical files (workflows, configs)
- Maintain code quality standards

**❌ DON'T:**

- Create unnecessary or duplicate documentation
- Add files that don't follow conventions
- Create folders/files without clear purpose
- Write documentation that doesn't add technical value
- Generate boilerplate without purpose

### Key Files Created This Session

1. **AUDIT_REPORT.md** (Oct 1, 2025)
   - Comprehensive 14-section analysis
   - Prioritized findings and recommendations
   - 30-day implementation roadmap
   - Code examples and references

2. **CLAUDE.md** (Updated Oct 1, 2025)
   - Development guide for AI assistants
   - Essential commands and patterns
   - Architecture overview
   - Session context (this section)

### Next Session Priorities

Based on audit findings, recommended order:

1. **URGENT:** Create CI/CD pipeline (`.github/workflows/`)
2. **URGENT:** Create `vercel.json` for automated frontend deployment
3. **HIGH:** Migrate rate limiting to Redis
4. **HIGH:** Expand E2E test coverage
5. **MEDIUM:** Implement API versioning

### Repository Status

- **GitHub:** https://github.com/albertodimas/brisa-cubana-clean-intelligence
- **Created:** September 29, 2025
- **Last Push:** October 1, 2025
- **Branch:** main
- **Modified Files:** 34 (uncommitted changes)
- **Untracked Files:** 3 (`docs/development/documentation-standards.md`, `AUDIT_REPORT.md`, `CLAUDE.md`)

### Important Context for Future Sessions

- Project is in **active development** (2 days old)
- **No production deployment yet** (CI/CD missing)
- Test suite is **comprehensive and passing** (166/166 ✅)
- Architecture is **solid and scalable**
- Main blocker: **CI/CD automation** must be implemented before production
- **Do not create** extra documentation files beyond what's necessary
- **Focus on** functional implementation, not documentation

---

**Last Updated:** October 2, 2025 09:00 UTC
**Audited By:** Claude (Anthropic)
**Next Review:** After CI/CD implementation

---

## 🧪 Fake API Data Mode (E2E Testing)

### Overview

The project implements a **fake API data mode** that allows running the Next.js application and E2E tests **without requiring a real API backend or database**. This enables:

- ✅ Fast E2E testing in CI/CD without database setup
- ✅ Isolated frontend development
- ✅ Deployments to staging environments without backend dependencies
- ✅ Demo environments with consistent test data

### Activation

Set these environment variables to enable fake data mode:

```bash
export DYLD_USE_FAKE_API_DATA=1
export USE_FAKE_API_DATA=1
export NEXT_PUBLIC_USE_FAKE_API_DATA=1
```

### How It Works

#### 1. Authentication (`apps/web/src/server/auth/config.ts`)

The NextAuth `authorize` callback checks `isFakeDataEnabled()` and uses in-memory fake users:

```typescript
if (isFakeDataEnabled()) {
  const user = findFakeUser(email, password);
  // Returns fake user with JWT-like token
}
```

**Fake Users** (defined in `apps/web/src/server/utils/fake.ts`):

- `admin@brisacubanaclean.com` / `Admin123!` (ADMIN role)
- `staff@brisacubanaclean.com` / `Staff123!` (STAFF role)
- `client@brisacubanaclean.com` / `Client123!` (CLIENT role)

#### 2. Dashboard Data (`apps/web/src/server/api/client.ts`)

The `getDashboardData` function checks fake mode and returns static data:

```typescript
if (isFakeDataEnabled()) {
  return buildFakeDashboardData({
    userId,
    userRole,
    canManageBookings,
    includeAlerts: true,
  });
}
```

Fake data includes:

- 3 services (Limpieza Básica, Limpieza Profunda, Turnover Vacation Rental)
- 1 property (Brickell Luxury Apartment)
- 3 bookings (CONFIRMED, IN_PROGRESS, PENDING)
- Payment alerts (1 FAILED payment for admin/staff)
- Payment and booking metrics

#### 3. Bookings Page (`apps/web/src/app/dashboard/bookings/page.tsx`)

Returns 2 fake bookings when `isFakeDataEnabled()` is true:

```typescript
if (isFakeDataEnabled()) {
  return [
    { id: "fake-booking-1", status: "CONFIRMED", ... },
    { id: "fake-booking-2", status: "PENDING", ... }
  ];
}
```

#### 4. Client Components (`apps/web/src/app/dashboard/manage-bookings.tsx`)

The `useSession()` hook was fixed to handle undefined data during SSR:

```typescript
const sessionResult = useSession();
const session = sessionResult?.data; // Safe destructuring
```

### E2E Test Configuration

#### playwright.config.ts

```typescript
process.env.USE_FAKE_API_DATA ??= "1";
process.env.NEXT_PUBLIC_USE_FAKE_API_DATA ??= "1";
process.env.DYLD_USE_FAKE_API_DATA ??= "1";

webServer: {
  env: {
    USE_FAKE_API_DATA: "1",
    DYLD_USE_FAKE_API_DATA: "1",
    NEXT_PUBLIC_USE_FAKE_API_DATA: "1",
  }
}
```

#### package.json test:e2e script

```json
"test:e2e": "DYLD_USE_FAKE_API_DATA=1 USE_FAKE_API_DATA=1 NEXT_PUBLIC_USE_FAKE_API_DATA=1 pnpm --filter=web build && PLAYWRIGHT_HTML_REPORT=./.playwright-report DYLD_USE_FAKE_API_DATA=1 USE_FAKE_API_DATA=1 NEXT_PUBLIC_USE_FAKE_API_DATA=1 pnpm exec playwright test"
```

### Test Results

**Status:** ✅ **15/15 E2E tests passing** (100% success rate)

```
Test Suites:
  ✅ Authentication (4 tests)
     - Sign in page display
     - Successful login redirect
     - Invalid credentials validation
     - Protected route redirect

  ✅ Dashboard (4 tests)
     - Dashboard overview display
     - Navigate to bookings page
     - Navigate to properties page
     - User info display

  ✅ Booking Flow (3 tests)
     - Create property navigation
     - Bookings list page display
     - Create booking navigation

  ✅ Dashboard Alerts (2 tests)
     - Alerts visible for admin/staff
     - Alerts hidden for clients

  ✅ Home Page (2 tests)

Total: 15 passed in ~5s
```

### Files Modified

1. `apps/web/src/server/utils/fake.ts` - Fake data utilities and user database
2. `apps/web/src/server/auth/config.ts` - NextAuth with fake authentication
3. `apps/web/src/server/api/client.ts` - Dashboard API with fake mode
4. `apps/web/src/server/api/fake-dashboard.ts` - Fake dashboard data builder
5. `apps/web/src/app/dashboard/page.tsx` - Dashboard page with fake mode
6. `apps/web/src/app/dashboard/bookings/page.tsx` - Bookings page with fake data
7. `apps/web/src/app/dashboard/manage-bookings.tsx` - Fixed useSession destructuring
8. `apps/web/e2e/dashboard.spec.ts` - Updated test selectors
9. `playwright.config.ts` - Environment variables injection
10. `package.json` - test:e2e script with env vars

### Docker/Railway Deployment with Fake Mode

To deploy the app in fake mode (no backend required):

```bash
# Dockerfile or deployment config
ENV DYLD_USE_FAKE_API_DATA=1
ENV USE_FAKE_API_DATA=1
ENV NEXT_PUBLIC_USE_FAKE_API_DATA=1

# Railway environment variables
DYLD_USE_FAKE_API_DATA=1
USE_FAKE_API_DATA=1
NEXT_PUBLIC_USE_FAKE_API_DATA=1
```

This enables:

- Demo deployments on Vercel/Railway without API
- QA environment for frontend-only testing
- Quick previews for stakeholders

### Limitations

**Fake mode does NOT support:**

- Creating new bookings (submit returns success but doesn't persist)
- Updating booking status (returns success but no-op)
- Real payment processing (Stripe calls are mocked)
- Data persistence across page refreshes (uses static data)
- File uploads or real-time features

**Use real API for:**

- Production deployments
- Integration testing with real database
- Load/performance testing
- Payment processing validation

### Troubleshooting

**Issue:** Tests fail with CredentialsSignin
**Solution:** Ensure all 3 env vars are set in both build and runtime

**Issue:** Dashboard shows "Application error"
**Solution:** Check that `useSession()` is not destructured directly (use `sessionResult?.data`)

**Issue:** No bookings displayed in fake mode
**Solution:** Verify `isFakeDataEnabled()` returns true in server logs

---

**Última Auditoría:** Oct 2, 2025 - Grado A- (89/100) ✅ Listo Producción

- 152 tests unitarios + 15 E2E (100% éxito)
- 10 modelos Prisma, 30 índices
- CI/CD completo (6 workflows)
- Stack moderno verificado
- 1 error ESLint corregido (token.ts)
- Issue menor: 5 errores ortográficos en docs
