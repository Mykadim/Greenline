$sitePath = Join-Path $PSScriptRoot "index.html"

if (-not (Test-Path -LiteralPath $sitePath)) {
  Write-Error "Could not find index.html in $PSScriptRoot"
  exit 1
}

Start-Process -FilePath $sitePath
