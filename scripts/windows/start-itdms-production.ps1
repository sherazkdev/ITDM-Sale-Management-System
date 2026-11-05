# Start ITDMS production API + Web from packaged layout. No Windows service registration.
param(
  [string] $PackageRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..\rehearsal\offline-pack")).Path,
  [string] $ApiEnvFile = "",
  [int] $ApiPort = 3010,
  [int] $WebPort = 3012
)

$ErrorActionPreference = "Stop"
$appRoot = Join-Path $PackageRoot "app"
$logs = Join-Path $PackageRoot "logs"
New-Item -ItemType Directory -Force -Path $logs | Out-Null

if (-not $ApiEnvFile) {
  $ApiEnvFile = Join-Path $PackageRoot "config\api.env"
}
if (-not (Test-Path $ApiEnvFile)) {
  Write-Error "Missing api env: $ApiEnvFile"
}

Get-Content $ApiEnvFile | ForEach-Object {
  $t = $_.Trim()
  if (-not $t -or $t.StartsWith("#")) { return }
  $i = $t.IndexOf("=")
  if ($i -lt 1) { return }
  $k = $t.Substring(0, $i).Trim()
  $v = $t.Substring($i + 1).Trim().Trim('"').Trim("'")
  $v = $v -replace "REHEARSAL_ROOT", $PackageRoot
  Set-Item -Path "env:$k" -Value $v
}

$env:PORT = "$ApiPort"
$env:NODE_ENV = "production"

$apiPidFile = Join-Path $logs "itdms-api.pid"
$webPidFile = Join-Path $logs "itdms-web.pid"
if (Test-Path $apiPidFile) {
  $old = Get-Content $apiPidFile -ErrorAction SilentlyContinue
  if ($old -and (Get-Process -Id $old -ErrorAction SilentlyContinue)) {
    Write-Error "API already running PID $old — run stop-itdms-production.ps1 first"
  }
}

& (Join-Path $PSScriptRoot "wait-postgres.ps1") -Port 5433

$apiLog = Join-Path $logs "api.stdout.log"
$apiErr = Join-Path $logs "api.stderr.log"
$apiProc = Start-Process -FilePath "node" -ArgumentList "dist/index.js" `
  -WorkingDirectory (Join-Path $appRoot "apps\api") `
  -RedirectStandardOutput $apiLog -RedirectStandardError $apiErr -PassThru -WindowStyle Hidden
$apiProc.Id | Set-Content $apiPidFile

Start-Sleep -Seconds 2
$ready = $null
for ($i = 0; $i -lt 20; $i++) {
  try {
    $ready = Invoke-RestMethod "http://127.0.0.1:${ApiPort}/api/v1/health/ready" -TimeoutSec 5
    if ($ready.success) { break }
  } catch {
    Start-Sleep -Seconds 1
  }
}
if (-not $ready.success) { throw "API health failed after wait" }

$webEnvPath = Join-Path $PackageRoot "config\web.env.local"
if (Test-Path $webEnvPath) {
  Get-Content $webEnvPath | ForEach-Object {
    if ($_ -match "^\s*ITDMS_API_URL=") {
      $env:ITDMS_API_URL = ($_ -split "=", 2)[1].Trim().Trim('"')
    }
  }
} else {
  $env:ITDMS_API_URL = "http://127.0.0.1:${ApiPort}"
}
$env:PORT = "$WebPort"
$webLog = Join-Path $logs "web.stdout.log"
$webErr = Join-Path $logs "web.stderr.log"
$webProc = Start-Process -FilePath "cmd.exe" -ArgumentList "/c", "npx", "next", "start", "-p", "$WebPort" `
  -WorkingDirectory (Join-Path $appRoot "apps\web") `
  -RedirectStandardOutput $webLog -RedirectStandardError $webErr -PassThru -WindowStyle Hidden
$webProc.Id | Set-Content $webPidFile

Write-Host "API PID $($apiProc.Id) port $ApiPort | Web PID $($webProc.Id) port $WebPort"
Write-Host "Browser: http://127.0.0.1:${WebPort}"
