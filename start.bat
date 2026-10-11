@echo off
title NexusFlow - Dynamic CMS & Single Page Web Server
echo ==========================================================
echo    Starting NexusFlow Server on http://localhost:5000 ...
echo ==========================================================
cd /d "%~dp0"
if not exist "NexusServer.exe" (
    echo Compiling NexusServer.exe ...
    powershell -ExecutionPolicy Bypass -File build.ps1
)
NexusServer.exe 5000
pause
