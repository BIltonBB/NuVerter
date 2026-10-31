@echo off
setlocal
set "PORT=4173"
cd /d "%~dp0"

where node >nul 2>&1
if errorlevel 1 (
  echo Node.js is required to run NuVerter.
  echo Install it from https://nodejs.org/ and try again.
  pause
  exit /b 1
)

echo Starting NuVerter - Local Media Studio...
start "NuVerter" /MIN cmd /c "cd /d "%~dp0" && node server.cjs %PORT%"

timeout /t 2 /nobreak >nul

start "" "http://localhost:%PORT%/"

echo.
echo NuVerter is running at http://localhost:%PORT%/
echo Keep the minimized "NuVerter" window open. Press Ctrl+C there to stop.
echo.
pause