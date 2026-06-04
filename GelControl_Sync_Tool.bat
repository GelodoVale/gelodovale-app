@echo off
title GelControl Sync Tool
cls
echo.
echo ========================================================
echo   GelControl - Utilitario de Diagnostico de Sincronizacao
echo ========================================================
echo.
echo Inicializando a ferramenta de analise...
echo.

REM Verifica se o script powershell existe
if not exist "%~dp0sync_diagnostics.ps1" (
    echo [ERRO] O arquivo sync_diagnostics.ps1 nao foi encontrado na mesma pasta!
    pause
    exit /b 1
)

REM Executa o script PowerShell com política Bypass
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0sync_diagnostics.ps1"

exit /b 0
