@echo off
chcp 65001 >nul
title GelControl - Gelo do Vale

REM Caminho permanente do perfil (dados nunca sao apagados)
set PROFILE=%USERPROFILE%\AppData\Local\GelControlChrome
set GELFILE=%USERPROFILE%\OneDrive\GelodoVale-system\App\index.html
set CHROME="C:\Program Files\Google\Chrome\Application\chrome.exe"
set FLAGS=--allow-file-access-from-files --allow-file-access --disable-web-security --user-data-dir="%PROFILE%"

if exist %CHROME% (
    start "" %CHROME% %FLAGS% "%GELFILE%"
) else (
    echo Chrome nao encontrado. Acesse: https://gelodovale.github.io/gelodovale-app/
    pause
)
