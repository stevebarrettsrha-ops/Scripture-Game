@echo off
REM ============================================================
REM  Scripture Game - BERESHITH
REM  Run this ONCE to place a "Scripture Game" launcher on your
REM  desktop. Double-clicking that launcher opens the game in
REM  your browser - fully offline.
REM ============================================================
setlocal
set "GAMEDIR=%~dp0"
set "TARGET=%GAMEDIR%index.html"

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$desktop=[Environment]::GetFolderPath('Desktop');" ^
  "$lnk=Join-Path $desktop 'Scripture Game.lnk';" ^
  "$sh=New-Object -ComObject WScript.Shell;" ^
  "$s=$sh.CreateShortcut($lnk);" ^
  "$s.TargetPath='%TARGET%';" ^
  "$s.WorkingDirectory='%GAMEDIR%';" ^
  "$s.Description='BERESHITH - Scripture Game (offline)';" ^
  "$s.Save()"

if %errorlevel%==0 (
  echo.
  echo  Done! A "Scripture Game" launcher is now on your desktop.
  echo  Double-click it any time to play - offline, no internet needed.
) else (
  echo.
  echo  Could not create the shortcut automatically.
  echo  You can still play by double-clicking start-windows.bat
)
echo.
pause
