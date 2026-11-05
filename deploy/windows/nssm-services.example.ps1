# Example NSSM service registration — DO NOT RUN on dev machine without -WhatIf review.
# NSSM must be installed separately (offline zip). Not bundled with ITDMS.
param(
  [switch] $WhatIfOnly = $true,
  [string] $PackageRoot = "C:\ITDMS",
  [string] $NssmExe = "C:\Tools\nssm\nssm.exe"
)

$apiDir = Join-Path $PackageRoot "app\apps\api"
$webDir = Join-Path $PackageRoot "app\apps\web"
$logs = Join-Path $PackageRoot "logs"

$commands = @(
  "& `"$NssmExe`" install ITDMS-API `"$env:ProgramFiles\nodejs\node.exe`" `"dist\index.js`"",
  "& `"$NssmExe`" set ITDMS-API AppDirectory `"$apiDir`"",
  "& `"$NssmExe`" set ITDMS-API AppEnvironmentExtra NODE_ENV=production",
  "& `"$NssmExe`" set ITDMS-API AppStdout `"$logs\api-service.log`"",
  "& `"$NssmExe`" set ITDMS-API AppStderr `"$logs\api-service.err.log`"",
  "& `"$NssmExe`" set ITDMS-API AppExit Default Restart",
  "& `"$NssmExe`" install ITDMS-Web `"$env:ProgramFiles\nodejs\node.exe`" `"$webDir\node_modules\next\dist\bin\next`" `"start`" `"-p`" `"3011`""
)

Write-Host "NSSM example (client IT executes after PostgreSQL Windows service is automatic):"
$commands | ForEach-Object { Write-Host $_ }
if ($WhatIfOnly) {
  Write-Host "WhatIfOnly: no services registered."
}
