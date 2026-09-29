param(
  [Parameter(Mandatory = $true)]
  [string]$OutputDirectory
)

$ErrorActionPreference = 'Stop'

if (-not $env:DATABASE_URL) {
  throw 'Defina DATABASE_URL antes de crear el respaldo.'
}

if (-not (Get-Command pg_dump -ErrorAction SilentlyContinue)) {
  throw 'No se encontró pg_dump. Instale PostgreSQL Client Tools.'
}

$resolvedOutput = [System.IO.Path]::GetFullPath($OutputDirectory)
New-Item -ItemType Directory -Path $resolvedOutput -Force | Out-Null
$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$backupPath = Join-Path $resolvedOutput "verduleria-$timestamp.dump"

& pg_dump --format=custom --no-owner --file $backupPath $env:DATABASE_URL
if ($LASTEXITCODE -ne 0) {
  throw "pg_dump terminó con código $LASTEXITCODE."
}

Write-Output "Respaldo creado: $backupPath"
