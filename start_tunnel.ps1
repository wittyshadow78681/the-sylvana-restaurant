param(
    [int]$AppPort = 5000
)

$PSScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $PSScriptRoot

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   THE SYLVANA RESTAURANT - PUBLIC CLOUDFLARE DEPLOY      " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Compile server binary if needed
if (-not (Test-Path "NexusServer.exe")) {
    Write-Host "Compiling NexusServer.exe..." -ForegroundColor Yellow
    & powershell -ExecutionPolicy Bypass -File .\build.ps1
}

# 2. Check if NexusServer is running
$serverProc = Get-Process NexusServer -ErrorAction SilentlyContinue
if (-not $serverProc) {
    Write-Host "Starting NexusServer on port $AppPort..." -ForegroundColor Green
    Start-Process -FilePath ".\NexusServer.exe" -ArgumentList "$AppPort" -WorkingDirectory $PSScriptRoot
    Start-Sleep -Milliseconds 1500
} else {
    Write-Host "NexusServer is active on port $AppPort." -ForegroundColor Green
}

# 3. Launch Cloudflare Tunnel
Write-Host "`nLaunching High-Speed Cloudflare Tunnel..." -ForegroundColor Yellow
Write-Host "Press Ctrl+C in this terminal to stop the tunnel.`n" -ForegroundColor DarkGray

& .\cloudflared.exe tunnel --url "http://localhost:$AppPort" --http-host-header "localhost:$AppPort"
