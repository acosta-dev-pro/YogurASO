@echo off
title YogurASO - Windows
cd /d "%~dp0"

echo.
echo === YogurASO en Windows (sin VirtualBox) ===
echo.

REM Apagar VM si esta encendida (libera RAM)
powershell -NoProfile -Command ^
  "$v='C:\Program Files\Oracle\VirtualBox\VBoxManage.exe'; if (Test-Path $v) { $s=(& $v showvminfo 'Ubuntu-Server-AA5' --machinereadable 2>$null | Select-String 'VMState=\"(.+)\"').Matches.Groups[1].Value; if ($s -eq 'running') { & $v controlvm 'Ubuntu-Server-AA5' poweroff 2>$null; Write-Host 'VM Ubuntu apagada' } }"

REM Cerrar Docker Desktop (libera virtualizacion)
taskkill /IM "Docker Desktop.exe" /F >nul 2>&1
taskkill /IM "com.docker.backend.exe" /F >nul 2>&1

echo Iniciando backend (API)...
start "YogurASO API" cmd /k "cd /d %~dp0backend && npm start"

timeout /t 4 /nobreak >nul

echo Iniciando frontend...
start "YogurASO Web" cmd /k "cd /d %~dp0frontend && npx --yes serve -p 5500"

timeout /t 6 /nobreak >nul

echo Abriendo navegador...
start http://127.0.0.1:5500

echo.
echo LISTO:
echo   Web:  http://127.0.0.1:5500
echo   API:  http://localhost:3000/api
echo.
echo Deja abiertas las ventanas "YogurASO API" y "YogurASO Web"
pause
