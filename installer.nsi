; =========================================================================
; NSIS Installer Script for IQC by ThinhXu (100% Offline & Native Desktop)
; =========================================================================

Name "IQC by ThinhXu"
Caption "Cài đặt IQC by ThinhXu - Quản Lý Nội Kiểm Xét Nghiệm"
OutFile "dist-electron/IQC-by-ThinhXu-Setup-v1.1.3.exe"
InstallDir "$LOCALAPPDATA\Programs\IQC by ThinhXu"
RequestExecutionLevel user

Page directory
Page instfiles

Section "Install"
  SetOutPath "$INSTDIR"

  ; Extract app files (including dist, launch.bat)
  File /r "dist\*.*"
  File "public\favicon.ico"
  File "launch.bat"

  ; Create Desktop Shortcut
  CreateShortcut "$DESKTOP\IQC by ThinhXu.lnk" "$INSTDIR\launch.bat" "" "$INSTDIR\favicon.ico" 0 SW_SHOWMINIMIZED

  ; Create Start Menu Shortcuts
  CreateDirectory "$SMPROGRAMS\IQC by ThinhXu"
  CreateShortcut "$SMPROGRAMS\IQC by ThinhXu\IQC by ThinhXu.lnk" "$INSTDIR\launch.bat" "" "$INSTDIR\favicon.ico" 0 SW_SHOWMINIMIZED
  CreateShortcut "$SMPROGRAMS\IQC by ThinhXu\Go cai dat IQC.lnk" "$INSTDIR\Uninstall.exe" "" "$INSTDIR\favicon.ico" 0

  ; Write registry keys for Windows Add/Remove Programs
  WriteRegStr HKCU "Software\IQC by ThinhXu" "Install_Dir" "$INSTDIR"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\IQCbyThinhXu" "DisplayName" "IQC by ThinhXu - Quản Lý Nội Kiểm Xét Nghiệm"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\IQCbyThinhXu" "DisplayIcon" "$INSTDIR\favicon.ico"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\IQCbyThinhXu" "DisplayVersion" "1.1.3"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\IQCbyThinhXu" "Publisher" "ThinhXu"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\IQCbyThinhXu" "UninstallString" '"$INSTDIR\Uninstall.exe"'

  ; Write Uninstaller
  WriteUninstaller "$INSTDIR\Uninstall.exe"

  ; Automatically launch app after installation
  ExecShell "open" "$INSTDIR\launch.bat"
SectionEnd

Section "Uninstall"
  Delete "$DESKTOP\IQC by ThinhXu.lnk"
  Delete "$SMPROGRAMS\IQC by ThinhXu\IQC by ThinhXu.lnk"
  Delete "$SMPROGRAMS\IQC by ThinhXu\Go cai dat IQC.lnk"
  RMDir "$SMPROGRAMS\IQC by ThinhXu"

  RMDir /r "$INSTDIR"

  DeleteRegKey HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\IQCbyThinhXu"
  DeleteRegKey HKCU "Software\IQC by ThinhXu"
SectionEnd
