#!/usr/bin/env node
/** @deprecated Use scripts/backup-itdms.mjs — kept for compatibility */
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const script = resolve(__dirname, "backup-itdms.mjs");
const r = spawnSync(process.execPath, [script], { stdio: "inherit", env: process.env });
process.exit(r.status ?? 1);
