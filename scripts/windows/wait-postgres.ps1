# Wait for PostgreSQL TCP port (Wave 6 production startup helper).
param(
  [string] $DbHost = "127.0.0.1",
  [int] $Port = 5433,
  [int] $TimeoutSeconds = 120
)
$deadline = (Get-Date).AddSeconds($TimeoutSeconds)
while ((Get-Date) -lt $deadline) {
  try {
    $c = New-Object System.Net.Sockets.TcpClient
    $c.Connect($DbHost, $Port)
    $c.Close()
    Write-Host "[OK] PostgreSQL port $Port reachable"
    exit 0
  } catch {
    Start-Sleep -Seconds 2
  }
}
Write-Error "PostgreSQL not reachable on ${DbHost}:${Port} within ${TimeoutSeconds}s"
exit 1
