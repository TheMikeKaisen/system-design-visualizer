import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  pgPool?: Pool;
};

/**
 * Create and reuse a single pg Pool instance.
 * Prevents exhausting connections during hot reloads in development.
 */
function getPool() {
  if (!globalForPrisma.pgPool) {
    const connectionString =
      process.env.DATABASE_URL ??
      "postgresql://dummy:dummy@localhost:5432/dummy";

    globalForPrisma.pgPool = new Pool({
      connectionString,
    });
  }

  return globalForPrisma.pgPool;
}

/**
 * Create and reuse a single PrismaClient instance.
 * Uses the Prisma pg adapter for better compatibility with:
 * - Next.js App Router
 * - Serverless environments
 * - Supabase / Neon / pooled Postgres providers
 */
function getPrismaClient() {
  if (!globalForPrisma.prisma) {
    const adapter = new PrismaPg(getPool());

    globalForPrisma.prisma = new PrismaClient({
      adapter,
      log:
        process.env.NODE_ENV === "development"
          ? ["query", "warn", "error"]
          : ["error"],
    });
  }

  return globalForPrisma.prisma;
}

export const prisma = getPrismaClient();