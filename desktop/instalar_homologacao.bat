@echo off
chcp 65001 >nul
title GelControl v85 — Instalador Inteligente de Homologação
cls

echo ============================================================================
echo   GELCONTROL v85 — INSTALADOR INTELIGENTE WINDOWS (HOMOLOGAÇÃO)
echo   Gelo do Vale — Sistema Oficial da Fábrica
echo ============================================================================
echo.

:: 1. DEFINIÇÃO DA UNIDADE PADRÃO SUGERIDA
set "DEFAULT_DEST=C:\GelControl"
if exist "D:\" set "DEFAULT_DEST=D:\GelControl"
if exist "F:\" set "DEFAULT_DEST=F:\GelControl"

echo [1/4] SELEÇÃO DO DIRETÓRIO DE INSTALAÇÃO
echo Pasta padrão sugerida: %DEFAULT_DEST%
echo.
set /p "TARGET_DIR=Digite a pasta de destino ou pressione ENTER para aceitar a padrão: "
if "%TARGET_DIR%"=="" set "TARGET_DIR=%DEFAULT_DEST%"

echo.
echo [2/4] MODO DE INSTALAÇÃO
echo [1] Computador Principal (Fábrica / Escritório — com Ferramentas Administrativas)
echo [2] Estação de Trabalho (Balcão / Motoristas — apenas Aplicativo Comercial)
echo.
set /p "INSTALL_MODE=Escolha o modo [1 ou 2] (padrão: 1): "
if "%INSTALL_MODE%"=="" set "INSTALL_MODE=1"

echo.
echo ============================================================================
echo   Resumo da Instalação:
echo   - Destino: %TARGET_DIR%
if "%INSTALL_MODE%"=="1" (
    echo   - Modo: Computador Principal (com Ferramentas Administrativas)
) else (
    echo   - Modo: Estação de Trabalho (apenas Aplicativo Comercial)
)
echo ============================================================================
echo.

:: 2. VERIFICAÇÃO DE PRESERVAÇÃO DE DADOS
if exist "%TARGET_DIR%\Dados" (
    echo [INFO] Pasta de Dados existente detectada em %TARGET_DIR%\Dados.
    echo [INFO] Seus dados comerciais e histórico de clientes serão PRESERVADOS com 100%% de integridade.
    echo.
)
if exist "%TARGET_DIR%\Backups" (
    echo [INFO] Pasta de Backups existente detectada em %TARGET_DIR%\Backups.
    echo [INFO] Seus backups históricos serão PRESERVADOS intactos.
    echo.
)

set /p "CONFIRM=Deseja prosseguir com a instalação? (S/N): "
if /i not "%CONFIRM%"=="S" (
    echo Instalação cancelada pelo usuário.
    pause
    exit /b 0
)

echo.
echo [3/4] CRIANDO ESTRUTURA DE DIRETÓRIOS...
if not exist "%TARGET_DIR%\Programa" mkdir "%TARGET_DIR%\Programa"
if not exist "%TARGET_DIR%\Dados" mkdir "%TARGET_DIR%\Dados"
if not exist "%TARGET_DIR%\Backups" mkdir "%TARGET_DIR%\Backups"
if "%INSTALL_MODE%"=="1" (
    if not exist "%TARGET_DIR%\Seguranca" mkdir "%TARGET_DIR%\Seguranca"
    if not exist "%TARGET_DIR%\Seguranca\Tools" mkdir "%TARGET_DIR%\Seguranca\Tools"
)

echo [3/4] COPIANDO ARQUIVOS DO PROGRAMA (SEM AFETAR DADOS OU BACKUPS)...
robocopy "F:\GelControl\Programa" "%TARGET_DIR%\Programa" /E /R:1 /W:1 /NP /NFL /NDL /XD "Dados" "Backups" "Seguranca" >nul

if "%INSTALL_MODE%"=="1" (
    echo [3/4] INSTALANDO FERRAMENTAS ADMINISTRATIVAS (SEM CHAVES PRIVADAS)...
    robocopy "C:\Users\kissn\OneDrive\GelodoVale-system\App\tools" "%TARGET_DIR%\Seguranca\Tools" /E /R:1 /W:1 /NP /NFL /NDL /XF "service-account*.json" "*.key" "*.pem" "*.env" >nul
)

echo.
echo [4/4] CRIANDO ATALHOS NA ÁREA DE TRABALHO...
powershell -NoProfile -Command ^
  "$ws = New-Object -ComObject WScript.Shell; " ^
  "$desktop = [Environment]::GetFolderPath('Desktop'); " ^
  "$sLocal = $ws.CreateShortcut((Join-Path $desktop 'GelControl — Local.lnk')); " ^
  "$sLocal.TargetPath = (Join-Path '%TARGET_DIR%' 'Programa\GelControl.exe'); " ^
  "$sLocal.WorkingDirectory = (Join-Path '%TARGET_DIR%' 'Programa'); " ^
  "$sLocal.Description = 'GelControl - Sistema Oficial da Fábrica de Gelo'; " ^
  "$sLocal.Save(); " ^
  "$sOnline = $ws.CreateShortcut((Join-Path $desktop 'GelControl — Online.lnk')); " ^
  "$sOnline.TargetPath = 'https://gelodovale.github.io/gelodovale-app/'; " ^
  "$sOnline.Description = 'GelControl - Acesso Web Online'; " ^
  "$sOnline.Save();"

echo.
echo ============================================================================
echo   INSTALAÇÃO CONCLUÍDA COM SUCESSO!
echo   - Aplicativo instalado em: %TARGET_DIR%\Programa\GelControl.exe
echo   - Atalhos criados na Área de Trabalho:
echo       * GelControl — Local
echo       * GelControl — Online
echo   - Dados e Backups preservados na raiz escolhida.
echo ============================================================================
echo.
pause
