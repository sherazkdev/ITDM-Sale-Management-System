import type { PrismaClient } from "@prisma/client";
import { PermissionKeys } from "../src/shared/auth/permissions.js";

const ALL_EXCEPT_FINANCE_WRITE = Object.values(PermissionKeys).filter(
  (k) => k !== PermissionKeys.invoicesManage && k !== PermissionKeys.budgetsManage,
);

const IT_STAFF_PERMISSIONS = Object.values(PermissionKeys).filter(
  (k) =>
    k !== PermissionKeys.invoicesRead &&
    k !== PermissionKeys.invoicesManage &&
    k !== PermissionKeys.budgetsRead &&
    k !== PermissionKeys.budgetsManage &&
    k !== PermissionKeys.assetsFinancialsRead &&
    k !== PermissionKeys.financialCorrections,
);

const MANAGER_FINANCE_READ = [
  PermissionKeys.invoicesRead,
  PermissionKeys.budgetsRead,
  PermissionKeys.assetsFinancialsRead,
] as const;

export async function seedClientApprovedRoles(prisma: PrismaClient): Promise<void> {
  const allPermissions = await prisma.permission.findMany();
  const byKey = new Map(allPermissions.map((p) => [p.permissionKey, p.permissionId]));

  async function upsertRole(roleKey: string, displayName: string, permissionKeys: string[]) {
    const role = await prisma.role.upsert({
      where: { roleKey },
      create: { roleKey, displayName, description: "Client Prompt #25 role", isSystem: true, isActive: true },
      update: { displayName, isActive: true },
    });
    await prisma.rolePermission.deleteMany({ where: { roleId: role.roleId } });
    const ids = permissionKeys
      .map((k) => byKey.get(k))
      .filter((id): id is bigint => id !== undefined);
    if (ids.length) {
      await prisma.rolePermission.createMany({
        data: ids.map((permissionId) => ({ roleId: role.roleId, permissionId })),
        skipDuplicates: true,
      });
    }
    return role;
  }

  const managerKeys = [
    ...ALL_EXCEPT_FINANCE_WRITE.filter(
      (k) =>
        k !== PermissionKeys.financialCorrections &&
        k !== PermissionKeys.usersManage &&
        k !== PermissionKeys.rolesManage,
    ),
    ...MANAGER_FINANCE_READ,
  ];
  const uniqueManager = [...new Set(managerKeys)];

  await upsertRole("manager", "Manager (finance read-only)", uniqueManager);
  await upsertRole("it_staff", "IT Staff", [...new Set(IT_STAFF_PERMISSIONS)]);
}
