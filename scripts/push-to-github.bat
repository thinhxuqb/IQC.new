@echo off
chcp 65001 >nul
echo ============================================================
echo  TỰ ĐỘNG ĐẨY MÃ NGUỒN VÀ BẢN CẬP NHẬT V1.1.4 LÊN GITHUB
echo ============================================================
echo.

set /p GITHUB_TOKEN="Nhập GitHub Personal Access Token (PAT) của bạn: "

if "%GITHUB_TOKEN%"=="" (
    echo [Lỗi] Token không được để trống!
    pause
    exit /b 1
)

echo.
echo Đang tạo commit và tag v1.1.4...
git init
git checkout -B main
git add -A
git commit -m "Release v1.1.4: Strict Admin Login/Logout, Dynamic Instruments, TX Logo & Hospital Logo on QC Report" 2>nul
git tag -f v1.1.4

echo Đang đồng bộ và đẩy mã nguồn lên https://github.com/thinhxuqb/IQC.new...
git push -f https://%GITHUB_TOKEN%@github.com/thinhxuqb/IQC.new.git main --tags

if %errorlevel% equ 0 (
    echo.
    echo ============================================================
    echo [THÀNH CÔNG] Đã đẩy bản v1.1.4 lên GitHub!
    echo GitHub Actions đang tự động biên dịch IQC.by.ThinhXu.Setup.1.1.4.exe.
    echo Bạn có thể theo dõi tiến trình tại: https://github.com/thinhxuqb/IQC.new/actions
    echo ============================================================
) else (
    echo.
    echo [THẤT BẠI] Có lỗi xảy ra khi đẩy lên GitHub. Vui lòng kiểm tra lại Token của bạn.
)

pause
