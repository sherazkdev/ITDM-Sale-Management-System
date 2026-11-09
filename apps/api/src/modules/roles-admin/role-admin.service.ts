import { Prisma } from "@prisma/client";
import type { PrismaClient } from "@prisma/client";
import type { AuditService } from "../../shared/audit/audit.service.js";
import { PermissionKeys } from "../../shared/auth/permissions.js";
import { AppError } from "../../shared/errors/app-error.js";
import { ErrorCodes } from "../../shared/errors/error-codes.js";

/** Client policy: only the approved Administrator role may hold financial.corrections. */
const CORRECTIONS_ELIGIBLE_ROLE_KEYS = new Set(["admin"]);
const PROTECTED_SYSTEM_ROLE_KEYS = new Set(["it_admin_proposed", "admin"]);

export class RoleAdminService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly audit: AuditService,
  ) {}

  listPermissions() {
    return this.prisma.permission.findMany({ orderBy: { permissionKey: "asc" } });
  }

  listRoles() {
    return this.prisma.role.findMany({
      orderBy: { displayName: "asc" },
      include: {
        rolePermissions: { include: { permission: true } },
        _count: { select: { userRoles: true } },
      },
    });
  }

  async createRole(
    input: { displayName: string; description?: string; colorKey?: string },
    actorUserId?: bigint,
    requestId?: string,
  ) {
    const displayName = input.displayName.trim();
    const roleKey =
      `custom_${displayName.toLowerCase().replace(/[^a-z0-9]+/g, "_").slice(0, 40)}_${Date.now().toString(36).slice(-4)}`;
    const row = await this.prisma.role.create({
      data: {
        roleKey,
        displayName,
        description: input.description,
        colorKey: input.colorKey,
        isSystem: false,
        isActive: true,
      },
      include: { rolePermissions: { include: { permission: true } } },
    });
    await this.audit.record({
      actorUserId,
      action: "role.create",
      targetType: "role",
      targetId: row.roleId.toString(),
      result: "success",
      requestId,
    });
    return row;
  }

  async updateRole(
    roleId: bigint,
    input: {
      displayName?: string;
      description?: string | null;
      isActive?: boolean;
      colorKey?: string | null;
    },
    actorUserId?: bigint,
    requestId?: string,
  ) {
    const existing = await this.prisma.role.findUnique({ where: { roleId } });
    if (!existing) throw new AppError(ErrorCodes.NOT_FOUND, "Role not found", 404);
    const row = await this.prisma.role.update({
      where: { roleId },
      data: {
        ...(input.displayName ? { displayName: input.displayName.trim() } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
        ...(input.colorKey !== undefined ? { colorKey: input.colorKey } : {}),
      },
      include: { rolePermissions: { include: { permission: true } } },
    });
    await this.audit.record({
      actorUserId,
      action: "role.update",
      targetType: "role",
      targetId: roleId.toString(),
      result: "success",
      requestId,
    });
    return row;
  }

  async setRolePermissions(
    roleId: bigint,
    permissionKeys: string[],
    actorUserId?: bigint,
    requestId?: string,
  ) {
    const role = await this.prisma.role.findUnique({ where: { roleId } });
    if (!role) throw new AppError(ErrorCodes.NOT_FOUND, "Role not found", 404);

    const unique = [...new Set(permissionKeys)];
    if (
      unique.includes(PermissionKeys.financialCorrections) &&
      !CORRECTIONS_ELIGIBLE_ROLE_KEYS.has(role.roleKey)
    ) {
      throw new AppError(
        ErrorCodes.FORBIDDEN,
        "financial.corrections may only be assigned to the protected Admin role",
        403,
      );
    }

    const permissions = await this.prisma.permission.findMany({
      where: { permissionKey: { in: unique } },
    });
    if (permissions.length !== unique.length) {
      throw new AppError(ErrorCodes.VALIDATION_ERROR, "Unknown permission key", 422);
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.rolePermission.deleteMany({ where: { roleId } });
      await tx.rolePermission.createMany({
        data: permissions.map((p) => ({ roleId, permissionId: p.permissionId })),
      });
      const userIds = (
        await tx.userRole.findMany({ where: { roleId }, select: { userId: true } })
      ).map((u) => u.userId);
      if (userIds.length > 0) {
        await tx.session.updateMany({
          where: { userId: { in: userIds }, revokedAt: null },
          data: { revokedAt: new Date() },
        });
      }
    });

    await this.audit.record({
      actorUserId,
      action: "role.permissions.update",
      targetType: "role",
      targetId: roleId.toString(),
      result: "success",
      requestId,
      metadata: { permissionCount: unique.length },
    });

    return this.prisma.role.findUniqueOrThrow({
      where: { roleId },
      include: { rolePermissions: { include: { permission: true } } },
    });
  }

  async deleteRole(roleId: bigint, actorUserId?: bigint, requestId?: string) {
    const role = await this.prisma.role.findUnique({
      where: { roleId },
      include: { _count: { select: { userRoles: true } } },
    });
    if (!role) throw new AppError(ErrorCodes.NOT_FOUND, "Role not found", 404);
    if (role.isSystem || PROTECTED_SYSTEM_ROLE_KEYS.has(role.roleKey)) {
      throw new AppError(ErrorCodes.FORBIDDEN, "System roles cannot be deleted", 403);
    }
    if (role._count.userRoles > 0) {
      throw new AppError(ErrorCodes.CONFLICT, "Role is still assigned to users", 409);
    }
    try {
      await this.prisma.$transaction([
        this.prisma.rolePermission.deleteMany({ where: { roleId } }),
        this.prisma.role.delete({ where: { roleId } }),
      ]);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new AppError(ErrorCodes.CONFLICT, "Role could not be deleted", 409);
      }
      throw err;
    }
    await this.audit.record({
      actorUserId,
      action: "role.delete",
      targetType: "role",
      targetId: roleId.toString(),
      result: "success",
      requestId,
    });
    return { deleted: true };
  }

  async assertAdminRolePreserved(userId: bigint, nextRoleKeys: string[]) {
    const adminRoles = await this.prisma.role.findMany({
      where: { roleKey: { in: [...PROTECTED_SYSTEM_ROLE_KEYS] } },
    });
    if (adminRoles.length === 0) return;
    const adminRoleIds = new Set(adminRoles.map((r) => r.roleId));
    const currentAdmins = await this.prisma.userRole.count({
      where: { roleId: { in: [...adminRoleIds] } },
    });
    if (currentAdmins === 0) return;
    const nextRoles = await this.prisma.role.findMany({ where: { roleKey: { in: nextRoleKeys } } });
    const userWillBeAdmin = nextRoles.some((r) => adminRoleIds.has(r.roleId));
    const targetUserAdmin = await this.prisma.userRole.findFirst({
      where: { userId, roleId: { in: [...adminRoleIds] } },
    });
    if (targetUserAdmin && !userWillBeAdmin) {
      const remaining = await this.prisma.userRole.count({
        where: { roleId: { in: [...adminRoleIds] }, userId: { not: userId } },
      });
      if (remaining === 0) {
        throw new AppError(ErrorCodes.FORBIDDEN, "Cannot remove the last Admin role assignment", 403);
      }
    }
  }
}
