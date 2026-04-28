$ErrorActionPreference = "Stop"

$pkg = Get-Content -Raw -Encoding UTF8 ".\package.json" | ConvertFrom-Json
$version = $pkg.version
if (-not $version) { $version = "0.0.0" }

$out = ".\release\fast-stocking-list-v$version-dev.zip"
if (-not (Test-Path ".\release")) { New-Item -ItemType Directory -Path ".\release" | Out-Null }

# Use built-in tar to create zip (Windows 10+)
$exclude = @(
  "node_modules",
  "dist",
  "release",
  ".git",
  ".cursor",
  "docs"
)

$items = Get-ChildItem -Force | Where-Object { $exclude -notcontains $_.Name }
if ($items.Count -eq 0) { throw "No files to pack." }

if (Test-Path $out) { Remove-Item $out -Force }

tar -a -c -f $out @($items.FullName)

Write-Host "Dev zip: $out"

