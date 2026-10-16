@echo off
title FacturaPro 360 - Detener Docker
echo ================================================================
echo   Deteniendo Contenedores de FacturaPro 360...
echo ================================================================
cd /d "%~dp0"
docker compose down
echo.
echo [INFO] Contenedores detenidos y red liberada correctamente.
pause
