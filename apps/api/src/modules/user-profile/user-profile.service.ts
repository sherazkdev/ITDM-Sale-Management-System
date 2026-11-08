import type { PrismaClient } from "@prisma/client";
import type { z } from "zod";
import type { AuditService } from "../../shared/audit/audit.service.js";
import { hashPassword, verifyPassword } from "../../shared/auth/password.js";
import { AppError } from "../../shared/errors/app-error.js";
import { ErrorCodes } from "../../shared/errors/error-codes.js";
import type { AvatarStorageService } from "../../shared/storage/avatar-storage.js";
import type { changePasswordSchema, updateProfileSchema } from "./user-profile.schema.js";

type UpdateProfile = z.infer<typeof updateProfileSchema>;
type ChangePassword = z.infer<typeof changePasswordSchema>;

export class UserProfileService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly audit: AuditService,
    private readonly avatars: AvatarStorageService,
  ) {}

  async getProfile(userId: bigint) {
    const user = await this.prisma.user.findUnique({
      where: { userId },
      include: { employee: true },
    });
    if (!user) throw new AppError(ErrorCodes.NOT_FOUND, "User not found", 404);
    const { passwordHash: _p, ...safe } = user;
    return {
      ...safe,
      jobTitle: user.employee?.designation ?? null,
      department: user.employee?.department ?? null,
      avatarUrl: user.avatarStorageKey ? `/api/v1/users/me/avatar` : null,
    };
  }

  async updateProfile(userId: bigint, body: UpdateProfile, requestId?: string) {
    const data: Record<string, unknown> = {};
    if (body.displayName !== undefined) data.displayName = body.displayName;
    if (body.email !== undefined) data.email = body.email;
    if (body.profilePhone !== undefined) data.profilePhone = body.profilePhone;
    if (body.profileLocation !== undefined) data.profileLocation = body.profileLocation;
    if (body.profileBio !== undefined) data.profileBio = body.profileBio;
    if (body.themePreferences !== undefined) {
      const existing = await this.prisma.user.findUnique({ where: { userId } });
      const prev =
        existing?.themePreferences && typeof existing.themePreferences === "object"
          ? (existing.themePreferences as Record<string, unknown>)
          : {};
      data.themePreferences = { ...prev, ...body.themePreferences };
    }
    const user = await this.prisma.user.update({
      where: { userId },
      data,
      include: { employee: true },
    });
    await this.audit.record({
      actorUserId: userId,
      action: "user.profile.update",
      targetType: "user",
      targetId: userId.toString(),
      result: "success",
      requestId,
    });
    const { passwordHash: _p, ...safe } = user;
    return {
      ...safe,
      jobTitle: user.employee?.designation ?? null,
      department: user.employee?.department ?? null,
      avatarUrl: user.avatarStorageKey ? `/api/v1/users/me/avatar` : null,
    };
  }

  async changePassword(userId: bigint, body: ChangePassword, requestId?: string) {
    const user = await this.prisma.user.findUnique({ where: { userId } });
    if (!user) throw new AppError(ErrorCodes.NOT_FOUND, "User not found", 404);
    const ok = await verifyPassword(body.currentPassword, user.passwordHash);
    if (!ok) {
      throw new AppError(ErrorCodes.UNAUTHORIZED, "Current password is incorrect", 401);
    }
    const passwordHash = await hashPassword(body.newPassword);
    await this.prisma.user.update({
      where: { userId },
      data: { passwordHash, passwordChangedAt: new Date() },
    });
    await this.audit.record({
      actorUserId: userId,
      action: "user.password.change",
      targetType: "user",
      targetId: userId.toString(),
      result: "success",
      requestId,
    });
    return { changed: true };
  }

  async uploadAvatar(userId: bigint, buffer: Buffer, mimeType: string, requestId?: string) {
    const user = await this.prisma.user.findUnique({ where: { userId } });
    if (!user) throw new AppError(ErrorCodes.NOT_FOUND, "User not found", 404);
    const storageKey = await this.avatars.storeUserAvatar(userId, buffer, mimeType);
    await this.avatars.deleteIfExists(user.avatarStorageKey);
    await this.prisma.user.update({
      where: { userId },
      data: { avatarStorageKey: storageKey },
    });
    await this.audit.record({
      actorUserId: userId,
      action: "user.avatar.update",
      targetType: "user",
      targetId: userId.toString(),
      result: "success",
      requestId,
    });
    return { avatarUrl: "/api/v1/users/me/avatar" };
  }

  async readAvatar(userId: bigint) {
    const user = await this.prisma.user.findUnique({ where: { userId } });
    if (!user?.avatarStorageKey) {
      throw new AppError(ErrorCodes.NOT_FOUND, "Avatar not found", 404);
    }
    return this.avatars.read(user.avatarStorageKey);
  }
}
