@echo off
title YogurASO - Ubuntu Docker
echo.
echo Abriendo YogurASO en Ubuntu con Docker (sin Docker Desktop en Windows)...
echo.
powershell -ExecutionPolicy Bypass -File "%~dp0scripts\ubuntu-auto-docker-raro.ps1"
pause
