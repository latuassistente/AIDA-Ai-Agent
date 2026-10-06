import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { aidaPrisma?: PrismaClient };

export const prisma =
  globalForPrisma.aidaPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.aidaPrisma = prisma;
