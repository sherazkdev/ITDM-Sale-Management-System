# Encode client XLSX templates to base64 text files for Render Secret Files (never commit outputs).
$ErrorActionPreference = "Stop"
$root = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$src = Join-Path $root "storage\client-templates"
$outDir = Join-Path $root "deploy\free-tier\secrets"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

foreach ($name in @("Issuance.xlsx", "Return.xlsx")) {
  $bin = Join-Path $src $name
  if (-not (Test-Path $bin)) { throw "Missing $bin" }
  $bytes = [IO.File]::ReadAllBytes($bin)
  $b64 = [Convert]::ToBase64String($bytes)
  $outPath = Join-Path $outDir "$name.b64"
  [IO.File]::WriteAllText($outPath, $b64, [Text.UTF8Encoding]::new($false))
  $hash = (Get-FileHash $bin -Algorithm SHA256).Hash.ToLower()
  Write-Output "WROTE $outPath bytes=$($bytes.Length) sha256=$hash"
}
Write-Output "UPLOAD deploy/free-tier/secrets/*.xlsx.b64 to Render Secret Files (text), not git."