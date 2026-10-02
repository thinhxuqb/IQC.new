; =========================================================================
; NSIS Portable Launcher for IQC by ThinhXu (100% Offline & Native Desktop)
; =========================================================================

Name "IQC by ThinhXu Portable"
Caption "IQC by ThinhXu Portable"
OutFile "dist-electron/IQC-by-ThinhXu-Portable.exe"
RequestExecutionLevel user
SilentInstall silent

Section
  InitPluginsDir
  SetOutPath "$PLUGINSDIR\app"

  File /r "dist\*.*"
  File "public\favicon.ico"

  ExecWait '"$PLUGINSDIR\app\launch.bat"'
SectionEnd
