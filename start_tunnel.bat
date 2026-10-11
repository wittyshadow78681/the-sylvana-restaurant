@echo off
title The Sylvana Restaurant - Public Tunnel Deployment
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start_tunnel.ps1"
pause
