@echo off
title Instalador do SoundBoard
echo ==================================================
echo Instalando as dependencias do Python necessarias...
echo ==================================================
echo.
pip install -r requirements.txt
echo.
echo ==================================================
echo Instalacao concluida!
echo Voce ja pode fechar esta janela e abrir o "Iniciar_Servidor.bat".
echo ==================================================
pause
