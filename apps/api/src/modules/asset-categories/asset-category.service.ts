import { Prisma } from "@prisma/client";
import { AppError } from "../../shared/errors/app-error.js";
import { ErrorCodes } from "../../shared/errors/error-codes.js";
import type { AssetCategoryRepository } from "./asset-category.repository.js";

export class AssetCategoryService {
  constructor(private readonly repository: AssetCategoryRepository) {}

  async create(input: { categoryName: string; description?: string }) {
    try {
      return await this.repository.create({
        categoryName: input.categoryName.trim(),
        description: input.description,
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        throw new AppError(ErrorCodes.CONFLICT, "Category name already exists", 409);
      }
      throw err;
    }
  }

  async update(categoryId: bigint, data: Record<string, unknown>) {
    try {
      return await this.repository.update(categoryId, data);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
        throw new AppError(ErrorCodes.NOT_FOUND, "Asset category not found", 404);
      }
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        throw new AppError(ErrorCodes.CONFLICT, "Category name already exists", 409);
      }
      throw err;
    }
  }

  list() {
    return this.repository.list();
  }
}
