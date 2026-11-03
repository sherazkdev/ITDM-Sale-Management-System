import type { PrismaClient } from "@prisma/client";
import type { AuthPrincipal } from "../../shared/auth/principal.js";

export class PermissionService {
  constructor(private readonly prisma: PrismaClient) {}

  extractPermissionsFromUser(user: {
    userRoles: Array<{
      role: { rolePermissions: Array<{ permission: { permissionKey: string } }> };
    }>;
  }): Set<string> {
    const keys = new Set<string>();
    for (const ur of user.userRoles) {
      for (const rp of ur.role.rolePermissions) {
        keys.add(rp.permission.permissionKey);
      }
    }
    return keys;
  }

  async getPrincipalForUserId(userId: bigint): Promise<AuthPrincipal | null> {
    const user = await this.prisma.user.findUnique({
      where: { userId },
      include: {
        userRoles: {
          include: {
            role: { include: { rolePermissions: { include: { permission: true } } } },
          },
        },
      },
    });
    if (!user || !user.isActive || user.isLocked) {
      return null;
    }
    return {
      userId: user.userId,
      username: user.username,
      displayName: user.displayName,
      permissions: this.extractPermissionsFromUser(user),
    };
  }

  hasPermission(principal: AuthPrincipal, permission: string): boolean {
    return principal.permissions.has(permission);
  }
}
