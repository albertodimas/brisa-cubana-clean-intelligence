# Deployment & Environments

Guía completa para desplegar Brisa Cubana Clean Intelligence en diferentes entornos: desarrollo, staging y producción.

---

## Tabla de Contenidos

- [Overview de Arquitectura](#overview-de-arquitectura)
- [Entornos](#entornos)
- [Variables de Entorno](#variables-de-entorno)
- [Deployment en Vercel (Frontend)](#deployment-en-vercel-frontend)
- [Deployment en Railway/Fly.io (Backend)](#deployment-en-railwayflyio-backend)
- [Base de Datos PostgreSQL](#base-de-datos-postgresql)
- [Stripe Setup](#stripe-setup)
- [Monitoreo y Observabilidad](#monitoreo-y-observabilidad)
- [CI/CD](#cicd)
- [Rollback y Disaster Recovery](#rollback-y-disaster-recovery)

---

## Overview de Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                         PRODUCCIÓN                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────┐      ┌──────────────────┐                │
│  │   Vercel Edge    │      │   Railway/Fly    │                │
│  │   (Frontend)     │◄────►│   (Backend API)  │                │
│  │                  │      │                  │                │
│  │  Next.js 15.5.4  │      │  Hono 4.9.9      │                │
│  │  React 19.1.1    │      │  Node 24.9.0     │                │
│  └──────────────────┘      └──────────────────┘                │
│         │                           │                           │
│         │                           │                           │
│         ▼                           ▼                           │
│  ┌──────────────────┐      ┌──────────────────┐                │
│  │   Vercel KV      │      │  PostgreSQL 17   │                │
│  │   (Sessions)     │      │  (Railway/Neon)  │                │
│  └──────────────────┘      └──────────────────┘                │
│                                     │                           │
│                                     ▼                           │
│                            ┌──────────────────┐                 │
│                            │  Prisma ORM      │                 │
│                            │  (Migrations)    │                 │
│                            └──────────────────┘                 │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              External Services                          │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │  • Stripe (Pagos)                                       │   │
│  │  • Sentry (Error tracking)                              │   │
│  │  • Slack (Alertas)                                      │   │
│  │  • GitHub Actions (CI/CD)                               │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Entornos

### 1. Development (Local)

**Propósito:** Desarrollo activo por ingenieros

**Infraestructura:**

- Frontend: `localhost:3000` (Next.js dev server)
- Backend: `localhost:4000` (Hono via tsx watch)
- Database: PostgreSQL 17 en Docker Compose

**Variables:** Ver [.env.example](../../.env.example)

**Setup:**

```bash
pnpm install
docker compose up -d
cd apps/api && pnpm prisma migrate deploy && pnpm run seed
pnpm dev
```

---

### 2. Staging (Pre-producción)

**Propósito:** Testing de features antes de producción

**Infraestructura:**

- Frontend: Vercel Preview Deployments (auto-deploy en PRs)
- Backend: Railway staging environment
- Database: PostgreSQL en Railway (staging DB)

**Acceso:**

- URL: `https://brisa-cubana-staging.vercel.app`
- API: `https://api-staging.railway.app`

**Características:**

- Auto-deploy en push a `develop` branch
- Stripe en test mode
- Sentry environment: `staging`
- Datos de prueba seeded

---

### 3. Production

**Propósito:** Entorno live para clientes reales

**Infraestructura:**

- Frontend: Vercel Production (US East)
- Backend: Railway/Fly.io (múltiples regiones)
- Database: PostgreSQL en Neon/Railway (con backups automáticos)

**Acceso:**

- URL: `https://brisacubana.com`
- API: `https://api.brisacubana.com`

**Características:**

- Deploy manual o auto-deploy en merge a `main`
- Stripe en live mode
- Backups diarios de DB
- Monitoreo 24/7 con Sentry
- Alertas Slack configuradas

---

## Variables de Entorno

### Frontend (apps/web/.env.local)

```bash
# NextAuth
NEXTAUTH_URL="https://brisacubana.com"
NEXTAUTH_SECRET="clave-super-secreta-64-caracteres-minimo-nextauth-v5"

# API Backend
NEXT_PUBLIC_API_URL="https://api.brisacubana.com"

# Sentry (opcional)
NEXT_PUBLIC_SENTRY_DSN="https://...@sentry.io/..."
SENTRY_AUTH_TOKEN="sntrys_..."

# Analytics (opcional)
NEXT_PUBLIC_POSTHOG_KEY="phc_..."
```

### Backend (apps/api/.env)

```bash
# Database
DATABASE_URL="postgresql://user:pass@host:5432/brisa_cubana_prod"

# JWT
JWT_SECRET="clave-super-secreta-minimo-32-caracteres-jwt-signing"

# Stripe
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_SUCCESS_URL="https://brisacubana.com/dashboard?payment=success"
STRIPE_CANCEL_URL="https://brisacubana.com/dashboard?payment=cancelled"

# URLs de la app
WEB_APP_URL="https://brisacubana.com"

# Alertas Slack
ALERTS_SLACK_WEBHOOK="https://hooks.slack.com/services/..."

# Sentry
SENTRY_DSN="https://...@sentry.io/..."
SENTRY_ENVIRONMENT="production"

# Feature Flags (opcional)
ENABLE_RATE_LIMITING="true"
ENABLE_TELEMETRY="true"
```

### Configuración en Railway

1. Dashboard → Project → Variables
2. Agregar variables una por una o importar desde `.env`
3. Variables sensibles: usar Railway Secrets
4. Redeploy automático al cambiar variables

### Configuración en Vercel

```bash
# CLI
vercel env add DATABASE_URL production
vercel env add NEXTAUTH_SECRET production

# O desde Dashboard
vercel.com → Project → Settings → Environment Variables
```

---

## Deployment en Vercel (Frontend)

### Setup Inicial

1. **Conectar repositorio:**

   ```bash
   vercel login
   vercel link
   ```

2. **Configurar proyecto:**
   - Framework: Next.js
   - Root Directory: `apps/web`
   - Build Command: `pnpm build` (auto-detectado)
   - Output Directory: `.next` (auto-detectado)

3. **Variables de entorno:**
   - Agregar todas las vars de `apps/web/.env.example`
   - Usar diferentes valores para production/preview/development

### Deployment Automático

```yaml
# .github/workflows/deploy-frontend.yml
name: Deploy Frontend

on:
  push:
    branches: [main]
    paths:
      - "apps/web/**"
      - "packages/**"

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: vercel/actions@v1
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: "--prod"
```

### Preview Deployments

Vercel automáticamente crea preview deployments en cada PR:

```bash
# Cada push a PR genera una URL única
https://brisa-cubana-git-feature-branch.vercel.app
```

### Build Optimization

```typescript
// apps/web/next.config.ts
const config: NextConfig = {
  // Optimizaciones de producción
  swcMinify: true,
  compress: true,

  // Bundle analyzer (opcional)
  // webpack: (config, { isServer }) => {
  //   if (!isServer) {
  //     config.plugins.push(new BundleAnalyzerPlugin());
  //   }
  //   return config;
  // },

  // Edge config
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
};
```

### Rollback

```bash
# Via CLI
vercel rollback

# O desde Dashboard
vercel.com → Deployments → [Deployment] → Promote to Production
```

---

## Deployment en Railway/Fly.io (Backend)

### Opción A: Railway

#### Setup Inicial

1. **Crear proyecto:**

   ```bash
   railway login
   railway init
   railway link
   ```

2. **Agregar servicio:**
   - New Service → GitHub Repo
   - Root Directory: `apps/api`
   - Start Command: `node dist/server.js`
   - Watch Paths: `apps/api/**`

3. **Variables de entorno:**
   - Agregar todas las vars de `apps/api/.env.example`

4. **Deploy:**
   ```bash
   railway up
   ```

#### Configuración Dockerfile

```dockerfile
# apps/api/Dockerfile
FROM node:24-alpine AS base

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.17.1 --activate

WORKDIR /app

# Copy workspace files
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json apps/api/
COPY packages/ packages/

# Install dependencies
RUN pnpm install --frozen-lockfile --prod

# Copy source and build
COPY apps/api/prisma apps/api/prisma/
COPY apps/api/src apps/api/src/
COPY apps/api/tsconfig.json apps/api/

RUN cd apps/api && pnpm prisma generate && pnpm build

# Production image
FROM node:24-alpine

WORKDIR /app

COPY --from=base /app/apps/api/dist ./dist
COPY --from=base /app/apps/api/node_modules ./node_modules
COPY --from=base /app/apps/api/prisma ./prisma

ENV NODE_ENV=production
ENV PORT=4000

EXPOSE 4000

CMD ["node", "dist/server.js"]
```

#### Health Checks

Railway automáticamente configura health checks:

```typescript
// apps/api/src/app.ts
app.get("/health", (c) => {
  return c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version ?? "1.0.0",
  });
});
```

---

### Opción B: Fly.io

#### Setup Inicial

```bash
fly auth login
fly launch --name brisa-cubana-api --region mia
```

#### fly.toml

```toml
app = "brisa-cubana-api"
primary_region = "mia"

[build]
  dockerfile = "apps/api/Dockerfile"

[env]
  PORT = "8080"
  NODE_ENV = "production"

[http_service]
  internal_port = 8080
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 1
  processes = ["app"]

[[services]]
  protocol = "tcp"
  internal_port = 8080

  [[services.ports]]
    port = 80
    handlers = ["http"]

  [[services.ports]]
    port = 443
    handlers = ["tls", "http"]

  [services.concurrency]
    type = "connections"
    hard_limit = 250
    soft_limit = 200

[[services.http_checks]]
  interval = "10s"
  timeout = "2s"
  grace_period = "5s"
  method = "GET"
  path = "/health"

[deploy]
  release_command = "npx prisma migrate deploy"
```

#### Deploy

```bash
fly deploy
fly secrets set DATABASE_URL="postgresql://..."
fly secrets set JWT_SECRET="..."
fly secrets set STRIPE_SECRET_KEY="sk_live_..."
```

---

## Base de Datos PostgreSQL

### Opción A: Railway PostgreSQL

**Ventajas:**

- Auto-provisioning
- Backups automáticos
- Escalado vertical fácil
- Integración nativa

**Setup:**

```bash
railway add -s postgres
railway env
# Copiar DATABASE_URL y agregarlo a las variables del API service
```

**Backups:**

```bash
# Automático: Railway hace backups diarios
# Manual:
railway run pg_dump $DATABASE_URL > backup.sql
```

---

### Opción B: Neon (Serverless PostgreSQL)

**Ventajas:**

- Serverless (paga por uso)
- Branching de bases de datos
- Auto-scaling
- Excelente para staging/preview

**Setup:**

1. Crear cuenta en [neon.tech](https://neon.tech)
2. New Project → Miami region
3. Copiar connection string
4. Agregar a Vercel/Railway como `DATABASE_URL`

**Branching:**

```bash
# Crear branch de DB para cada PR
neon branches create --name "pr-123" --parent main
```

---

### Migraciones en Producción

```bash
# Desde local (con DATABASE_URL de producción)
cd apps/api
export DATABASE_URL="postgresql://prod-url"
pnpm prisma migrate deploy

# O configurar release command en Railway/Fly
# Railway: Settings → Deploy → Custom Start Command
npx prisma migrate deploy && node dist/server.js
```

**⚠️ Precauciones:**

- Siempre hacer backup antes de migrar
- Probar migraciones en staging primero
- No hacer drop columns sin migration plan
- Usar `prisma migrate diff` para review

---

## Stripe Setup

### Development

```bash
# Instalar Stripe CLI
brew install stripe/stripe-cli/stripe
stripe login

# Forward webhooks a localhost
stripe listen --forward-to localhost:4000/api/payments/webhook

# Copiar webhook secret que imprime
whsec_...
```

### Production

1. **Dashboard de Stripe:**
   - Developers → Webhooks → Add endpoint
   - URL: `https://api.brisacubana.com/api/payments/webhook`
   - Events:
     - `checkout.session.completed`
     - `checkout.session.expired`
     - `payment_intent.payment_failed`

2. **Signing secret:**
   - Copiar el `whsec_...`
   - Agregar como `STRIPE_WEBHOOK_SECRET` en Railway/Fly

3. **Test en producción:**
   ```bash
   stripe trigger checkout.session.completed
   ```

---

## Monitoreo y Observabilidad

### Sentry (Error Tracking)

#### Setup Frontend

```typescript
// apps/web/src/instrumentation.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});
```

#### Setup Backend

```typescript
// apps/api/src/server.ts
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.SENTRY_ENVIRONMENT ?? "production",
  tracesSampleRate: 0.1,
});

app.onError((err, c) => {
  Sentry.captureException(err);
  return c.json({ error: "Internal server error" }, 500);
});
```

---

### Logs

#### Railway

```bash
# CLI
railway logs --tail

# Dashboard
railway.app → Deployments → Logs
```

#### Fly.io

```bash
fly logs --tail
```

#### Structured Logging (Roadmap)

```typescript
// apps/api/src/lib/logger.ts
import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  transport: {
    target: "pino-pretty",
    options: { colorize: true },
  },
});

// Usage
logger.info({ userId: "abc" }, "User logged in");
logger.error({ error: err }, "Payment failed");
```

---

### Health Checks

```typescript
// apps/api/src/app.ts
app.get("/health", async (c) => {
  // Check database
  try {
    await db.$queryRaw`SELECT 1`;
  } catch (error) {
    return c.json(
      {
        status: "unhealthy",
        database: "down",
        timestamp: new Date().toISOString(),
      },
      503,
    );
  }

  return c.json({
    status: "healthy",
    database: "up",
    version: "1.0.0",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});
```

---

## GitHub Secrets Configuration

### Required Secrets for Production Deployment

⚠️ **MANDATORY**: Configure these secrets before running production deployment workflows.

Navigate to: `Repository → Settings → Secrets and variables → Actions → New repository secret`

#### Production Deployment Secrets

| Secret Name                | Description                         | Required | How to Obtain                                    |
| -------------------------- | ----------------------------------- | -------- | ------------------------------------------------ |
| `RAILWAY_PRODUCTION_TOKEN` | Railway API token for production    | ✅ Yes   | `railway login && railway whoami --token`        |
| `VERCEL_TOKEN`             | Vercel deployment token             | ✅ Yes   | `vercel login` → Account Settings → Tokens       |
| `VERCEL_ORG_ID`            | Vercel organization/team ID         | ✅ Yes   | `cat .vercel/project.json` (after `vercel link`) |
| `VERCEL_PROJECT_ID`        | Vercel project ID for production    | ✅ Yes   | `cat .vercel/project.json` (after `vercel link`) |
| `SLACK_WEBHOOK_URL`        | Slack webhook for deployment notifs | ⚪ No    | https://api.slack.com/messaging/webhooks         |
| `RAILWAY_STAGING_TOKEN`    | Railway API token for staging       | ⚪ No    | `railway login && railway whoami --token`        |

**Important Notes:**

- The `deploy-production` workflow validates these secrets and **will skip deployment jobs** if required secrets are missing
- Validation steps provide clear error messages when secrets are not configured
- Slack notifications are optional but recommended for team awareness

**Example: Adding a Secret**

```bash
# 1. Obtain Railway token
railway login
railway whoami --token

# 2. Add to GitHub
# Go to: Settings → Secrets and variables → Actions → New repository secret
# Name: RAILWAY_PRODUCTION_TOKEN
# Value: [paste token]
```

See [DEPLOYMENT_CHECKLIST.md](../../DEPLOYMENT_CHECKLIST.md#-github-secrets-configuration) for complete configuration checklist.

---

## CI/CD

### GitHub Actions Workflow

[.github/workflows/deploy.yml](../../.github/workflows/deploy.yml):

```yaml
name: Deploy Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "24"
          cache: "pnpm"
      - run: pnpm install
      - run: pnpm lint
      - run: pnpm typecheck
      - run: cd apps/api && pnpm test

  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to Railway
        run: |
          railway up --service api
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}

  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: vercel/actions@v1
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: "--prod"
```

---

## Rollback y Disaster Recovery

### Rollback de Frontend (Vercel)

```bash
# Via CLI
vercel rollback <deployment-url>

# Via Dashboard
Deployments → [Previous Deployment] → Promote to Production
```

### Rollback de Backend (Railway)

```bash
# Via Dashboard
railway.app → Deployments → [Previous Deployment] → Redeploy
```

### Rollback de Migraciones de DB

```bash
# ⚠️ Prisma no soporta rollback automático
# Solución: Crear migration reversa manualmente

# 1. Hacer backup
pg_dump $DATABASE_URL > backup-before-rollback.sql

# 2. Crear nueva migración que revierte cambios
cd apps/api
pnpm prisma migrate dev --name revert_xyz

# 3. Aplicar en producción
pnpm prisma migrate deploy
```

### Restore de Database

```bash
# Desde backup de Railway
railway run psql $DATABASE_URL < backup.sql

# Desde backup de Neon
psql $DATABASE_URL < backup.sql
```

---

## Checklist de Pre-Deployment

- [ ] Tests pasando (`pnpm test`, `pnpm test:e2e`)
- [ ] Linting sin errores (`pnpm lint`)
- [ ] TypeScript sin errores (`pnpm typecheck`)
- [ ] Variables de entorno configuradas en Vercel/Railway
- [ ] Stripe webhook configurado con URL de producción
- [ ] Migraciones de DB aplicadas en staging
- [ ] Sentry configurado y testeado
- [ ] Alertas Slack funcionando
- [ ] Health checks respondiendo correctamente
- [ ] Backup reciente de base de datos
- [ ] Changelog actualizado
- [ ] Documentación actualizada

---

## Troubleshooting Común

### "Cannot connect to database"

```bash
# Verificar connection string
echo $DATABASE_URL

# Test de conexión
psql $DATABASE_URL -c "SELECT version();"

# Verificar firewall/allowlist en Railway/Neon
```

### "Stripe webhook signature verification failed"

```bash
# Verificar STRIPE_WEBHOOK_SECRET
echo $STRIPE_WEBHOOK_SECRET

# Re-generar webhook secret en Stripe Dashboard
# Actualizar variable de entorno en Railway/Fly
```

### "NextAuth session not found"

```bash
# Verificar NEXTAUTH_URL (debe coincidir con dominio real)
# Verificar NEXTAUTH_SECRET (debe ser el mismo en todos los deploys)
# Limpiar cookies del browser
```

### "Out of memory" en Railway

```bash
# Escalar verticalmente: Settings → Resources → Increase RAM
# O optimizar queries/memoria en código
```

---

## Recursos Adicionales

- **Railway Docs:** https://docs.railway.app/
- **Fly.io Docs:** https://fly.io/docs/
- **Vercel Docs:** https://vercel.com/docs
- **Neon Docs:** https://neon.tech/docs
- **Prisma Production Best Practices:** https://www.prisma.io/docs/guides/performance-and-optimization

---

**Última actualización:** 30 de septiembre de 2025

Ver también:

- [Quickstart Guide](../getting-started/quickstart.md)
- [API Reference](../api/endpoints.md)
- [Testing Guide](../development/testing.md)
- [ARCHITECTURE.md](../../ARCHITECTURE.md)
