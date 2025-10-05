import { PrismaClient } from "../generated/prisma";
import type * as Prisma from "../generated/prisma";

export { Prisma };

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

// Prisma Client with optimized configuration
// Connection pooling configured via DATABASE_URL:
// postgresql://user:pass@host:5432/db?connection_limit=20&pool_timeout=10
export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}

// Graceful shutdown
process.on("beforeExit", () => {
  void db.$disconnect();
});
