@echo off
chcp 65001 >nul
title GelControl Oficial — Reparo Automatico do Motor do Atualizador e Icone Circular
echo ============================================================================
echo   GELCONTROL OFICIAL — DESTRAVAMENTO DO MOTOR DO ATUALIZADOR (PC 1 / PC 2)
echo   Preserva 100%% dos dados comerciais (Dados\ e Backups\ intocados)
echo ============================================================================
echo.

set "SCRIPT_JS=%~dp0destravar_atualizador_local.js"
set "INSTALL_DIR="

if exist "F:\GelControl_Oficial\Programa\GelControl.exe" set "INSTALL_DIR=F:\GelControl_Oficial"
if "%INSTALL_DIR%"=="" if exist "D:\GelControl_Oficial\Programa\GelControl.exe" set "INSTALL_DIR=D:\GelControl_Oficial"
if "%INSTALL_DIR%"=="" if exist "E:\GelControl_Oficial\Programa\GelControl.exe" set "INSTALL_DIR=E:\GelControl_Oficial"
if "%INSTALL_DIR%"=="" if exist "C:\GelControl_Oficial\Programa\GelControl.exe" set "INSTALL_DIR=C:\GelControl_Oficial"

if "%INSTALL_DIR%"=="" (
    for /f "tokens=2*" %%A in ('reg query "HKCU\Software\GelControl" /v InstallPath 2^>nul ^| findstr /i "InstallPath"') do set "INSTALL_DIR=%%B"
)

if exist "%INSTALL_DIR%\Programa\GelControl.exe" (
    set "ELECTRON_RUN_AS_NODE=1"
    "%INSTALL_DIR%\Programa\GelControl.exe" "%SCRIPT_JS%" --install-dir="%INSTALL_DIR%"
    set "EXIT_CODE=%ERRORLEVEL%"
    set "ELECTRON_RUN_AS_NODE="
) else (
    node "%SCRIPT_JS%"
    set "EXIT_CODE=%ERRORLEVEL%"
)

echo.
if "%EXIT_CODE%"=="0" (
    echo [SUCESSO] Procedimento finalizado com exito!
) else (
    echo [ALERTA] Ocorreu um erro durante o procedimento ^(Codigo: %EXIT_CODE%^).
)
pause
exit /b %EXIT_CODE%
