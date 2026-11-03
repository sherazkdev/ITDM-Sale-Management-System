import { AppError } from "../../shared/errors/app-error.js";
import { ErrorCodes } from "../../shared/errors/error-codes.js";
import { hashPassword, verifyPassword } from "../../shared/auth/password.js";
import { generateSessionToken, hashSessionToken, legacyHashSessionToken } from "../../shared/auth/session-token.js";
import type { PermissionService } from "../../shared/auth/permission.service.js";
import type { AuthRepository } from "./auth.repository.js";

const SESSION_TTL_MS = 1000 * 60 * 60 * 8;

export class AuthService {
  constructor(
    private readonly repository: AuthRepository,
    private readonly permissionService: PermissionService,
  ) {}

  async login(input: {
    username: string;
    password: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<{ token: string; expiresAt: Date; user: { userId: bigint; username: string; displayName: string } }> {
    const user = await this.repository.findUserByUsername(input.username.trim());
    const genericError = new AppError(ErrorCodes.UNAUTHORIZED, "Invalid credentials", 401);

    if (!user || !user.isActive || user.isLocked) {
      await this.repository.recordLoginAttempt({
        userId: user?.userId,
        usernameAttempt: input.username,
        success: false,
        ipAddress: input.ipAddress,
      });
      throw genericError;
    }

    const ok = await verifyPassword(input.password, user.passwordHash);
    await this.repository.recordLoginAttempt({
      userId: user.userId,
      usernameAttempt: input.username,
      success: ok,
      ipAddress: input.ipAddress,
    });
    if (!ok) {
      throw genericError;
    }

    const token = generateSessionToken();
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
    await this.repository.createSession({
      userId: user.userId,
      tokenHash: hashSessionToken(token),
      expiresAt,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    });

    return {
      token,
      expiresAt,
      user: { userId: user.userId, username: user.username, displayName: user.displayName },
    };
  }

  async logout(token: string): Promise<void> {
    const session = await this.findSessionByToken(token);
    if (session) {
      await this.repository.revokeSession(session.sessionId);
    }
  }

  async resolvePrincipalFromToken(token: string) {
    const session = await this.findSessionByToken(token);
    if (!session) {
      return null;
    }
    return this.permissionService.getPrincipalForUserId(session.userId);
  }

  private async findSessionByToken(token: string) {
    const primary = hashSessionToken(token);
    const session = await this.repository.findActiveSessionByTokenHash(primary);
    if (session) {
      return session;
    }
    const legacy = legacyHashSessionToken(token);
    return this.repository.findActiveSessionByTokenHash(legacy);
  }

  static async hashPasswordForStorage(plain: string): Promise<string> {
    return hashPassword(plain);
  }
}
