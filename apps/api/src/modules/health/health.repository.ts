import type { PrismaClient } from "@prisma/client";

export class HealthRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async pingDatabase(): Promise<void> {
    await this.prisma.$queryRaw`SELECT 1`;
  }
}
