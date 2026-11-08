import { PrismaClient } from "@prisma/client";
import { AuthService } from "../../src/modules/auth/auth.service.js";
import { loadEnv } from "../../src/shared/config/env.js";
import { PermissionKeys } from "../../src/shared/auth/permissions.js";

const prisma = new PrismaClient();

export async function createFinanceClerkSessionCookie(): Promise<string> {
  const username = `finance.${Date.now()}@test.local`;
  const passwordHash = await AuthService.hashPasswordForStorage("Finance_Test!123");
  const cookieName = loadEnv().SESSION_COOKIE_NAME;

  const keys = [
    PermissionKeys.invoicesRead,
    PermissionKeys.invoicesManage,
    PermissionKeys.budgetsRead,
    PermissionKeys.budgetsManage,
  ];
  const permissions = [];
  for (const permissionKey of keys) {
    const permission = await prisma.permission.upsert({
      where: { permissionKey },
      create: { permissionKey, description: "finance clerk test" },
      update: {},
    });
    permissions.push(permission);
  }

  const role = await prisma.role.create({
    data: {
      roleKey: `finance_clerk_${Date.now()}`,
      displayName: "Finance Clerk Test",
      rolePermissions: {
        create: permissions.map((p) => ({ permissionId: p.permissionId })),
      },
    },
  });

  const user = await prisma.user.create({
    data: {
      username,
      displayName: "Finance Clerk",
      passwordHash,
      userRoles: { create: { roleId: role.roleId } },
    },
  });

  const { hashSessionToken, generateSessionToken } = await import(
    "../../src/shared/auth/session-token.js"
  );
  const sessionToken = generateSessionToken();
  await prisma.session.create({
    data: {
      userId: user.userId,
      tokenHash: hashSessionToken(sessionToken),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    },
  });

  return `${cookieName}=${sessionToken}`;
}

export async function disconnectFinanceClerkTestDb(): Promise<void> {
  await prisma.$disconnect();
}
