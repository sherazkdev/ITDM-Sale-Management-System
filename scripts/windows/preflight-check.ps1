# ITDMS Windows preflight — read-only checks. Does not install software or start services.
param(
  [string] $RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
)

$ErrorActionPreference = "Stop"
$fail = 0

function Warn($msg) { Write-Warning $msg }
function Ok($msg) { Write-Host "[OK] $msg" -ForegroundColor Green }
function Bad($msg) { Write-Host "[FAIL] $msg" -ForegroundColor Red; $script:fail++ }

Write-Host "ITDMS preflight — repo: $RepoRoot"

if (-not (Test-Path (Join-Path $RepoRoot "package.json"))) {
  Bad "Not an ITDMS repo root (missing package.json)"
  exit 1
}

try {
  $nodeVer = (node -v) -replace "^v", ""
  $major = [int]($nodeVer.Split(".")[0])
  if ($major -ge 20) { Ok "Node.js $nodeVer (>= 20)" } else { Bad "Node.js $nodeVer — require 20.x LTS or newer" }
} catch {
  Bad "Node.js not found in PATH"
}

try {
  npm -v | Out-Null
  Ok "npm available"
} catch {
  Bad "npm not found"
}

$apiEnvExample = Join-Path $RepoRoot "deploy\windows\env.api.production.example"
if (Test-Path $apiEnvExample) { Ok "Production env template present (deploy/windows)" } else { Warn "Missing deploy/windows/env.api.production.example" }

$pgDump = Get-Command pg_dump -ErrorAction SilentlyContinue
if ($pgDump) { Ok "pg_dump in PATH (backup scripts)" } else { Warn "pg_dump not in PATH — use PostgreSQL bin dir or ITDMS_PG_CONTAINER for backups" }

$apiEnv = Join-Path $RepoRoot "apps\api\.env"
if (Test-Path $apiEnv) {
  Ok "apps/api/.env exists (local)"
  $raw = Get-Content $apiEnv -Raw
  if ($raw -match "itdms_dev_password|ChangeMe_DevOnly") { Warn "Dev-like credentials detected in apps/api/.env — rotate before production" }
} else {
  Warn "apps/api/.env missing — copy from deploy/windows/env.api.production.example for production prep"
}

if ($fail -gt 0) {
  Write-Host "Preflight finished with $fail failure(s)." -ForegroundColor Red
  exit 1
}
Write-Host "Preflight passed (warnings are informational)." -ForegroundColor Green
exit 0
