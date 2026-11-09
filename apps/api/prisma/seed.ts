import { PrismaClient } from "@prisma/client";
import { PermissionKeys } from "../src/shared/auth/permissions.js";
import { AuthService } from "../src/modules/auth/auth.service.js";

const prisma = new PrismaClient();

const ALL_PERMISSIONS = Object.values(PermissionKeys);

async function main() {
  for (const permissionKey of ALL_PERMISSIONS) {
    await prisma.permission.upsert({
      where: { permissionKey },
      create: { permissionKey, description: "PROPOSED seed permission (D01 not approved)" },
      update: {},
    });
  }

  const adminRole = await prisma.role.upsert({
    where: { roleKey: "admin" },
    create: {
      roleKey: "admin",
      displayName: "Administrator",
      description: "Client-approved administrative role (financial corrections)",
      isSystem: true,
      isActive: true,
    },
    update: { isSystem: true, isActive: true },
  });

  const proposedRole = await prisma.role.upsert({
    where: { roleKey: "it_admin_proposed" },
    create: {
      roleKey: "it_admin_proposed",
      displayName: "IT Admin (PROPOSED seed role)",
      description: "Development seed only — not an approved client role matrix",
      isSystem: true,
      isActive: true,
    },
    update: { isSystem: true },
  });

  const permissions = await prisma.permission.findMany({
    where: { permissionKey: { in: ALL_PERMISSIONS } },
  });

  for (const permission of permissions) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: adminRole.roleId, permissionId: permission.permissionId } },
      create: { roleId: adminRole.roleId, permissionId: permission.permissionId },
      update: {},
    });
    if (permission.permissionKey === PermissionKeys.financialCorrections) {
      await prisma.rolePermission.deleteMany({
        where: { roleId: proposedRole.roleId, permissionId: permission.permissionId },
      });
    } else {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: { roleId: proposedRole.roleId, permissionId: permission.permissionId },
        },
        create: { roleId: proposedRole.roleId, permissionId: permission.permissionId },
        update: {},
      });
    }
  }

  const username = process.env.SEED_ADMIN_USERNAME ?? "admin.dev";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe_DevOnly!";
  const passwordHash = await AuthService.hashPasswordForStorage(password);

  const user = await prisma.user.upsert({
    where: { username },
    create: {
      username,
      displayName: "Development Admin (PROPOSED)",
      passwordHash,
      email: "admin.dev@local.invalid",
    },
    update: { passwordHash, isActive: true, isLocked: false },
  });

  for (const roleId of [adminRole.roleId, proposedRole.roleId]) {
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: user.userId, roleId } },
      create: { userId: user.userId, roleId },
      update: {},
    });
  }

  console.log(
    JSON.stringify({
      seeded: true,
      username,
      note:
        "Dev seed user — admin role holds financial.corrections; it_admin_proposed excludes corrections until D01.",
    }),
  );
}

main()
  .catch((err: unknown) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
