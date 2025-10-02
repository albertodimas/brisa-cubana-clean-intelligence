# 🚀 Quickstart Guide - Brisa Cubana Clean Intelligence

Get up and running in **5 minutes**.

---

## Prerequisites

| Tool        | Version  | Installation                                                     |
| ----------- | -------- | ---------------------------------------------------------------- |
| **Node.js** | 24.9.0+  | `nvm install 24`                                                 |
| **pnpm**    | 10.17.1+ | `corepack enable`                                                |
| **Docker**  | 28+      | [Docker Desktop](https://www.docker.com/products/docker-desktop) |
| **Git**     | 2.40+    | Pre-installed on most systems                                    |

---

## 🏃 Quick Setup (5 Steps)

### 1️⃣ Clone & Install

```bash
# Clone repository
git clone git@github.com:albertodimas/brisa-cubana-clean-intelligence.git
cd brisa-cubana-clean-intelligence

# Use correct Node version
nvm use

# Install dependencies (takes ~2 min)
pnpm install
```

---

### 2️⃣ Configure Environment

```bash
# Copy environment templates
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.local.example apps/web/.env.local
```

**Edit `apps/api/.env`** with required values:

```bash
# Required
DATABASE_URL="postgresql://brisa_user:brisa_pass@localhost:5433/brisa_cubana_dev"
JWT_SECRET="<generate-with-openssl-rand-hex-64>"

# Stripe (optional for development, but recommended)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."  # Get from `pnpm stripe:listen`

# Alerts (optional)
ALERTS_SLACK_WEBHOOK="https://hooks.slack.com/services/..."
```

**Generate JWT Secret:**

```bash
openssl rand -hex 64
```

**Edit `apps/web/.env.local`**:

```bash
# Required
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="<generate-with-openssl-rand-base64-32>"
NEXT_PUBLIC_API_URL="http://localhost:3001"
```

**Generate NextAuth Secret:**

```bash
openssl rand -base64 32
```

---

### 3️⃣ Start Database

```bash
# Start PostgreSQL 17 + Redis 8 + MailHog
docker compose up -d

# Verify services are running
docker compose ps
# Should show postgres (port 5433), redis (port 6380), mailhog (port 8026)
```

---

### 4️⃣ Setup Database

```bash
# Generate Prisma Client
pnpm --filter=@brisa/api db:generate

# Apply schema to database
pnpm --filter=@brisa/api db:push

# Seed initial data (users, services, properties)
pnpm --filter=@brisa/api db:seed
```

**Seeded users:**

- 👤 Admin: `admin@brisacubanaclean.com` / `Admin123!`
- 👷 Staff: `staff@brisacubanaclean.com` / `Staff123!`
- 👥 Cliente: `client@brisacubanaclean.com` / `Client123!`

---

### 5️⃣ Start Development Servers

```bash
# Start all services (API + Web)
pnpm dev
```

**Open in browser:**

- 🌐 **Frontend**: http://localhost:3000
- 🔌 **API**: http://localhost:3001
- 📬 **MailHog**: http://localhost:8026
- 🗄️ **Prisma Studio**: `pnpm --filter=@brisa/api db:studio`

---

## ✅ Verify Installation

### Test API

```bash
# Health check
curl http://localhost:3001/health

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@brisacubanaclean.com","password":"Admin123!"}'
```

### Test Frontend

1. Navigate to http://localhost:3000
2. Haz clic en "Inicia sesión"
3. Ingresa con `admin@brisacubanaclean.com` / `Admin123!`
4. Explore dashboard

---

## 🧪 Run Tests

```bash
# Unit tests (API)
pnpm --filter=@brisa/api test

# E2E tests (Web)
pnpm playwright install chromium  # First time only
pnpm test:e2e

# All tests + linting
pnpm lint
pnpm typecheck
pnpm test
```

---

## 🎓 Next Steps

### Learn the Codebase

- **API Structure**: [apps/api/README.md](apps/api/README.md)
- **Frontend Structure**: [apps/web/README.md](apps/web/README.md)
- **Architecture**: [ARCHITECTURE.md](ARCHITECTURE.md)

### Development Workflow

```bash
# Create feature branch
git checkout -b feature/my-feature

# Make changes...

# Run quality checks
pnpm lint
pnpm typecheck
pnpm test

# Commit (uses Conventional Commits)
git commit -m "feat: add amazing feature"

# Push & create PR
git push origin feature/my-feature
gh pr create --fill
```

### Useful Commands

```bash
# Database
pnpm db:studio              # Open Prisma Studio
pnpm db:push                # Sync schema (dev)
pnpm db:migrate             # Create migration
pnpm db:seed                # Reseed data

# Development
pnpm dev:web                # Frontend only
pnpm dev:api                # Backend only
pnpm build                  # Build all apps

# Testing
pnpm test:watch             # Watch mode
pnpm test:coverage          # Coverage report
pnpm playwright test --ui   # Debug E2E

# Stripe (if configured)
pnpm stripe:listen          # Forward webhooks
pnpm stripe:trigger checkout.session.completed

# Documentation
make serve                  # MkDocs at :8000
```

---

## 🐛 Troubleshooting

### Error: "Cannot connect to database"

```bash
# Check Docker services
docker compose ps

# Restart if needed
docker compose down
docker compose up -d

# Check connection
psql "postgresql://brisa_user:brisa_pass@localhost:5433/brisa_cubana_dev" -c "SELECT 1"
```

### Error: "Port already in use"

```bash
# Find process using port 3000/3001
lsof -i :3000
lsof -i :3001

# Kill process
kill -9 <PID>
```

### Error: "Prisma Client not generated"

```bash
pnpm --filter=@brisa/api db:generate
```

### Error: "Module not found"

```bash
# Clean install
rm -rf node_modules
rm pnpm-lock.yaml
pnpm install
```

---

## 📚 Documentation

- **Full Documentation**: [docs/index.md](docs/index.md)
- **API Reference**: [docs/for-developers/api-reference.md](docs/for-developers/api-reference.md)
- **Testing Guide**: [docs/for-developers/testing.md](docs/for-developers/testing.md)
- **Deployment**: [docs/for-developers/deployment.md](docs/for-developers/deployment.md)

---

## 🤝 Need Help?

- **Issues**: [GitHub Issues](https://github.com/albertodimas/brisa-cubana-clean-intelligence/issues)
- **Contributing**: [CONTRIBUTING.md](CONTRIBUTING.md)
- **Email**: albertodimasmorazaldivar@gmail.com

---

**Happy coding! 🚀**
