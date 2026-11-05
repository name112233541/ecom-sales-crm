@echo off
setlocal
set "URL=https://name112233541.github.io/ecom-sales-crm/"
set "EDGE1=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
set "EDGE2=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"
if exist "%EDGE1%" (
  start "" "%EDGE1%" --app="%URL%"
  exit /b 0
)
if exist "%EDGE2%" (
  start "" "%EDGE2%" --app="%URL%"
  exit /b 0
)
start "" "%URL%"
