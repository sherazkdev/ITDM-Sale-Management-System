param(
  [string] $PackageRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..\rehearsal\offline-pack")).Path
)
$logs = Join-Path $PackageRoot "logs"
foreach ($name in @("itdms-api.pid", "itdms-web.pid")) {
  $f = Join-Path $logs $name
  if (-not (Test-Path $f)) { continue }
  $pid = Get-Content $f
  if ($pid) {
    Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
    Write-Host "Stopped PID $pid ($name)"
  }
  Remove-Item $f -Force -ErrorAction SilentlyContinue
}
