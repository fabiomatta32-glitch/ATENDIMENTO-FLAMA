@echo off
echo ==========================================
echo    HABILITANDO SCRIPTS E INICIANDO
echo ==========================================

echo Tentando habilitar scripts no PowerShell (Escopo Usuario)...
powershell -Command "Set-ExecutionPolicy RemoteSigned -Scope CurrentUser -Force"

echo Verificando politica atual...
powershell -Command "Get-ExecutionPolicy -List"

echo.
echo Iniciando o sistema agora...
echo.

echo 1. Iniciando Servidor Vite...
start "Vite" npm.cmd run dev

echo Aguardando servidor (5s)...
timeout /t 5 >nul

echo 2. Iniciando Electron...
npm.cmd run electron:dev
