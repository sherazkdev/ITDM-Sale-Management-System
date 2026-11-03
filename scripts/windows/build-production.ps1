# Build ITDMS for production on Windows. Does NOT reset the database or start services.
param(
  [string] $RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path,
  [switch] $RunMigrations,
  [string] $ApiEnvFile = ""
)

$ErrorActionPreference = "Stop"
Set-Location $RepoRoot

Write-Host "Installing dependencies (npm ci)..."
npm ci

Write-Host "Building API and Web..."
npm run build

if ($RunMigrations) {
  if (-not $ApiEnvFile) {
    Write-Error "RunMigrations requires -ApiEnvFile pointing to apps/api/.env (DATABASE_URL must target the intended database)."
  }
  if (-not (Test-Path $ApiEnvFile)) {
    Write-Error "ApiEnvFile not found: $ApiEnvFile"
  }
  Write-Host "Applying Prisma migrations (migrate deploy) — no data reset."
  Push-Location (Join-Path $RepoRoot "apps\api")
  $envContent = Get-Content $ApiEnvFile | Where-Object { $_ -match "^\s*DATABASE_URL=" }
  if (-not $envContent) { Pop-Location; throw "DATABASE_URL not found in $ApiEnvFile" }
  $pair = ($envContent[0] -split "=", 2)
  $env:DATABASE_URL = $pair[1].Trim().Trim('"').Trim("'")
  npx prisma migrate deploy
  Pop-Location
}

Write-Host "Production build complete. Start API with: node apps/api/dist/index.js"
Write-Host "Start Web with: npm run start --workspace=@itdms/web (after apps/web/.env.local is configured)"
