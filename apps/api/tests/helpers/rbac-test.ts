import { PrismaClient } from "@prisma/client";
import { AuthService } from "../../src/modules/auth/auth.service.js";
import { loadEnv } from "../../src/shared/config/env.js";
import { PermissionKeys } from "../../src/shared/auth/permissions.js";

const prisma = new PrismaClient();

export async function createReadOnlySessionCookie(): Promise<string> {
  const username = `readonly.${Date.now()}@test.local`;
  const passwordHash = await AuthService.hashPasswordForStorage("ReadOnly_Test!123");
  const cookieName = loadEnv().SESSION_COOKIE_NAME;

  const permission = await prisma.permission.upsert({
    where: { permissionKey: PermissionKeys.employeesRead },
    create: {
      permissionKey: PermissionKeys.employeesRead,
      description: "test read only",
    },
    update: {},
  });

  const role = await prisma.role.create({
    data: {
      roleKey: `readonly_${Date.now()}`,
      displayName: "Read Only Test",
      rolePermissions: { create: { permissionId: permission.permissionId } },
    },
  });

  const user = await prisma.user.create({
    data: {
      username,
      displayName: "Read Only",
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

export async function disconnectRbacTestDb(): Promise<void> {
  await prisma.$disconnect();
}
