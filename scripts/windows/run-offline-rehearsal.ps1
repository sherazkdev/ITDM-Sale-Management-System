# Wave 6 isolated offline production rehearsal (dev machine — NOT client PC).
param(
  [string] $RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path,
  [string] $PackageRoot = (Join-Path $RepoRoot "rehearsal\offline-pack"),
  [switch] $SkipAssemble,
  [switch] $SkipBuildPackage
)

$ErrorActionPreference = "Stop"
Set-Location $RepoRoot

$env:ADMIN_DATABASE_URL = "postgresql://itdms:itdms_dev_password@127.0.0.1:5433/postgres?schema=public"

if (-not $SkipAssemble) {
  & (Join-Path $PSScriptRoot "assemble-offline-package.ps1") -RepoRoot $RepoRoot -PackageRoot $PackageRoot -SkipBuild:$SkipBuildPackage
}

$rehearsalSecret = $env:REHEARSAL_SESSION_SECRET
if (-not $rehearsalSecret -or $rehearsalSecret.Length -lt 32) {
  $rehearsalSecret = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 40 | ForEach-Object { [char]$_ })
}
$dbPass = $env:REHEARSAL_DB_PASSWORD
if (-not $dbPass) {
  # Isolated rehearsal on engineering Docker Postgres (compose) — not production credentials.
  if ($env:ADMIN_DATABASE_URL -match "itdms_dev_password") {
    $dbPass = "itdms_dev_password"
  } else {
    $dbPass = "Rehearsal_Isolated_Only_" + (Get-Random)
  }
}

$configDir = Join-Path $PackageRoot "config"
$apiEnv = Join-Path $configDir "api.env"
$template = Get-Content (Join-Path $RepoRoot "deploy\windows\env.rehearsal.example") -Raw
$template = $template -replace "REHEARSAL_ROOT", ($PackageRoot -replace "\\", "/")
$template = $template -replace "REHEARSAL_DB_PASSWORD", $dbPass
$template = $template -replace "REHEARSAL_REPLACE_WITH_32_PLUS_RANDOM_CHARS", $rehearsalSecret
Set-Content -Path $apiEnv -Value $template -NoNewline

$webEnv = Join-Path $configDir "web.env.local"
@"
ITDMS_API_URL=http://127.0.0.1:3010
ITDMS_SESSION_COOKIE_NAME=itdms_session
"@ | Set-Content $webEnv

node (Join-Path $RepoRoot "scripts\windows\ensure-rehearsal-database.mjs")

Push-Location (Join-Path $PackageRoot "app\apps\api")
Get-Content $apiEnv | ForEach-Object {
  if ($_ -match "^\s*DATABASE_URL=") {
    $env:DATABASE_URL = ($_ -split "=", 2)[1].Trim().Trim('"')
  }
}
npx prisma migrate deploy
$seedUser = if ($env:REHEARSAL_SEED_USER) { $env:REHEARSAL_SEED_USER } else { "rehearsal.admin" }
$seedPass = if ($env:REHEARSAL_SEED_PASSWORD) { $env:REHEARSAL_SEED_PASSWORD } else { "Rehearsal-W6B-Local-Verify-Only!" }
$env:SEED_ADMIN_USERNAME = $seedUser
$env:SEED_ADMIN_PASSWORD = $seedPass
npx prisma db seed 2>&1 | Out-Host
Remove-Item Env:SEED_ADMIN_USERNAME -ErrorAction SilentlyContinue
Remove-Item Env:SEED_ADMIN_PASSWORD -ErrorAction SilentlyContinue
Pop-Location

& (Join-Path $PSScriptRoot "start-itdms-production.ps1") -PackageRoot $PackageRoot -ApiEnvFile $apiEnv

$env:ITDMS_API_URL = "http://127.0.0.1:3010"
$smokeUser = $seedUser
$smokePass = $seedPass
$env:ITDMS_SMOKE_USER = $smokeUser
$env:ITDMS_SMOKE_PASSWORD = $smokePass
node (Join-Path $RepoRoot "scripts\windows\verify-wave5-report-exports.mjs")

Write-Host "Rehearsal stack running on http://127.0.0.1:3012 — stop with stop-itdms-production.ps1"
Write-Host "REHEARSAL_ADMIN_USER=$seedUser"
Write-Host "REHEARSAL_ADMIN_PASSWORD=$seedPass"
