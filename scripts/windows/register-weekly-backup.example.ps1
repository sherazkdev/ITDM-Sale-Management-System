# Documents Task Scheduler weekly backup — does NOT register unless -Register switch.
param(
  [switch] $Register,
  [string] $PackageRoot = "C:\ITDMS",
  [string] $TaskName = "ITDMS-Weekly-Backup",
  [string] $RunAsUser = $env:USERNAME
)

$script = Join-Path $PackageRoot "install\scripts\run-scheduled-backup.ps1"
$envFile = Join-Path $PackageRoot "config\api.env"
$action = "powershell.exe -NoProfile -ExecutionPolicy Bypass -File `"$script`" -EnvFile `"$envFile`" -IncludeStorage"

Write-Host "Weekly backup action:"
Write-Host $action
Write-Host "Prerequisites: pg_dump in PATH, BACKUP_DIR in api.env, D17 client approval"

if (-not $Register) {
  Write-Host "Pass -Register to create Task Scheduler entry (not run during Wave 6 prep)."
  exit 0
}

$trigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Sunday -At 2am
$act = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$script`" -EnvFile `"$envFile`" -IncludeStorage"
Register-ScheduledTask -TaskName $TaskName -Action $act -Trigger $trigger -User $RunAsUser -RunLevel Highest
Write-Host "Registered $TaskName"
