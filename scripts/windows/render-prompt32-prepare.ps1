# Prepare Render env bundle + template integrity metadata (no secrets printed).
$ErrorActionPreference = "Stop"
$root = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$neonFile = Join-Path $root "deploy\free-tier\.env.neon.local"
$outFile = Join-Path $root "deploy\free-tier\.env.render.local"
$hashFile = Join-Path $root "deploy\free-tier\render-template-hashes.json"

if (-not (Test-Path $neonFile)) { throw "Missing $neonFile (Prompt #31)" }

$neon = @{}
Get-Content $neonFile | ForEach-Object {
  if ($_ -match '^\s*([^#=]+)=(.*)$') { $neon[$Matches[1].Trim()] = $Matches[2].Trim() }
}
if (-not $neon["DATABASE_URL_POOLED"]) { throw "DATABASE_URL_POOLED missing in .env.neon.local" }

$bytes = New-Object byte[] 48
[Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
$sessionSecret = [Convert]::ToBase64String($bytes)

$lines = @(
  "# gitignored — paste into Render Dashboard Environment (never commit)",
  "NODE_ENV=production",
  "ITDMS_STAGING_STRICT=1",
  "ITDMS_TRUST_PROXY=1",
  "HOST=0.0.0.0",
  "LOG_LEVEL=info",
  "NOTIFICATION_LEAD_DAYS=60",
  "STORAGE_ROOT=/tmp/itdms-storage",
  "DATABASE_URL=$($neon['DATABASE_URL_POOLED'])",
  "SESSION_SECRET=$sessionSecret",
  "ITDMS_ISSUANCE_TEMPLATE_PATH=/etc/secrets/Issuance.xlsx",
  "ITDMS_RETURN_TEMPLATE_PATH=/etc/secrets/Return.xlsx"
)

$lines | Set-Content $outFile -Encoding utf8

$issuance = Join-Path $root "storage\client-templates\Issuance.xlsx"
$ret = Join-Path $root "storage\client-templates\Return.xlsx"
$meta = @()
foreach ($pair in @(@("Issuance.xlsx", $issuance), @("Return.xlsx", $ret))) {
  $name, $path = $pair
  if (-not (Test-Path $path)) { throw "Missing template $path" }
  $hash = (Get-FileHash $path -Algorithm SHA256).Hash.ToLower()
  $size = (Get-Item $path).Length
  $meta += [ordered]@{ file = $name; bytes = $size; sha256 = $hash }
}
($meta | ConvertTo-Json -Depth 3) | Set-Content $hashFile -Encoding utf8

Write-Output "RENDER_ENV_BUNDLE=$outFile"
Write-Output "TEMPLATE_HASHES=$hashFile"
Write-Output "NOTE=Upload Issuance.xlsx and Return.xlsx via Render Secret Files; PORT is injected by Render."