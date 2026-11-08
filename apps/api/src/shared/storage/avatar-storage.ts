import { createHash } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { AppError } from "../errors/app-error.js";
import { ErrorCodes } from "../errors/error-codes.js";

const AVATAR_MIME: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

const MAGIC: Array<{ mime: string; prefix: Buffer }> = [
  { mime: "image/png", prefix: Buffer.from([0x89, 0x50, 0x4e, 0x47]) },
  { mime: "image/jpeg", prefix: Buffer.from([0xff, 0xd8, 0xff]) },
  { mime: "image/webp", prefix: Buffer.from("RIFF", "ascii") },
];

function detectImageMime(buffer: Buffer): string | null {
  for (const rule of MAGIC) {
    if (buffer.length >= rule.prefix.length && buffer.subarray(0, rule.prefix.length).equals(rule.prefix)) {
      if (rule.mime === "image/webp" && !buffer.subarray(8, 12).equals(Buffer.from("WEBP", "ascii"))) {
        continue;
      }
      return rule.mime;
    }
  }
  return null;
}

export class AvatarStorageService {
  constructor(private readonly storageRoot: string) {}

  private avatarsDir(): string {
    return path.join(this.storageRoot, "avatars");
  }

  private resolveKey(storageKey: string): string {
    const normalized = path.normalize(storageKey.replace(/\\/g, "/"));
    if (normalized.includes("..") || path.isAbsolute(normalized)) {
      throw new AppError(ErrorCodes.FORBIDDEN, "Invalid avatar path", 403);
    }
    const full = path.resolve(this.avatarsDir(), normalized);
    const root = path.resolve(this.avatarsDir());
    if (!full.startsWith(root + path.sep)) {
      throw new AppError(ErrorCodes.FORBIDDEN, "Invalid avatar path", 403);
    }
    return full;
  }

  async storeUserAvatar(userId: bigint, buffer: Buffer, declaredMime: string): Promise<string> {
    if (buffer.length > 2 * 1024 * 1024) {
      throw new AppError(ErrorCodes.VALIDATION_ERROR, "Avatar exceeds 2MB limit", 422);
    }
    const sniffed = detectImageMime(buffer);
    if (!sniffed || sniffed !== declaredMime || !AVATAR_MIME[sniffed]) {
      throw new AppError(ErrorCodes.VALIDATION_ERROR, "Only PNG, JPEG, or WEBP avatars are allowed", 422);
    }
    const ext = AVATAR_MIME[sniffed];
    const hash = createHash("sha256").update(buffer).digest("hex").slice(0, 16);
    const storageKey = `user-${userId.toString()}-${hash}.${ext}`;
    await mkdir(this.avatarsDir(), { recursive: true });
    await writeFile(this.resolveKey(storageKey), buffer);
    return storageKey;
  }

  async read(storageKey: string): Promise<{ buffer: Buffer; mimeType: string }> {
    const full = this.resolveKey(storageKey);
    const ext = path.extname(storageKey).toLowerCase();
    const mime =
      ext === ".png" ? "image/png" : ext === ".jpg" || ext === ".jpeg" ? "image/jpeg" : "image/webp";
    const { readFile } = await import("node:fs/promises");
    return { buffer: await readFile(full), mimeType: mime };
  }

  async deleteIfExists(storageKey: string | null | undefined): Promise<void> {
    if (!storageKey) return;
    try {
      await unlink(this.resolveKey(storageKey));
    } catch {
      /* ignore missing */
    }
  }
}
