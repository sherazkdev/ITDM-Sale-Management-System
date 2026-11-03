import { createHash, randomBytes } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { AppError } from "../errors/app-error.js";
import { ErrorCodes } from "../errors/error-codes.js";

const ALLOWED_MIME = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "text/plain",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

export function sanitizeFileName(original: string): string {
  const base = path.basename(original).replace(/[^\w.\-()+ ]/g, "_");
  return base.slice(0, 200) || "upload.bin";
}

export class FileStorageService {
  constructor(private readonly storageRoot: string) {}

  private resolveKey(storageKey: string): string {
    if (storageKey.includes("\0")) {
      throw new AppError(ErrorCodes.FORBIDDEN, "Invalid storage path", 403);
    }
    const normalized = path.normalize(storageKey.replace(/\\/g, "/"));
    if (normalized.split(path.sep).includes("..")) {
      throw new AppError(ErrorCodes.FORBIDDEN, "Invalid storage path", 403);
    }
    const full = path.resolve(this.storageRoot, normalized);
    const root = path.resolve(this.storageRoot);
    if (!full.startsWith(root + path.sep) && full !== root) {
      throw new AppError(ErrorCodes.FORBIDDEN, "Invalid storage path", 403);
    }
    return full;
  }

  async store(input: {
    originalFileName: string;
    mimeType: string;
    buffer: Buffer;
  }): Promise<{ storageKey: string; sha256: string; sizeBytes: number }> {
    if (!ALLOWED_MIME.has(input.mimeType)) {
      throw new AppError(ErrorCodes.VALIDATION_ERROR, "File type not allowed", 422);
    }
    if (input.buffer.length > 10 * 1024 * 1024) {
      throw new AppError(ErrorCodes.VALIDATION_ERROR, "File exceeds 10MB limit", 422);
    }
    const sha256 = createHash("sha256").update(input.buffer).digest("hex");
    const storageKey = path
      .join(
        "private",
        new Date().toISOString().slice(0, 10),
        `${randomBytes(16).toString("hex")}-${sanitizeFileName(input.originalFileName)}`,
      )
      .replace(/\\/g, "/");
    const fullPath = this.resolveKey(storageKey);
    await mkdir(path.dirname(fullPath), { recursive: true });
    await writeFile(fullPath, input.buffer);
    return { storageKey, sha256, sizeBytes: input.buffer.length };
  }

  async read(storageKey: string): Promise<Buffer> {
    return readFile(this.resolveKey(storageKey));
  }
}
