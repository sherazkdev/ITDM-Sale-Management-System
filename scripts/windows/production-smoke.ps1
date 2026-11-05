param(
  [string] $PackageRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..\rehearsal\offline-pack")).Path,
  [int] $ApiPort = 3010
)
$ErrorActionPreference = "Stop"
$results = @()

function Test-Step($name, [scriptblock] $block) {
  try {
    & $block
    $script:results += [pscustomobject]@{ step = $name; status = "OK" }
    Write-Host "[OK] $name" -ForegroundColor Green
  } catch {
    $script:results += [pscustomobject]@{ step = $name; status = "FAIL"; detail = $_.Exception.Message }
    Write-Host "[FAIL] $name — $($_.Exception.Message)" -ForegroundColor Red
  }
}

Test-Step "health/ready" { 
  $r = Invoke-RestMethod "http://127.0.0.1:${ApiPort}/api/v1/health/ready" -TimeoutSec 10
  if (-not $r.success) { throw "not success" }
}
Test-Step "health/live" { 
  Invoke-RestMethod "http://127.0.0.1:${ApiPort}/api/v1/health/live" -TimeoutSec 5 | Out-Null
}

$results | Format-Table -AutoSize
if ($results.status -contains "FAIL") { exit 1 }
