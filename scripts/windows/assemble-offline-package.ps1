# Assemble offline-capable ITDMS package after production build (Wave 6).
# Does NOT modify itdms_dev, register services, or start production automatically.
param(
  [string] $RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path,
  [string] $PackageRoot = (Join-Path $RepoRoot "rehearsal\offline-pack"),
  [switch] $SkipBuild
)

$ErrorActionPreference = "Stop"
Set-Location $RepoRoot

if (-not $SkipBuild) {
  & (Join-Path $PSScriptRoot "build-production.ps1") -RepoRoot $RepoRoot
}

$appDest = Join-Path $PackageRoot "app"
$dataDest = Join-Path $PackageRoot "data"
$configDest = Join-Path $PackageRoot "config"
$logsDest = Join-Path $PackageRoot "logs"
$installDest = Join-Path $PackageRoot "install"
foreach ($d in @($appDest, $dataDest, $configDest, $logsDest, $installDest, (Join-Path $dataDest "storage\private"), (Join-Path $dataDest "backups"))) {
  New-Item -ItemType Directory -Force -Path $d | Out-Null
}

$robocopyArgs = @(
  $RepoRoot,
  $appDest,
  "/MIR",
  "/XD", "rehearsal", ".git", "node_modules\.cache", "apps\api\storage", "apps\api\storage-test", "apps\api\storage-staging",
  "backups", "backups-rotation-test", "apps\web\test-results", "apps\web\playwright-report", "apps\web\e2e\.auth",
  "/XF", ".env", ".env.local", "apps\api\.env", "apps\web\.env.local"
)
& robocopy @robocopyArgs /NFL /NDL /NJH /NJS /nc /ns /np | Out-Null
if ($LASTEXITCODE -ge 8) { throw "robocopy failed with exit $LASTEXITCODE" }

Copy-Item (Join-Path $RepoRoot "deploy\windows\*.example") $configDest -Force
Copy-Item (Join-Path $RepoRoot "scripts\windows\*.ps1") (Join-Path $installDest "scripts") -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force -Path (Join-Path $installDest "scripts") | Out-Null
Copy-Item (Join-Path $RepoRoot "scripts\windows\*") (Join-Path $installDest "scripts") -Force

node (Join-Path $RepoRoot "scripts\windows\write-package-manifest.mjs") $appDest

Write-Host "Package assembled at: $PackageRoot"
Write-Host "Configure: $configDest\env.rehearsal.example -> api.env (rehearsal) or production templates"
