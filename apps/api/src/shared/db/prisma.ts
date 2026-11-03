import { PrismaClient } from "@prisma/client";
import type { AppEnv } from "../config/env.js";
import type { Logger } from "../logging/logger.js";

let prisma: PrismaClient | undefined;

export function getPrisma(env: AppEnv, _logger: Logger): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient({
      datasources: { db: { url: env.DATABASE_URL } },
    });
  }
  return prisma;
}

export async function disconnectPrisma(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect();
    prisma = undefined;
  }
}

export function resetPrismaForTests(): void {
  prisma = undefined;
}
