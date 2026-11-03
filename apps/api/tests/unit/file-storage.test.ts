import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it, afterEach } from "vitest";
import { FileStorageService } from "../../src/shared/storage/file-storage.js";

describe("FileStorageService security", () => {
  let root = "";
  afterEach(async () => {
    if (root) {
      await rm(root, { recursive: true, force: true });
      root = "";
    }
  });

  it("rejects disallowed MIME types", async () => {
    root = await mkdtemp(path.join(tmpdir(), "itdms-store-"));
    const storage = new FileStorageService(root);
    await expect(
      storage.store({
        originalFileName: "evil.exe",
        mimeType: "application/x-msdownload",
        buffer: Buffer.from("MZ"),
      }),
    ).rejects.toMatchObject({ statusCode: 422 });
  });

  it("stores keys with forward slashes for cross-platform DB rows", async () => {
    root = await mkdtemp(path.join(tmpdir(), "itdms-store-"));
    const storage = new FileStorageService(root);
    const stored = await storage.store({
      originalFileName: "note.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("hello"),
    });
    expect(stored.storageKey).not.toContain("\\");
    expect(stored.storageKey).toMatch(/^private\/\d{4}-\d{2}-\d{2}\//);
    const readBack = await storage.read(stored.storageKey);
    expect(readBack.toString()).toBe("hello");
  });

  it("blocks path traversal on read", async () => {
    root = await mkdtemp(path.join(tmpdir(), "itdms-store-"));
    const storage = new FileStorageService(root);
    await expect(storage.read("../outside.txt")).rejects.toMatchObject({ statusCode: 403 });
  });
});
