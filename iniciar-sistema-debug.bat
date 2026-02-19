@echo off
echo ==========================================
echo    INICIANDO CENTRAL DE ATENDIMENTO
echo ==========================================

echo 1. Iniciando Servidor Vite (Backend)...
start /B "Servidor Vite" npm.cmd run dev

echo Aguardando 5 segundos para o servidor subir...
timeout /t 5 >nul

echo 2. Iniciando Aplicativo Electron (Windows)...
set NODE_ENV=development
call npm.cmd run electron:dev

if %errorlevel% neq 0 (
    echo.
    echo [ERRO] O aplicativo Electron fechou com erro.
    pause
)
