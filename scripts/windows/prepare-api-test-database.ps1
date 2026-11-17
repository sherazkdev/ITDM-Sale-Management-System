# Prepare isolated API Vitest database (itdms_test): create → migrate → seed.
param(
  [string] $RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path,
  [string] $DbName = $(if ($env:TEST_DB_NAME) { $env:TEST_DB_NAME } else { "itdms_test" })
)

$ErrorActionPreference = "Stop"
if ($DbName -match "itdms_dev|itdms_staging|itdms_e2e") {
  Write-Error "Refusing to prepare API test database named '$DbName' (use itdms_test only)."
}

& (Join-Path $PSScriptRoot "wait-postgres.ps1") | Out-Null

$adminUrl = if ($env:ADMIN_DATABASE_URL) {
  $env:ADMIN_DATABASE_URL
} else {
  "postgresql://itdms:itdms_dev_password@127.0.0.1:5433/postgres?schema=public"
}
$env:ADMIN_DATABASE_URL = $adminUrl
$savedDbUrl = $env:DATABASE_URL
Remove-Item Env:DATABASE_URL -ErrorAction SilentlyContinue
$env:WAIT_DATABASE_URL = $adminUrl
node (Join-Path $RepoRoot "scripts\windows\wait-database-ready.mjs")
if ($null -ne $savedDbUrl) { $env:DATABASE_URL = $savedDbUrl }
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$env:WAIT_DATABASE_URL = $adminUrl
$createSql = "SELECT 1 FROM pg_database WHERE datname = '$DbName'"
# ensure DB exists via node helper pattern from e2e
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

Write-Host "API_TEST_DATABASE_READY=$DbName"
Write-Host "DATABASE_URL=$dbUrl"