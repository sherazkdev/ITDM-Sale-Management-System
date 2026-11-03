import type { PrismaClient } from "@prisma/client";

export class AuthRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findUserByUsername(username: string) {
    return this.prisma.user.findUnique({
      where: { username },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: { include: { permission: true } },
              },
            },
          },
        },
      },
    });
  }

  findUserById(userId: bigint) {
    return this.prisma.user.findUnique({
      where: { userId },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: { include: { permission: true } },
              },
            },
          },
        },
      },
    });
  }

  createSession(data: {
    userId: bigint;
    tokenHash: string;
    expiresAt: Date;
    ipAddress?: string;
    userAgent?: string;
  }) {
    return this.prisma.session.create({ data });
  }

  findActiveSessionByTokenHash(tokenHash: string) {
    return this.prisma.session.findFirst({
      where: {
        tokenHash,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    });
  }

  revokeSession(sessionId: bigint) {
    return this.prisma.session.update({
      where: { sessionId },
      data: { revokedAt: new Date() },
    });
  }

  recordLoginAttempt(data: {
    userId?: bigint;
    usernameAttempt: string;
    success: boolean;
    ipAddress?: string;
  }) {
    return this.prisma.loginAttempt.create({ data });
  }
}
