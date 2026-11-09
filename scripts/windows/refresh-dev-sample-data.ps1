# Refresh itdms_dev: remove test junk, load realistic departments/employees.
# Requires Docker Postgres and apps/api/.env pointing at itdms_dev.

$ErrorActionPreference = "Stop"
$root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$api = Join-Path $root "apps\api"

if (-not (Test-Path (Join-Path $api ".env"))) {
  Write-Error "Missing apps/api/.env — copy from .env.example first."
}

Push-Location $api
try {
  Write-Host "Purging dummy data and seeding sample employees on itdms_dev..."
  npx tsx prisma/refresh-dev-sample-data.ts
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  Write-Host "Done. Log in as admin.dev and open /employees."
} finally {
  Pop-Location
}
