@echo off
REM ============================================================
REM  Scripture Game - BERESHITH  (Windows local-server launcher)
REM  Hosts the game at http://localhost:8080 and opens it.
REM  Use this only if you prefer a real http:// address (for
REM  example to play from another device on your home network).
REM  Needs Python or Node.js installed. If you do not have
REM  either, just use start-windows.bat instead - it works
REM  fully offline with no dependencies.
REM ============================================================
setlocal
cd /d "%~dp0"
set "PORT=8080"

set "PYEXE="
where py >nul 2>nul && set "PYEXE=py"
if not defined PYEXE ( where python  >nul 2>nul && set "PYEXE=python" )
if not defined PYEXE ( where python3 >nul 2>nul && set "PYEXE=python3" )

if defined PYEXE (
  echo Starting Scripture Game at http://localhost:%PORT%/
  echo (Close this window to stop the server.)
  start "" "http://localhost:%PORT%/index.html"
  %PYEXE% -m http.server %PORT%
  goto :eof
)

where node >nul 2>nul
if %errorlevel%==0 (
  echo Starting Scripture Game at http://localhost:%PORT%/
  echo (Close this window to stop the server.)
  start "" "http://localhost:%PORT%/index.html"
  npx --yes http-server -p %PORT% -c-1
  goto :eof
)

echo.
echo  Could not find Python or Node.js to run a local server.
echo  No problem - you can still play fully offline:
echo  just double-click  start-windows.bat
echo.
pause
