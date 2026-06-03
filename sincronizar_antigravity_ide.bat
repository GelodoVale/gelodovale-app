@echo off
title GelControl - Sincronizar Antigravity IDE
echo ===================================================
echo   GELO DO VALE - SINCRONIZAR HISTORICO DA IDE
echo ===================================================
echo.
echo Este script cria uma ligacao simbolica (Junction)
echo para sincronizar suas conversas com a Antigravity IDE
echo entre o computador do Trabalho e o de Casa via OneDrive.
echo.

set LOCAL_DIR=%USERPROFILE%\.gemini\antigravity-ide
set ONEDRIVE_DIR=%USERPROFILE%\OneDrive\antigravity-ide

REM 1. Verificar se a pasta do OneDrive ja existe, se nao, criar e copiar dados locais
if exist "%ONEDRIVE_DIR%" (
    echo A pasta do OneDrive ja contem os dados sincronizados.
) else (
    echo Criando pasta de sincronizacao no OneDrive...
    mkdir "%ONEDRIVE_DIR%"
    if exist "%LOCAL_DIR%" (
        echo Copiando dados locais atuais para o OneDrive...
        xcopy "%LOCAL_DIR%" "%ONEDRIVE_DIR%" /E /I /H /Y >nul
    )
)

REM 2. Verificar se o diretorio local ja e uma Junction
fsutil reparsepoint query "%LOCAL_DIR%" >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo.
    echo Sucesso: Este computador ja esta sincronizado com o OneDrive!
    goto FIM
)

REM 3. Se for uma pasta normal, fazer backup e criar a Junction
if exist "%LOCAL_DIR%" (
    echo Fazendo backup da pasta local antiga...
    
    rem Limpar caracteres invalidos da data/hora para o nome da pasta
    set MYDATE=%DATE:/=-%
    set MYTIME=%TIME::=-%
    set MYTIME=%MYTIME: =0%
    
    ren "%LOCAL_DIR%" "antigravity-ide-backup-%MYDATE%-%MYTIME%"
)

echo Criando conexao com o OneDrive...
mklink /J "%LOCAL_DIR%" "%ONEDRIVE_DIR%"

if %ERRORLEVEL% equ 0 (
    echo.
    echo ===================================================
    echo   SINCRONIZACAO CONFIGURADA COM SUCESSO!
    echo   Suas conversas agora estao salvas no OneDrive.
    echo ===================================================
) else (
    echo.
    echo ERRO ao criar a ligacao simbolica. 
    echo Certifique-se de rodar o prompt como Administrador se necessario.
)

:FIM
pause
