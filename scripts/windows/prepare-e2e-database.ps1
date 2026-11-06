# Prepare isolated Playwright DB (itdms_e2e): create → migrate → seed.
# Never targets itdms_dev / itdms_staging. Does not drop or reset those databases.
param(
  [string] $RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path,
  [string] $DbName = $(if ($env:E2E_DB_NAME) { $env:E2E_DB_NAME } else { "itdms_e2e" })
)

$ErrorActionPreference = "Stop"
if ($DbName -match "itdms_dev|itdms_staging") {
  Write-Error "Refusing to prepare E2E database named '$DbName' (dev/staging protected)."
}

$adminUrl = if ($env:ADMIN_DATABASE_URL) {
  $env:ADMIN_DATABASE_URL
} else {
  "postgresql://itdms:itdms_dev_password@127.0.0.1:5433/postgres?schema=public"
}
$env:ADMIN_DATABASE_URL = $adminUrl
$env:E2E_DB_NAME = $DbName

node (Join-Path $RepoRoot "scripts\windows\ensure-e2e-database.mjs")

$dbUrl = "postgresql://itdms:itdms_dev_password@127.0.0.1:5433/${DbName}?schema=public"
$env:DATABASE_URL = $dbUrl
$env:SEED_ADMIN_USERNAME = "admin.dev"
$env:SEED_ADMIN_PASSWORD = "ChangeMe_DevOnly!"

Push-Location (Join-Path $RepoRoot "apps\api")
try {
  npx prisma migrate deploy
  npx prisma db seed
} finally {
  Pop-Location
  Remove-Item Env:SEED_ADMIN_USERNAME -ErrorAction SilentlyContinue
  Remove-Item Env:SEED_ADMIN_PASSWORD -ErrorAction SilentlyContinue
}

Write-Host "E2E_DATABASE_READY=$DbName"
Write-Host "DATABASE_URL=$dbUrl"
