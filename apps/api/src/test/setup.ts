/**
 * Test setup utilities for integration tests
 */
import { PrismaClient } from "../generated/prisma";
import { execSync } from "node:child_process";

let prisma: PrismaClient | null = null;

/**
 * Get test database URL
 * Assumes docker-compose.test.yml is running
 */
export function getTestDatabaseUrl(): string {
  return (
    process.env.TEST_DATABASE_URL ??
    "postgresql://test:test@localhost:5433/brisa_test"
  );
}

/**
 * Initialize test database connection
 */
export async function setupTestDatabase(): Promise<{
  prisma: PrismaClient;
  databaseUrl: string;
}> {
  const databaseUrl = getTestDatabaseUrl();

  // Run migrations to set up schema
  try {
    execSync("pnpm db:push", {
      cwd: process.cwd(),
      env: { ...process.env, DATABASE_URL: databaseUrl },
      stdio: "inherit",
    });
  } catch (error) {
    console.error("Failed to run migrations:", error);
    throw error;
  }

  // Create Prisma client
  prisma = new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
    log: process.env.DEBUG_TESTS ? ["query", "error", "warn"] : ["error"],
  });

  await prisma.$connect();

  // Set DATABASE_URL for the application code
  process.env.DATABASE_URL = databaseUrl;

  return { prisma, databaseUrl };
}

/**
 * Clean up test database
 */
export async function teardownTestDatabase() {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
  }
}

/**
 * Clear all data from database (for test isolation)
 */
export async function clearDatabase(client: PrismaClient) {
  const tables = [
    "reconciliation_notes",
    "payment_alerts",
    "bookings",
    "properties",
    "services",
    "users",
  ];

  // Delete in order to respect foreign keys
  for (const table of tables) {
    await client.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE;`);
  }
}

/**
 * Seed test data
 */
export async function seedTestData(client: PrismaClient) {
  // Create admin user
  const admin = await client.user.create({
    data: {
      email: "admin@brisa.test",
      name: "Admin User",
      role: "ADMIN",
      passwordHash: "$2a$10$YourHashedPasswordHere", // bcrypt hash for "password123"
      phone: "+1305123456",
    },
  });

  // Create staff user
  const staff = await client.user.create({
    data: {
      email: "staff@brisa.test",
      name: "Staff User",
      role: "STAFF",
      passwordHash: "$2a$10$YourHashedPasswordHere",
      phone: "+1305123457",
    },
  });

  // Create client user
  const client1 = await client.user.create({
    data: {
      email: "client@brisa.test",
      name: "Client User",
      role: "CLIENT",
      passwordHash: "$2a$10$YourHashedPasswordHere",
      phone: "+1305123458",
    },
  });

  // Create property
  const property = await client.property.create({
    data: {
      name: "Miami Beach Condo",
      address: "123 Ocean Drive",
      city: "Miami Beach",
      state: "FL",
      zipCode: "33139",
      type: "VACATION_RENTAL",
      size: 1200,
      userId: client1.id,
    },
  });

  // Create services
  const deepClean = await client.service.create({
    data: {
      name: "Deep Clean",
      description: "Comprehensive cleaning service",
      basePrice: 150,
      duration: 180,
      active: true,
    },
  });

  const standardClean = await client.service.create({
    data: {
      name: "Standard Clean",
      description: "Regular cleaning service",
      basePrice: 100,
      duration: 120,
      active: true,
    },
  });

  return {
    users: { admin, staff, client: client1 },
    properties: { property },
    services: { deepClean, standardClean },
  };
}
