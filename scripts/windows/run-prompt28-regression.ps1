# Prompt #28 regression orchestration — sequential DB prep, API Vitest, then Playwright (no parallel DB mutation).
param(
  [string] $RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
)

$ErrorActionPreference = "Stop"

Write-Host "=== ITDMS Prompt #28 regression (local, no push) ==="

& (Join-Path $PSScriptRoot "prepare-api-test-database.ps1")
$env:DATABASE_URL = "postgresql://itdms:itdms_dev_password@127.0.0.1:5433/itdms_test?schema=public"
Push-Location (Join-Path $RepoRoot "apps\api")
try {
  npm run test
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
} finally {
  Pop-Location
}

& (Join-Path $PSScriptRoot "ensure-e2e-stack.ps1")
$env:WEB_ORIGIN = "http://127.0.0.1:3021"
$env:ITDMS_API_URL = "http://127.0.0.1:3020"
$env:ITDMS_E2E_EXTERNAL_STACK = "1"
Push-Location (Join-Path $RepoRoot "apps\web")
try {
  npm run test:e2e
  exit $LASTEXITCODE
} finally {
  Pop-Location
}