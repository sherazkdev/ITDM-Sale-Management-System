import type { PrismaClient } from "@prisma/client";

export class AssetCategoryRepository {
  constructor(private readonly prisma: PrismaClient) {}

  create(data: { categoryName: string; description?: string }) {
    return this.prisma.assetCategory.create({ data });
  }

  findById(categoryId: bigint) {
    return this.prisma.assetCategory.findUnique({ where: { categoryId } });
  }

  update(categoryId: bigint, data: Record<string, unknown>) {
    return this.prisma.assetCategory.update({ where: { categoryId }, data });
  }

  list() {
    return this.prisma.assetCategory.findMany({ orderBy: { categoryName: "asc" } });
  }
}
