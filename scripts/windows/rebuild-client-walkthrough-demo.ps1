# Rebuild itdms_dev for client walkthrough (backup -> purge -> seed).
$ErrorActionPreference = "Stop"
$root = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$api = Join-Path $root "apps\api"

if (-not (Test-Path (Join-Path $api ".env"))) {
  Write-Error "Missing apps/api/.env"
}

$envContent = Get-Content (Join-Path $api ".env") -Raw
if ($envContent -notmatch "itdms_dev") {
  Write-Error "apps/api/.env must point at itdms_dev"
}

Push-Location $root
try {
  $env:DATABASE_URL = "postgresql://itdms:itdms_dev_password@127.0.0.1:5433/itdms_dev?schema=public"
  Write-Host "Step 1/3 — backup itdms_dev..."
  node scripts/backup-itdms.mjs
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

  Push-Location $api
  $env:DATABASE_URL = "postgresql://itdms:itdms_dev_password@127.0.0.1:5433/itdms_dev?schema=public"
  $env:PURGE_BUSINESS_DOMAIN_CONFIRM = "itdms_dev"
  Write-Host "Step 2/3 — purge business domain (dev only)..."
  npx tsx prisma/purge-itdms-dev-business-domain.ts
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

  $env:ITDMS_API_URL = "http://127.0.0.1:3000"
  Write-Host "Step 3/3 — seed walkthrough via API..."
  npx tsx prisma/seed-client-walkthrough.ts
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  Write-Host "Client walkthrough dataset ready on http://127.0.0.1:3011"
} finally {
  Pop-Location
  Pop-Location
}
