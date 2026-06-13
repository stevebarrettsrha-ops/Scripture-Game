@echo off
REM ============================================================
REM  Scripture Game - BERESHITH  (Offline Network Host - Windows)
REM  Lets OTHER devices (phones, tablets, laptops) on the SAME
REM  Wi-Fi / router play the game from THIS PC - with NO internet.
REM  Needs Python or Node.js installed on this PC.
REM ============================================================
setlocal enabledelayedexpansion
cd /d "%~dp0.."
set "PORT=8080"

echo ============================================================
echo   Scripture Game - Offline Network Host
echo ============================================================
echo.
echo   On other devices joined to the same Wi-Fi / router, open:
echo.
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
  for /f "tokens=* delims= " %%b in ("%%a") do echo        http://%%b:%PORT%/index.html
)
echo.
echo   Keep this window open while others play. Close it to stop.
echo ============================================================
echo.

set "PYEXE="
where py >nul 2>nul && set "PYEXE=py"
if not defined PYEXE ( where python  >nul 2>nul && set "PYEXE=python" )
if not defined PYEXE ( where python3 >nul 2>nul && set "PYEXE=python3" )

if defined PYEXE (
  %PYEXE% -m http.server %PORT% --bind 0.0.0.0
  goto :eof
)

where node >nul 2>nul
if %errorlevel%==0 (
  npx --yes http-server -p %PORT% -a 0.0.0.0 -c-1
  goto :eof
)

echo   Could not find Python or Node.js. Install Python from
echo   https://www.python.org/downloads/ and run this again.
echo   (You can still play solo with start-windows.bat - no host needed.)
pause
