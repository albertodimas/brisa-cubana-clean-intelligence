import { PrismaClient } from "@prisma/client";
import { softDeleteExtension } from "./soft-delete-extension.js";

const createClient = () =>
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  }).$extends(softDeleteExtension);

type ExtendedPrismaClient = ReturnType<typeof createClient>;

const globalForPrisma = globalThis as unknown as {
  prisma?: ExtendedPrismaClient;
};

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Graceful shutdown para serverless
if (process.env.VERCEL) {
  process.on("beforeExit", async () => {
    await prisma.$disconnect();
  });
}
