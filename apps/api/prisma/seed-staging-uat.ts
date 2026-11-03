/**
 * Optional UAT fixture seed — run only on staging DB via staging-init.
 * PROPOSED roles (D01 not approved). Passwords must be rotated before any real UAT.
 */
import { PrismaClient } from "@prisma/client";
import { PermissionKeys } from "../src/shared/auth/permissions.js";
import { AuthService } from "../src/modules/auth/auth.service.js";

const prisma = new PrismaClient();

const READONLY_KEYS = [
  PermissionKeys.employeesRead,
  PermissionKeys.vendorsRead,
  PermissionKeys.assetsRead,
  PermissionKeys.contractsRead,
  PermissionKeys.purchaseOrdersRead,
  PermissionKeys.invoicesRead,
  PermissionKeys.searchRead,
  PermissionKeys.notificationsRead,
  PermissionKeys.reportsRead,
];

async function main() {
  for (const permissionKey of Object.values(PermissionKeys)) {
    await prisma.permission.upsert({
      where: { permissionKey },
      create: { permissionKey, description: "PROPOSED (staging UAT fixture)" },
      update: {},
    });
  }

  const adminRole = await prisma.role.upsert({
    where: { roleKey: "uat_admin_proposed" },
    create: {
      roleKey: "uat_admin_proposed",
      displayName: "UAT Admin (PROPOSED)",
      description: "Staging UAT only — not client-approved matrix",
    },
    update: {},
  });

  const readRole = await prisma.role.upsert({
    where: { roleKey: "uat_readonly_proposed" },
    create: {
      roleKey: "uat_readonly_proposed",
      displayName: "UAT Read-only (PROPOSED)",
      description: "Staging UAT only",
    },
    update: {},
  });

  const allPerms = await prisma.permission.findMany();
  for (const p of allPerms) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: adminRole.roleId, permissionId: p.permissionId } },
      create: { roleId: adminRole.roleId, permissionId: p.permissionId },
      update: {},
    });
  }

  const readPerms = await prisma.permission.findMany({
    where: { permissionKey: { in: READONLY_KEYS } },
  });
  for (const p of readPerms) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: readRole.roleId, permissionId: p.permissionId } },
      create: { roleId: readRole.roleId, permissionId: p.permissionId },
      update: {},
    });
  }

  const adminUser = process.env.STAGING_UAT_ADMIN_USER ?? "uat.admin";
  const adminPass = process.env.STAGING_UAT_ADMIN_PASSWORD ?? "StagingUatAdmin-ChangeMe!";
  const readerUser = process.env.STAGING_UAT_READER_USER ?? "uat.reader";
  const readerPass = process.env.STAGING_UAT_READER_PASSWORD ?? "StagingUatReader-ChangeMe!";

  const adminHash = await AuthService.hashPasswordForStorage(adminPass);
  const readerHash = await AuthService.hashPasswordForStorage(readerPass);

  const admin = await prisma.user.upsert({
    where: { username: adminUser },
    create: {
      username: adminUser,
      displayName: "UAT Admin (PROPOSED)",
      passwordHash: adminHash,
      email: "uat.admin@staging.local.invalid",
    },
    update: { passwordHash: adminHash, isActive: true, isLocked: false },
  });

  const reader = await prisma.user.upsert({
    where: { username: readerUser },
    create: {
      username: readerUser,
      displayName: "UAT Read-only (PROPOSED)",
      passwordHash: readerHash,
      email: "uat.reader@staging.local.invalid",
    },
    update: { passwordHash: readerHash, isActive: true, isLocked: false },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: admin.userId, roleId: adminRole.roleId } },
    create: { userId: admin.userId, roleId: adminRole.roleId },
    update: {},
  });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: reader.userId, roleId: readRole.roleId } },
    create: { userId: reader.userId, roleId: readRole.roleId },
    update: {},
  });

  console.log(
    JSON.stringify({
      seeded: "staging-uat-fixtures",
      users: [adminUser, readerUser],
      note: "PROPOSED UAT accounts — D01/D02 not approved; rotate passwords",
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
