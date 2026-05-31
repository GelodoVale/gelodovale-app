@echo off
title GelControl - Otimizar Git ^& OneDrive
echo ===================================================
echo   GELO DO VALE - OTIMIZAR REPOSITORIO ^& ONEDRIVE
echo ===================================================
echo.
echo Este script remove arquivos de controle temporarios
echo (loose objects) do Git, agrupando-os em pacotes.
echo Isso evita avisos de exclusao em massa do OneDrive.
echo.

REM Detect Git
set GIT_PATH=git
where git >nul 2>nul
if %ERRORLEVEL% equ 0 goto GIT_FOUND

if exist "C:\Program Files\Git\cmd\git.exe" (
    set GIT_PATH="C:\Program Files\Git\cmd\git.exe"
    goto GIT_FOUND
)

echo ERRO: Git nao encontrado. Instale o Git para continuar.
pause
exit /b

:GIT_FOUND
echo Otimizando banco de dados Git local...
%GIT_PATH% gc --prune=now

echo.
echo ===================================================
echo   OTIMIZACAO CONCLUIDA COM SUCESSO!
echo   OneDrive nao deve mais mostrar avisos de exclusao.
echo ===================================================
pause
