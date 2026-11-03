#!/usr/bin/env node
/**
 * ITDMS full backup: PostgreSQL dump + storage manifest (+ optional storage archive).
 * Dev/staging use only until D17 approves production schedule and retention.
 *
 * Env:
 *   DATABASE_URL (required)
 *   BACKUP_DIR (default ./backups)
 *   STORAGE_ROOT (default ./apps/api/storage) — relative to repo root
 *   ITDMS_BACKUP_INCLUDE_STORAGE=1 — tar.gz storage tree alongside SQL
 */
import { createHash } from "node:crypto";
import { execSync, spawnSync } from "node:child_process";
import {
  createWriteStream,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createGzip } from "node:zlib";
import { pipeline } from "node:stream/promises";
import { createReadStream } from "node:fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");

const envPath = resolve(repoRoot, "apps/api/.env");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    if (process.env[key] === undefined) {
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  }
}

function log(event, fields = {}) {
  console.log(JSON.stringify({ ts: new Date().toISOString(), event, ...fields }));
}

function walkFiles(dir, base = dir) {
  if (!existsSync(dir)) {
    return [];
  }
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      out.push(...walkFiles(full, base));
    } else if (st.isFile()) {
      out.push({ path: relative(base, full).replace(/\\/g, "/"), sizeBytes: st.size });
    }
  }
  return out;
}

async function gzipFile(src, dest) {
  await pipeline(createReadStream(src), createGzip(), createWriteStream(dest));
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  log("backup_failed", { reason: "DATABASE_URL required" });
  process.exit(1);
}

const outDir = resolve(process.env.BACKUP_DIR ?? join(repoRoot, "backups"));
mkdirSync(outDir, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const sqlFile = join(outDir, `itdms-db-${stamp}.sql`);
const manifestFile = join(outDir, `itdms-manifest-${stamp}.json`);

function runPgDump(targetFile) {
  const hostOk = spawnSync("pg_dump", ["--version"], { encoding: "utf8" }).status === 0;
  if (hostOk && !process.env.ITDMS_PG_CONTAINER) {
    execSync(`pg_dump "${databaseUrl}" --no-owner --no-acl -f "${targetFile}"`, {
      stdio: "inherit",
    });
    return "host_pg_dump";
  }
  const container = process.env.ITDMS_PG_CONTAINER ?? "itdms-postgres";
    const url = new URL(databaseUrl.replace(/^postgresql:/, "http:"));
    const dbName = url.pathname.replace(/^\//, "").split("?")[0];
    const user = url.username;
    const r = spawnSync(
      "docker",
      [
        "exec",
        container,
        "pg_dump",
        "-U",
        user,
        "--no-owner",
        "--no-acl",
        dbName,
      ],
      { encoding: "buffer", maxBuffer: 512 * 1024 * 1024 },
    );
    if (r.status !== 0) {
      throw new Error(r.stderr?.toString() ?? "docker pg_dump failed");
    }
    writeFileSync(targetFile, r.stdout);
    return "docker_exec";
}

let pgDumpMode = "host";
if (spawnSync("pg_dump", ["--version"], { encoding: "utf8" }).status !== 0) {
  pgDumpMode = "docker";
  process.env.ITDMS_PG_CONTAINER = process.env.ITDMS_PG_CONTAINER ?? "itdms-postgres";
}

const storageRoot = resolve(process.env.STORAGE_ROOT ?? join(repoRoot, "apps/api/storage"));
const includeStorage = process.env.ITDMS_BACKUP_INCLUDE_STORAGE === "1";

const started = Date.now();
try {
  pgDumpMode = runPgDump(sqlFile);
} catch (err) {
  log("backup_failed", { reason: "pg_dump exited non-zero", detail: String(err) });
  process.exit(1);
}

const sqlStat = statSync(sqlFile);
const sqlHead = readFileSync(sqlFile, "utf8").slice(0, 4096);
if (!sqlHead.includes("PostgreSQL database dump")) {
  log("backup_failed", { reason: "dump file missing expected header" });
  process.exit(1);
}

const storageFiles = walkFiles(storageRoot);
const sampleDocs = storageFiles.slice(0, 20).map((f) => {
  const full = join(storageRoot, f.path);
  const buf = readFileSync(full);
  return {
    path: f.path,
    sizeBytes: f.sizeBytes,
    sha256: createHash("sha256").update(buf).digest("hex"),
  };
});

let storageArchive = null;
if (includeStorage && storageFiles.length > 0) {
  storageArchive = join(outDir, `itdms-storage-${stamp}.tar.gz`);
  // Windows-friendly: gzip SQL companion; storage uses tar if available else manifest-only note
  const tar = spawnSync(
    "tar",
    ["-czf", storageArchive, "-C", storageRoot, "."],
    { encoding: "utf8" },
  );
  if (tar.status !== 0) {
    storageArchive = null;
    log("storage_archive_skipped", {
      reason: "tar unavailable or failed — manifest lists files; copy STORAGE_ROOT manually",
    });
  }
}

const manifest = {
  version: 1,
  createdAt: new Date().toISOString(),
  databaseDump: {
    file: relative(repoRoot, sqlFile).replace(/\\/g, "/"),
    sizeBytes: sqlStat.size,
  },
  storageRoot: relative(repoRoot, storageRoot).replace(/\\/g, "/"),
  storageFileCount: storageFiles.length,
  storageTotalBytes: storageFiles.reduce((n, f) => n + f.sizeBytes, 0),
  storageSampleSha256: sampleDocs,
  storageArchive: storageArchive
    ? relative(repoRoot, storageArchive).replace(/\\/g, "/")
    : null,
  consistencyNote:
    "DB and files are not a single point-in-time unless captured quiescent or together; restore must reconcile orphaned/missing files.",
  retentionPolicy:
    "Client Wave 2 — retain latest ITDMS_BACKUP_RETAIN_LOCAL manifest sets on system (default 2); copy older sets to external drive manually.",
};

writeFileSync(manifestFile, JSON.stringify(manifest, null, 2));

// Optional compressed SQL for offsite transfer
const gzSql = `${sqlFile}.gz`;
await gzipFile(sqlFile, gzSql);

log("backup_complete", {
  durationMs: Date.now() - started,
  pgDumpMode,
  sqlFile: manifest.databaseDump.file,
  manifestFile: relative(repoRoot, manifestFile).replace(/\\/g, "/"),
  sqlGzip: relative(repoRoot, gzSql).replace(/\\/g, "/"),
  storageFileCount: manifest.storageFileCount,
});

const retainLocal = Number(process.env.ITDMS_BACKUP_RETAIN_LOCAL ?? "2");
if (Number.isFinite(retainLocal) && retainLocal >= 2) {
  const entries = readdirSync(outDir)
    .filter((n) => n.startsWith("itdms-manifest-") && n.endsWith(".json"))
    .map((n) => ({ name: n, mtime: statSync(join(outDir, n)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime);
  const toRemove = entries.slice(retainLocal);
  for (const entry of toRemove) {
    const stampPart = entry.name.replace("itdms-manifest-", "").replace(".json", "");
    for (const prefix of ["itdms-manifest-", "itdms-db-", "itdms-storage-"]) {
      for (const file of readdirSync(outDir)) {
        if (file.startsWith(prefix + stampPart)) {
          try {
            unlinkSync(join(outDir, file));
          } catch {
            // keep going — rotation best-effort
          }
        }
      }
    }
    log("backup_rotation_pruned", { manifest: entry.name, retainLocal });
  }
}
