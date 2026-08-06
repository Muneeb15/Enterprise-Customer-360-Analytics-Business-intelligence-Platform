@echo off
title Nexus Analytics — Stopping...
color 0C

echo.
echo  Stopping Nexus Analytics servers...
echo.

:: Kill uvicorn (backend)
taskkill /f /fi "WINDOWTITLE eq Nexus Backend*" >nul 2>&1
taskkill /f /im "python.exe" /fi "MEMUSAGE gt 10000" >nul 2>&1
echo  Backend stopped.

:: Kill node (frontend)
taskkill /f /fi "WINDOWTITLE eq Nexus Frontend*" >nul 2>&1
echo  Frontend stopped.

echo.
echo  All servers stopped.
echo.
timeout /t 2 /nobreak >nul
