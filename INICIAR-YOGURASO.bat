@echo off
title YogurASO
cd /d "%~dp0"

echo.
echo Iniciando YoguraSo...
echo.

start "YogurASO Web" cmd /k "cd /d %~dp0frontend && npx --yes serve -p 5500"

timeout /t 4 /nobreak >nul

start http://127.0.0.1:5500

echo.
echo Web:  http://127.0.0.1:5500
echo Datos: Supabase. No hace falta encender otra cosa.
echo Deja abierta la ventana "YogurASO Web".
echo.
pause
