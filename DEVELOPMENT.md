# Development Guide - Brisa Cubana Clean Intelligence

## 🚀 Quick Start

### Prerequisites

- Node.js >= 24.9.0
- pnpm 10.17.1
- Docker and Docker Compose
- Git

### Initial Setup

1. **Clone the repository:**

   ```bash
   git clone https://github.com/albertodimas/brisa-cubana-clean-intelligence.git
   cd brisa-cubana-clean-intelligence
   ```

2. **Install dependencies:**

   ```bash
   pnpm install
   ```

3. **Setup environment files:**

   **API (.env):**

   ```bash
   cp apps/api/.env.example apps/api/.env
   # Edit apps/api/.env and set JWT_SECRET to a random 64-char string
   openssl rand -hex 32  # Use this to generate JWT_SECRET
   ```

   **Web (.env.local):**

   ```bash
   cp apps/web/.env.local.example apps/web/.env.local
   # Edit apps/web/.env.local and set NEXTAUTH_SECRET
   openssl rand -hex 32  # Use this to generate NEXTAUTH_SECRET
   ```

4. **Start Docker services:**

   ```bash
   docker compose up -d
   ```

   This starts:
   - PostgreSQL on port 5433
   - Redis on port 6380
   - MailHog on ports 1026 (SMTP) / 8026 (Web UI)

5. **Initialize the database:**

   ```bash
   pnpm --filter=@brisa/api db:push
   pnpm --filter=@brisa/api db:seed
   ```

6. **Start development servers:**

   Open two terminal windows:

   **Terminal 1 - API:**

   ```bash
   pnpm --filter=@brisa/api dev
   # API will be available at http://localhost:3001
   ```

   **Terminal 2 - Web:**

   ```bash
   pnpm --filter=web dev
   # Web app will be available at http://localhost:3000
   ```

## 📦 Project Structure

```
brisa-cubana-clean-intelligence/
├── apps/
│   ├── api/              # Backend API (Hono + Prisma)
│   │   ├── prisma/       # Database schema and migrations
│   │   ├── src/
│   │   │   ├── routes/   # API endpoints
│   │   │   ├── lib/      # Utilities (db, logger, etc)
│   │   │   ├── middleware/ # Auth, rate limiting, etc
│   │   │   ├── services/ # Business logic
│   │   │   └── schemas.ts # Zod validation schemas
│   │   └── package.json
│   └── web/              # Frontend (Next.js 15)
│       ├── app/          # Next.js App Router
│       ├── components/   # React components
│       └── package.json
├── packages/
│   └── ui/               # Shared UI components
├── docker-compose.yml    # Local development services
└── package.json          # Root workspace config
```

## 🛠️ Available Commands

### Root Level

```bash
# Development
pnpm dev                    # Start all dev servers
pnpm dev:api               # Start only API
pnpm dev:web               # Start only Web

# Testing
pnpm test                  # Run all tests
pnpm test:e2e             # Run E2E tests

# Linting & Type Checking
pnpm lint                  # Lint all packages
pnpm typecheck            # Type check all packages
pnpm format               # Format code with Prettier

# Building
pnpm build                # Build all packages
```

### API Commands

```bash
cd apps/api

# Development
pnpm dev                  # Start with hot reload
pnpm build               # Build for production

# Database
pnpm db:generate         # Generate Prisma Client
pnpm db:push            # Push schema to DB (dev)
pnpm db:migrate         # Create and run migration
pnpm db:studio          # Open Prisma Studio (DB GUI)
pnpm db:seed            # Seed database with test data

# Testing
pnpm test               # Run unit tests
pnpm test:watch        # Run tests in watch mode
pnpm test -- --coverage # Run tests with coverage

# Code Quality
pnpm lint              # Lint code
pnpm typecheck         # Check TypeScript types
```

### Web Commands

```bash
cd apps/web

# Development
pnpm dev               # Start with Turbopack
pnpm build            # Build for production
pnpm start            # Start production server

# Code Quality
pnpm lint             # Lint code
```

## 🗄️ Database

### Schema Management

The database schema is defined in `apps/api/prisma/schema.prisma`.

**After changing the schema:**

```bash
# Generate Prisma Client
pnpm --filter=@brisa/api db:generate

# Push changes to DB (development)
pnpm --filter=@brisa/api db:push

# OR create a migration (for production)
pnpm --filter=@brisa/api db:migrate
```

### Seed Data

The seed script creates test data:

- 4 Services (Basic Clean, Deep Clean, Move In/Out, Vacation Rental)
- 4 Users (Admin, Staff, 2 Clients)
- 4 Properties
- 4 Sample Bookings

**Test Users:**

```
Admin:  admin@brisacubanaclean.com / demo123
Staff:  staff@brisacubanaclean.com / demo123
Client: client@brisacubanaclean.com / demo123
```

### Reset Database

```bash
# Drop all data and re-seed
pnpm --filter=@brisa/api db:push --force-reset
pnpm --filter=@brisa/api db:seed
```

## 🔧 Docker Services

### Start Services

```bash
docker compose up -d
```

### Stop Services

```bash
docker compose down
```

### View Logs

```bash
docker compose logs -f postgres  # PostgreSQL logs
docker compose logs -f redis     # Redis logs
```

### Access Services

- **PostgreSQL**: `localhost:5433`
- **Redis**: `localhost:6380`
- **MailHog Web UI**: http://localhost:8026

### Reset Services

```bash
docker compose down -v  # Remove volumes (deletes all data)
docker compose up -d
```

## 📝 API Development

### Adding a New Endpoint

1. **Define the route** in `apps/api/src/routes/`:

   ```typescript
   import { Hono } from "hono";
   import { authMiddleware } from "../middleware/auth";

   export const myRoute = new Hono();

   myRoute.get("/", authMiddleware, async (c) => {
     // Your logic here
     return c.json({ data: [] });
   });
   ```

2. **Add validation schemas** in `apps/api/src/schemas.ts`:

   ```typescript
   export const mySchema = z.object({
     field: z.string(),
   });
   ```

3. **Register the route** in `apps/api/src/app.ts`:

   ```typescript
   app.route("/api/myroute", myRoute);
   ```

4. **Add tests** in `apps/api/src/routes/myroute.test.ts`:
   ```typescript
   import { describe, it, expect } from "vitest";
   // ... your tests
   ```

### Authentication

Protected endpoints require a JWT token in the Authorization header:

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3001/api/bookings
```

Get a token by logging in:

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@brisacubanaclean.com", "password": "demo123"}'
```

## 🧪 Testing

### Unit Tests

```bash
# Run all tests
pnpm test

# Run API tests only
pnpm --filter=@brisa/api test

# Run with coverage
pnpm --filter=@brisa/api test -- --coverage

# Watch mode
pnpm --filter=@brisa/api test:watch
```

### Coverage Thresholds

The project maintains 70% minimum coverage for:

- Lines
- Functions
- Branches
- Statements

### E2E Tests

```bash
pnpm test:e2e
```

## 🐛 Debugging

### API Debugging

The API uses Pino for logging. In development, logs are pretty-printed.

**Log Levels:**

- `trace`: Very detailed debugging
- `debug`: Detailed debugging information
- `info`: General informational messages
- `warn`: Warning messages
- `error`: Error events
- `fatal`: Very severe errors

Set log level in `.env`:

```bash
LOG_LEVEL=debug
```

### Database Debugging

Use Prisma Studio to inspect the database:

```bash
pnpm --filter=@brisa/api db:studio
# Opens at http://localhost:5555
```

Or connect directly with psql:

```bash
psql postgresql://postgres:postgres@localhost:5433/brisa_cubana_dev
```

## 🔍 Troubleshooting

### Port Already in Use

If ports 3000, 3001, 5433, or 6380 are in use:

```bash
# Find process using port
lsof -i :3001

# Kill process
kill -9 <PID>
```

### Docker Issues

```bash
# Reset Docker services
docker compose down -v
docker compose up -d

# Check service health
docker compose ps
docker compose logs <service>
```

### Database Connection Issues

1. Ensure PostgreSQL is running: `docker compose ps`
2. Check connection string in `.env`
3. Try connecting manually:
   ```bash
   psql postgresql://postgres:postgres@localhost:5433/brisa_cubana_dev
   ```

### Prisma Client Out of Sync

```bash
pnpm --filter=@brisa/api db:generate
```

### Node Modules Issues

```bash
# Clean install
rm -rf node_modules
pnpm install
```

## 📚 Additional Resources

- [Project Documentation](./docs/)
- [API Endpoints](./docs/api/endpoints.md)
- [Architecture](./ARCHITECTURE.md)
- [Contributing Guidelines](./CONTRIBUTING.md)

## 🤝 Getting Help

If you encounter issues:

1. Check this guide
2. Check existing [GitHub Issues](https://github.com/albertodimas/brisa-cubana-clean-intelligence/issues)
3. Create a new issue with:
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details
   - Relevant logs

## 📄 License

This project is proprietary software. All rights reserved.
