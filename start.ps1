param (
    [int]$Port = 5000
)

$PSScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $PSScriptRoot

if (-not (Test-Path "NexusServer.exe")) {
    Write-Host "Compiling NexusServer.exe..." -ForegroundColor Cyan
    & powershell -ExecutionPolicy Bypass -File .\build.ps1
}

Write-Host "Starting NexusFlow Server on http://localhost:$Port/ ..." -ForegroundColor Green
Write-Host "Public Site:      http://localhost:$Port/" -ForegroundColor Yellow
Write-Host "Admin Dashboard:  http://localhost:$Port/admin" -ForegroundColor Yellow
Write-Host "Source REST API:  http://localhost:$Port/api/content" -ForegroundColor Yellow

& .\NexusServer.exe $Port
