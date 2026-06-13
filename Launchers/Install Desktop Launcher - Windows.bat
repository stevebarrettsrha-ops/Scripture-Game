@echo off
REM ============================================================
REM  Scripture Game - BERESHITH
REM  Puts a "Scripture Game" launcher on your Windows desktop.
REM  Run this once. The launcher opens the game offline in your
REM  browser. (Same as the Create Desktop Shortcut.bat in the
REM  main folder - kept here so all launchers live together.)
REM ============================================================
setlocal
pushd "%~dp0.."
set "GAMEDIR=%CD%\"
popd
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
) else (
  echo.
  echo  Could not create the shortcut. You can still play by opening
  echo  index.html in the main folder.
)
echo.
pause
