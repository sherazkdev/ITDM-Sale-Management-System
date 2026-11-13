import type { PrismaClient } from "@prisma/client";

/** Users on the protected Administrator role (`admin`) — client Super Admin recipients. */
export async function listSuperAdminUserIds(prisma: PrismaClient): Promise<bigint[]> {
  const users = await prisma.user.findMany({
    where: {
      isActive: true,
      isLocked: false,
      userRoles: {
        some: {
          role: { roleKey: "admin", isActive: true },
        },
      },
    },
    select: { userId: true },
  });
  return users.map((u) => u.userId);
}
