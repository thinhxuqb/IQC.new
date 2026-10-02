@echo off
chcp 65001 >nul
title Cài Đặt IQC by ThinhXu - Desktop App Windows

echo ========================================================
echo         IQC by ThinhXu - Quản Lý Nội Kiểm ISO 15189
echo ========================================================
echo.
echo Đang tạo biểu tượng Desktop và cấu hình ứng dụng trên Windows...
echo.

set APP_URL=https://ais-pre-dgukwgbcuat3e2kdmts5dq-470030224320.asia-southeast1.run.app
set SCRIPT="%TEMP%\CreateIQCShortcut.vbs"

echo Set oWS = WScript.CreateObject("WScript.Shell") >> %SCRIPT%
echo sLinkFile = oWS.SpecialFolders("Desktop") ^& "\IQC by ThinhXu.lnk" >> %SCRIPT%
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> %SCRIPT%
echo oLink.TargetPath = "msedge.exe" >> %SCRIPT%
echo oLink.Arguments = "--app=" ^& "%APP_URL%" >> %SCRIPT%
echo oLink.Description = "IQC by ThinhXu - Quản Lý QC Xét Nghiệm Y Khoa" >> %SCRIPT%
echo oLink.Save >> %SCRIPT%

cscript /nologo %SCRIPT%
del %SCRIPT%

echo [Thành công] Đã tạo biểu tượng 'IQC by ThinhXu' trên màn hình Desktop!
echo.
echo Đang mở ứng dụng ngay bây giờ...
start msedge --app=%APP_URL%

exit /b 0
