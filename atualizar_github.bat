@echo off
title GelControl - Atualizar GitHub Pages
echo ===================================================
echo   GELO DO VALE - ATUALIZAR GITHUB PAGES
echo ===================================================
echo.

REM Detect Git
set GIT_PATH=git
where git >nul 2>nul
if %ERRORLEVEL% equ 0 goto GIT_FOUND

if exist "C:\Program Files\Git\cmd\git.exe" (
    set GIT_PATH="C:\Program Files\Git\cmd\git.exe"
    goto GIT_FOUND
)

echo ERROR: Git nao encontrado no PATH ou em C:\Program Files\Git\cmd\git.exe
echo Instale o Git e tente novamente.
pause
exit /b

:GIT_FOUND
echo Git detectado com sucesso.
echo.

REM Verify if it is a Git Repository
if exist .git goto GIT_OK
echo Inicializando repositorio Git...
%GIT_PATH% init
%GIT_PATH% branch -M main
%GIT_PATH% remote add origin https://github.com/gelodovale/gelodovale-app.git
:GIT_OK

REM Configure credentials helper
%GIT_PATH% config credential.helper store

REM Add files
echo Adicionando arquivos...
%GIT_PATH% add index.html styles.css manifest.json sw.js logo_horizontal.jpg logo_vertical.png js/

REM Commit
set COMMIT_MSG=Atualizacao GelControl
set /p USER_MSG=Digite a mensagem do commit (deixe vazio para padrao): 
if not "%USER_MSG%"=="" set COMMIT_MSG=%USER_MSG%

echo Criando commit: "%COMMIT_MSG%"...
%GIT_PATH% commit -m "%COMMIT_MSG%"

REM Push
echo Enviando para o GitHub...
%GIT_PATH% push -u origin main

if %ERRORLEVEL% equ 0 goto PUSH_SUCCESS
echo.
echo Houve um erro no envio. Verifique suas credenciais do GitHub.
goto END

:PUSH_SUCCESS
echo.
echo Otimizando e limpando arquivos temporarios para o OneDrive...
%GIT_PATH% gc --prune=now --quiet
echo.
echo ===================================================
echo   ARQUIVOS ENVIADOS COM SUCESSO PARA O GITHUB!
echo   Seu app estara online em alguns minutos.
echo ===================================================
:END
pause
