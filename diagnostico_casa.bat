@echo off
title Diagnóstico GelControl - PC Casa
echo Executando diagnóstico... por favor, aguarde.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0diagnostico_casa.ps1"
echo.
echo Diagnóstico concluído! Verifique se o arquivo 'diagnostico_casa_resultado.txt' foi criado.
echo Pressione qualquer tecla para fechar.
pause >nul
