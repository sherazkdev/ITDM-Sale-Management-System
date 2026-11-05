#!/usr/bin/env node
/**
 * SHA-256 manifest for offline package integrity (Wave 6).
 * Usage: node scripts/windows/write-package-manifest.mjs <packageRoot>
 */
import { createHash } from "node:crypto";
import { createReadStream, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const root = resolve(process.argv[2] ?? ".");
const includeRoots = [
  "apps/api/dist",
  "apps/api/prisma/migrations",
  "apps/web/.next",
  "package.json",
  "package-lock.json",
  "deploy/windows",
  "scripts/windows",
  "scripts/backup-itdms.mjs",
];

function sha256File(path) {
  return new Promise((res, rej) => {
    const h = createHash("sha256");
    const s = createReadStream(path);
    s.on("data", (c) => h.update(c));
    s.on("end", () => res(h.digest("hex")));
    s.on("error", rej);
  });
}

async function walk(rel) {
  const full = join(root, rel);
  try {
    const st = statSync(full);
    if (st.isFile()) {
      return [{ path: rel.replace(/\\/g, "/"), sha256: await sha256File(full), bytes: st.size }];
    }
  } catch {
    return [];
  }
  const out = [];
  for (const name of readdirSync(full)) {
    out.push(...(await walk(join(rel, name))));
  }
  return out;
}

const files = [];
for (const r of includeRoots) {
  files.push(...(await walk(r)));
}
files.sort((a, b) => a.path.localeCompare(b.path));

const manifest = {
  generatedAt: new Date().toISOString(),
  packageRoot: root,
  algorithm: "sha256",
  fileCount: files.length,
  files,
};

const outPath = join(root, "deploy", "windows", "PACKAGE-MANIFEST.json");
writeFileSync(outPath, JSON.stringify(manifest, null, 2));
console.log(JSON.stringify({ event: "package_manifest_written", path: relative(root, outPath), fileCount: files.length }));
