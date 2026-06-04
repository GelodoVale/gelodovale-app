@echo off
title GelControl - Sincronizar Antigravity IDE
echo ===================================================
echo   GELO DO VALE - SINCRONIZAR HISTORICO DA IDE
echo ===================================================
echo.

set LOG_FILE=%~dp0diagnostico_sincronizacao.txt
echo === DIAGNOSTICO DE SINCRONIZACAO === > "%LOG_FILE%"
echo Data/Hora: %DATE% %TIME% >> "%LOG_FILE%"
echo Computador: %COMPUTERNAME% >> "%LOG_FILE%"
echo Usuario: %USERNAME% >> "%LOG_FILE%"
echo UserProfile: %USERPROFILE% >> "%LOG_FILE%"

REM Detectar OneDrive de forma dinamica
if not "%OneDrive%"=="" (
    set ONEDRIVE_BASE=%OneDrive%
) else if not "%OneDriveConsumer%"=="" (
    set ONEDRIVE_BASE=%OneDriveConsumer%
) else (
    set ONEDRIVE_BASE=%USERPROFILE%\OneDrive
)
echo OneDrive Detectado: %ONEDRIVE_BASE% >> "%LOG_FILE%"

REM Verificar processos da IDE
tasklist /FI "IMAGENAME eq Antigravity IDE.exe" 2>NUL | find /I /N "Antigravity IDE.exe" >NUL
if %ERRORLEVEL% equ 0 (
    echo IDE Rodando: SIM >> "%LOG_FILE%"
    echo.
    echo ===================================================
    echo   ATENCAO: A Antigravity IDE esta ABERTA!
    echo   Por favor, FECHE a IDE antes de continuar.
    echo ===================================================
    echo.
    echo Pressione qualquer tecla depois de ter fechado a IDE...
    pause >nul
) else (
    echo IDE Rodando: NAO >> "%LOG_FILE%"
)

REM Lista de pastas a sincronizar
set "PASTAS=antigravity antigravity-ide"

for %%P in (%PASTAS%) do (
    call :ProcessarPasta %%P
)

echo.
echo ===================================================
echo   SINCRONIZACAO CONCLUIDA COM SUCESSO!
echo   Verifique o arquivo diagnostico_sincronizacao.txt
echo ===================================================
echo Status Final: SUCESSO >> "%LOG_FILE%"
pause
exit /b 0


:ProcessarPasta
set "PASTA_NOME=%1"
echo.
echo ---------------------------------------------------
echo Processando pasta: %PASTA_NOME%
echo ---------------------------------------------------
echo. >> "%LOG_FILE%"
echo [Pasta: %PASTA_NOME%] >> "%LOG_FILE%"

set "LOCAL_DIR=%USERPROFILE%\.gemini\%PASTA_NOME%"
set "ONEDRIVE_DIR=%ONEDRIVE_BASE%\%PASTA_NOME%"

echo Caminho Local: %LOCAL_DIR% >> "%LOG_FILE%"
echo Caminho OneDrive: %ONEDRIVE_DIR% >> "%LOG_FILE%"

REM 1. Verificar se a pasta do OneDrive ja existe, se nao, criar
if exist "%ONEDRIVE_DIR%" (
    echo OneDrive pasta existe: SIM >> "%LOG_FILE%"
) else (
    echo OneDrive pasta existe: NAO. Criando... >> "%LOG_FILE%"
    mkdir "%ONEDRIVE_DIR%"
    if exist "%LOCAL_DIR%" (
        echo Copiando dados locais atuais para o OneDrive... >> "%LOG_FILE%"
        xcopy "%LOCAL_DIR%" "%ONEDRIVE_DIR%" /E /I /H /Y >nul
    )
)

REM 2. Verificar se o diretorio local ja e uma Junction e se aponta para o lugar certo
fsutil reparsepoint query "%LOCAL_DIR%" >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo E Junction: SIM >> "%LOG_FILE%"
    
    set JUNCTION_TARGET=
    for /f "usebackq delims=" %%I in (`powershell -Command "(Get-Item '%LOCAL_DIR%').Target"`) do (
        set "JUNCTION_TARGET=%%I"
    )
    echo Destino Junction Atual: "%JUNCTION_TARGET%" >> "%LOG_FILE%"
    
    if /I "%JUNCTION_TARGET%"=="%ONEDRIVE_DIR%" (
        echo Sincronia Correta: SIM >> "%LOG_FILE%"
        echo Pasta %PASTA_NOME% ja esta sincronizada corretamente!
        goto :eof
    ) else (
        echo O destino da sincronizacao esta incorreto. Atualizando... >> "%LOG_FILE%"
        rmdir "%LOCAL_DIR%"
    )
) else (
    echo E Junction: NAO >> "%LOG_FILE%"
)

REM 3. Se for uma pasta normal, fazer backup e criar a Junction
if exist "%LOCAL_DIR%" (
    echo Fazendo backup da pasta local antiga... >> "%LOG_FILE%"
    
    set MYDATE=%DATE:/=-%
    set MYTIME=%TIME::=-%
    set MYTIME=%MYTIME: =0%
    
    ren "%LOCAL_DIR%" "%PASTA_NOME%-backup-%MYDATE%-%MYTIME%"
    if %ERRORLEVEL% neq 0 (
        echo [ERRO] Falha ao renomear %LOCAL_DIR% >> "%LOG_FILE%"
        echo [ERRO] Nao foi possivel renomear a pasta local antiga.
        echo Certifique-se de que a Antigravity IDE esta completamente FECHADA!
        goto :eof
    )
)

echo Criando conexao com o OneDrive... >> "%LOG_FILE%"
mklink /J "%LOCAL_DIR%" "%ONEDRIVE_DIR%"
if %ERRORLEVEL% equ 0 (
    echo Criacao Junction: SUCESSO >> "%LOG_FILE%"
    echo Pasta %PASTA_NOME% sincronizada com sucesso!
) else (
    echo Criacao Junction: ERRO >> "%LOG_FILE%"
    echo ERRO ao criar a ligacao simbolica para %PASTA_NOME%.
)
goto :eof
