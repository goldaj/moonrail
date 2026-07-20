@echo off
cd /d "%~dp0"
title Moonrail
where py >nul 2>nul
if %errorlevel%==0 (
  py serve.py
) else (
  python serve.py
)
if errorlevel 1 (
  echo.
  echo Impossible de lancer Moonrail. Python 3 doit etre installe.
  pause
)
