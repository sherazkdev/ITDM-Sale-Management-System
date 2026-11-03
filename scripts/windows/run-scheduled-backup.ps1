# Wrapper for weekly ITDMS backup — operator must schedule via Task Scheduler separately.
# Does not delete data outside BACKUP_DIR rotation rules in backup-itdms.mjs.
param(
  [string] $RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path,
  [string] $EnvFile = "",
  [switch] $IncludeStorage
)

$ErrorActionPreference = "Stop"
Set-Location $RepoRoot

if ($EnvFile -and (Test-Path $EnvFile)) {
  Get-Content $EnvFile | ForEach-Object {
    $t = $_.Trim()
    if (-not $t -or $t.StartsWith("#")) { return }
    $i = $t.IndexOf("=")
    if ($i -lt 1) { return }
    $k = $t.Substring(0, $i).Trim()
    $v = $t.Substring($i + 1).Trim().Trim('"').Trim("'")
    if ($k -eq "DATABASE_URL" -or $k -eq "BACKUP_DIR" -or $k -eq "STORAGE_ROOT" -or $k -eq "ITDMS_BACKUP_RETAIN_LOCAL") {
      Set-Item -Path "env:$k" -Value $v
    }
  }
}

if (-not $env:DATABASE_URL) {
  Write-Error "DATABASE_URL not set. Pass -EnvFile with DATABASE_URL or set environment before running."
}
if (-not $env:BACKUP_DIR) {
  $env:BACKUP_DIR = Join-Path $RepoRoot "backups"
  Write-Host "BACKUP_DIR default: $($env:BACKUP_DIR)"
}
if ($IncludeStorage) {
  $env:ITDMS_BACKUP_INCLUDE_STORAGE = "1"
}

node (Join-Path $RepoRoot "scripts\backup-itdms.mjs")
exit $LASTEXITCODE
