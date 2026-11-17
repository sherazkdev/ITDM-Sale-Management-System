# Start or verify E2E API (:3020) and production web (:3021) against itdms_e2e.
param(
  [string] $RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path,
  [switch] $SkipWebBuild
)

$ErrorActionPreference = "Stop"
$apiPort = if ($env:ITDMS_E2E_API_PORT) { $env:ITDMS_E2E_API_PORT } else { "3020" }
$webPort = if ($env:ITDMS_E2E_WEB_PORT) { $env:ITDMS_E2E_WEB_PORT } else { "3021" }
$apiBase = "http://127.0.0.1:$apiPort"
$webOrigin = "http://127.0.0.1:$webPort"
$e2eDb = "postgresql://itdms:itdms_dev_password@127.0.0.1:5433/itdms_e2e?schema=public"

& (Join-Path $PSScriptRoot "prepare-e2e-database.ps1") | Out-Null

function Test-Ready($url) {
  try {
    $r = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 5
    return $r.StatusCode -eq 200
  } catch {
    return $false
  }
}

$apiReady = Test-Ready "$apiBase/api/v1/health/ready"
if (-not $apiReady) {
  Write-Host "Starting E2E API on port $apiPort..."
  $apiDir = Join-Path $RepoRoot "apps\api"
  if (-not (Test-Path (Join-Path $apiDir "dist\index.js"))) {
    Push-Location $apiDir
  try { npm run build } finally { Pop-Location }
  }
  $saved = @{
    NODE_ENV = $env:NODE_ENV; PORT = $env:PORT; DATABASE_URL = $env:DATABASE_URL
    LOG_LEVEL = $env:LOG_LEVEL; SESSION_SECRET = $env:SESSION_SECRET
    ITDMS_API_RATE_LIMIT_MAX = $env:ITDMS_API_RATE_LIMIT_MAX
    ITDMS_ISSUANCE_TEMPLATE_PATH = $env:ITDMS_ISSUANCE_TEMPLATE_PATH
    ITDMS_RETURN_TEMPLATE_PATH = $env:ITDMS_RETURN_TEMPLATE_PATH
  }
  $env:NODE_ENV = "development"
  $env:PORT = $apiPort
  $env:DATABASE_URL = $e2eDb
  $env:LOG_LEVEL = "warn"
  $env:SESSION_SECRET = "e2e-session-secret-min-16-chars"
  $env:ITDMS_API_RATE_LIMIT_MAX = "5000"
  $templateRoot = Join-Path $RepoRoot "storage\client-templates"
  if (Test-Path (Join-Path $templateRoot "Issuance.xlsx")) {
    $env:ITDMS_ISSUANCE_TEMPLATE_PATH = Join-Path $templateRoot "Issuance.xlsx"
    $env:ITDMS_RETURN_TEMPLATE_PATH = Join-Path $templateRoot "Return.xlsx"
  }
  Start-Process -FilePath "node" -ArgumentList "dist/index.js" -WorkingDirectory $apiDir -WindowStyle Hidden | Out-Null
  foreach ($key in $saved.Keys) {
    if ($null -eq $saved[$key]) { Remove-Item "Env:$key" -ErrorAction SilentlyContinue }
    else { Set-Item -Path "Env:$key" -Value $saved[$key] }
  }
  $env:WAIT_HTTP_URL = "$apiBase/api/v1/health/ready"
  node (Join-Path $RepoRoot "scripts\windows\wait-http-ready.mjs")
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
} else {
  node (Join-Path $RepoRoot "scripts\windows\verify-api-database-target.mjs")
  if ($LASTEXITCODE -ne 0) {
    Write-Warning "API on :$apiPort is healthy but DATABASE_URL may not be itdms_e2e — restart API with isolated DB before write E2E."
  }
}

$webReady = Test-Ready "$webOrigin/login"
if (-not $webReady) {
  if (-not $SkipWebBuild) {
    Push-Location (Join-Path $RepoRoot "apps\web")
    try { npm run build } finally { Pop-Location }
  }
  Write-Host "Starting E2E web on port $webPort..."
  $webDir = Join-Path $RepoRoot "apps\web"
  $savedWeb = $env:ITDMS_API_URL
  $webLog = Join-Path $RepoRoot "docs\release\_tmp_e2e_web_server.log"
  Start-Process -FilePath "cmd.exe" -ArgumentList "/c", "set ITDMS_API_URL=$apiBase&& npm exec -- next start -p $webPort > `"$webLog`" 2>&1" -WorkingDirectory $webDir -WindowStyle Hidden | Out-Null
  if ($null -eq $savedWeb) { Remove-Item Env:ITDMS_API_URL -ErrorAction SilentlyContinue }
  else { $env:ITDMS_API_URL = $savedWeb }
  $env:WAIT_HTTP_URL = "$webOrigin/login"
  node (Join-Path $RepoRoot "scripts\windows\wait-http-ready.mjs")
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

Write-Host "E2E_STACK_READY api=$apiBase web=$webOrigin db=itdms_e2e"