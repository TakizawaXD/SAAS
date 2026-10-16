@echo off
title FacturaPro 360 - Despliegue con Docker
echo ================================================================
echo   Iniciando FacturaPro 360 Web y Base de Datos con Docker...
echo ================================================================
cd /d "%~dp0"
docker compose up -d --build
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] No se pudo iniciar Docker Compose.
    echo Asegurate de que la aplicacion Docker Desktop este abierta.
    pause
    exit /b %errorlevel%
)
echo.
echo ================================================================
echo [EXITO] Contenedores iniciados correctamente:
echo   - Aplicacion Web FacturaPro: http://localhost:8080
echo   - Base de Datos PostgreSQL:  localhost:5432
echo ================================================================
echo.
start "" "http://localhost:8080"
pause
