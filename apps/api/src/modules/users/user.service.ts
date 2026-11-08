import { Prisma } from "@prisma/client";
import { AppError } from "../../shared/errors/app-error.js";
import { ErrorCodes } from "../../shared/errors/error-codes.js";
import { AuthService } from "../auth/auth.service.js";
import type { PrismaClient } from "@prisma/client";

export class UserAdminService {
  constructor(private readonly prisma: PrismaClient) {}

  async list() {
    return this.prisma.user.findMany({
      orderBy: { username: "asc" },
      include: {
        userRoles: { include: { role: true } },
      },
    });
  }

  async create(input: {
    username: string;
    displayName: string;
    password: string;
    email?: string;
    roleKeys: string[];
  }) {
    const roles = await this.prisma.role.findMany({ where: { roleKey: { in: input.roleKeys } } });
    if (roles.length !== input.roleKeys.length) {
      throw new AppError(ErrorCodes.VALIDATION_ERROR, "One or more roles not found", 422);
    }
    const passwordHash = await AuthService.hashPasswordForStorage(input.password);
    try {
      return await this.prisma.user.create({
        data: {
          username: input.username.trim(),
          displayName: input.displayName.trim(),
          email: input.email,
          passwordHash,
          userRoles: {
            create: roles.map((r) => ({ roleId: r.roleId })),
          },
        },
        include: { userRoles: { include: { role: true } } },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        throw new AppError(ErrorCodes.CONFLICT, "Username or email already exists", 409);
      }
      throw err;
    }
  }

  async update(
    userId: bigint,
    input: { displayName?: string; email?: string | null; isActive?: boolean; isLocked?: boolean },
  ) {
    try {
      return await this.prisma.user.update({
        where: { userId },
        data: {
          ...(input.displayName ? { displayName: input.displayName.trim() } : {}),
          ...(input.email !== undefined ? { email: input.email } : {}),
          ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
          ...(input.isLocked !== undefined ? { isLocked: input.isLocked } : {}),
        },
        include: { userRoles: { include: { role: true } } },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
        throw new AppError(ErrorCodes.NOT_FOUND, "User not found", 404);
      }
      throw err;
    }
  }

  async setRoles(userId: bigint, roleKeys: string[]) {
    const roles = await this.prisma.role.findMany({ where: { roleKey: { in: roleKeys } } });
    if (roles.length !== roleKeys.length) {
      throw new AppError(ErrorCodes.VALIDATION_ERROR, "One or more roles not found", 422);
    }
  const protectedAdminKeys = new Set(["admin", "it_admin_proposed"]);
  const adminRoles = await this.prisma.role.findMany({
      where: { roleKey: { in: [...protectedAdminKeys] } },
    });
    const adminRoleIds = new Set(adminRoles.map((r) => r.roleId));
    const hadAdmin = await this.prisma.userRole.findFirst({
      where: { userId, roleId: { in: [...adminRoleIds] } },
    });
    const willHaveAdmin = roles.some((r) => adminRoleIds.has(r.roleId));
    if (hadAdmin && !willHaveAdmin) {
      const otherAdmins = await this.prisma.userRole.count({
        where: { roleId: { in: [...adminRoleIds] }, userId: { not: userId } },
      });
      if (otherAdmins === 0) {
        throw new AppError(ErrorCodes.FORBIDDEN, "Cannot remove the last Admin role assignment", 403);
      }
    }
    return this.prisma.$transaction(async (tx) => {
      await tx.userRole.deleteMany({ where: { userId } });
      await tx.userRole.createMany({
        data: roles.map((r) => ({ userId, roleId: r.roleId })),
      });
      await tx.session.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      return tx.user.findUniqueOrThrow({
        where: { userId },
        include: { userRoles: { include: { role: true } } },
      });
    });
  }

  listRoles() {
    return this.prisma.role.findMany({
      orderBy: { roleKey: "asc" },
      include: { rolePermissions: { include: { permission: true } } },
    });
  }
}
