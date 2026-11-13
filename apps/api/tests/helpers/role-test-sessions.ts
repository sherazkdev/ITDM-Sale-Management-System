import { PrismaClient } from "@prisma/client";
import { AuthService } from "../../src/modules/auth/auth.service.js";
import { loadEnv } from "../../src/shared/config/env.js";
import { PermissionKeys } from "../../src/shared/auth/permissions.js";

const prisma = new PrismaClient();

async function sessionForRole(roleKey: string, suffix: string): Promise<string> {
  const passwordHash = await AuthService.hashPasswordForStorage("Role_Test!123");
  const cookieName = loadEnv().SESSION_COOKIE_NAME;
  const role = await prisma.role.findUnique({ where: { roleKey } });
  if (!role) {
    throw new Error(`Role ${roleKey} missing — run seed`);
  }
  const username = `${roleKey}.${suffix}@test.local`;
  const user = await prisma.user.upsert({
    where: { username },
    create: {
      username,
      displayName: `${roleKey} test user`,
      passwordHash,
      userRoles: { create: { roleId: role.roleId } },
    },
    update: { passwordHash, isActive: true, isLocked: false },
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

export function loginAsManager() {
  return sessionForRole("manager", String(Date.now()));
}

export function loginAsItStaff() {
  return sessionForRole("it_staff", String(Date.now()));
}

export async function disconnectRoleTestDb(): Promise<void> {
  await prisma.$disconnect();
}

export const FinanceReadPermissions = [
  PermissionKeys.invoicesRead,
  PermissionKeys.budgetsRead,
] as const;
