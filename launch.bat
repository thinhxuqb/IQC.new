@echo off
set SCRIPT_DIR=%~dp0
set LOCAL_HTML=%SCRIPT_DIR%index.html
set CLOUD_URL=https://ais-dev-6d3yat5o2uziir2dccg7xx-653002995870.asia-southeast1.run.app

start msedge --app="%CLOUD_URL%"
if %ERRORLEVEL% NEQ 0 (
    if exist "%LOCAL_HTML%" (
        start msedge --app="file:///%LOCAL_HTML%"
    ) else (
        start chrome --app="%CLOUD_URL%"
    )
)
exit /b 0
