# Integration Tests

This directory contains end-to-end integration tests for the Brisa Cubana API.

## Overview

Integration tests use **real PostgreSQL databases** via [Testcontainers](https://testcontainers.com/) to ensure:

- Database constraints are enforced
- Transactions work correctly
- Foreign key relationships behave as expected
- Real-world scenarios function end-to-end

## Requirements

- **Docker** must be running (testcontainers uses Docker to spin up PostgreSQL)
- Node.js 18+ (already required for the project)

## Running Tests

### Unit Tests (Fast, No DB)

```bash
pnpm test
pnpm test:watch
```

### Integration Tests (Slower, Real DB)

```bash
# Runs Docker Compose to start PostgreSQL, runs tests, then cleans up
pnpm test:integration

# For development: manually start DB, then watch tests
pnpm test:db:up
pnpm test:integration:watch
# When done: pnpm test:db:down
```

### All Tests

```bash
pnpm test:all
```

## Test Structure

```
src/test/
├── setup.ts                           # Test utilities (DB setup, seed data)
├── integration/
│   ├── auth.integration.test.ts      # Auth flow E2E tests
│   ├── bookings.integration.test.ts  # Bookings CRUD E2E tests
│   └── ...                           # More integration tests
└── README.md                         # This file
```

## How It Works

1. **Container Startup**: Docker Compose starts PostgreSQL 17 container
2. **Migrations**: Runs `prisma db push` to create schema
3. **Test Execution**: Runs tests with real database operations
4. **Cleanup**: Docker Compose tears down container and removes volumes

## Writing Integration Tests

Example test:

```typescript
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { PrismaClient } from "../../generated/prisma";
import {
  setupTestDatabase,
  teardownTestDatabase,
  clearDatabase,
  seedTestData,
} from "../setup";

let prisma: PrismaClient;

describe("My Integration Tests", () => {
  beforeAll(async () => {
    const setup = await setupTestDatabase();
    prisma = setup.prisma;
    process.env.DATABASE_URL = setup.databaseUrl;
  }, 60000);

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearDatabase(prisma);
    await seedTestData(prisma);
  });

  it("should do something with real database", async () => {
    const user = await prisma.user.create({
      /* ... */
    });
    expect(user).toBeDefined();
  });
});
```

## Test Isolation

- All integration tests share one database container per run
- `beforeEach` clears all data with TRUNCATE CASCADE for fresh state
- Tests run sequentially to avoid concurrency issues

## Performance

- **Unit Tests**: ~400ms (no database, mocked)
- **Integration Tests**: ~5-10s (includes container startup + migrations + cleanup)

Use unit tests for fast feedback during development.
Use integration tests to verify database behavior before commits.

## CI/CD

Integration tests require Docker, which is available in most CI environments:

- GitHub Actions: ✅ Docker available
- GitLab CI: ✅ Docker available (use `docker:dind` service)
- CircleCI: ✅ Docker available

## Troubleshooting

### "Cannot connect to Docker daemon"

- Ensure Docker Desktop is running
- On Linux: `sudo systemctl start docker`
- Verify: `docker ps`

### "Port 5432 already in use"

- Testcontainers uses random ports, so this shouldn't happen
- If it does, stop any local PostgreSQL: `sudo systemctl stop postgresql`

### Tests timeout

- Increase timeout in `vitest.integration.config.ts`
- Check Docker has sufficient resources (4GB+ RAM recommended)

### Permission errors

- On Linux, ensure your user is in the `docker` group:
  ```bash
  sudo usermod -aG docker $USER
  newgrp docker
  ```
