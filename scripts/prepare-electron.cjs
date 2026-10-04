const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const electronDir = path.join(rootDir, 'electron');

if (!fs.existsSync(electronDir)) {
  fs.mkdirSync(electronDir, { recursive: true });
}

const mainCjsContent = `const { app, BrowserWindow, shell, ipcMain } = require('electron');
const path = require('path');
const https = require('https');
const http = require('http');
const fs = require('fs');
const os = require('os');
const { spawn } = require('child_process');

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 850,
    minWidth: 1024,
    minHeight: 700,
    title: 'IQC by ThinhXu - Hệ Thống Quản Lý Nội Kiểm Xét Nghiệm Y Khoa',
    icon: path.join(__dirname, '../public/pwa-512x512.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      preload: path.join(__dirname, 'preload.cjs'),
    },
    autoHideMenuBar: false,
  });

  const isDev = !app.isPackaged && process.env.NODE_ENV === 'development';
  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.webContents.setWindowOpenHandler(({ url: targetUrl }) => {
    shell.openExternal(targetUrl);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Xử lý tự động tải gói cập nhật .EXE ẩn, tự chạy cài đặt ngầm và tự mở lại phần mềm phiên bản mới
ipcMain.handle('app-update:download-and-install', async (_event, { downloadUrl }) => {
  return new Promise((resolve, reject) => {
    try {
      const tempPath = path.join(os.tmpdir(), \`IQC-Update-Setup-\${Date.now()}.exe\`);
      const fileStream = fs.createWriteStream(tempPath);

      function download(urlToGet) {
        const client = urlToGet.startsWith('https') ? https : http;
        const options = {
          headers: {
            'User-Agent': 'IQC-by-ThinhXu-AutoUpdater/1.1.3',
            Accept: '*/*',
          },
        };

        client.get(urlToGet, options, (response) => {
          if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
            return download(response.headers.location);
          }

          if (response.statusCode !== 200) {
            reject(new Error(\`Tải tệp cập nhật thất bại: HTTP \${response.statusCode}\`));
            return;
          }

          const total = parseInt(response.headers['content-length'] || '0', 10);
          let downloaded = 0;

          response.on('data', (chunk) => {
            downloaded += chunk.length;
            const percent = total > 0 ? Math.min(100, Math.round((downloaded / total) * 100)) : 50;
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send('app-update:progress', { percent, downloaded, total });
            }
          });

          response.pipe(fileStream);

          fileStream.on('finish', () => {
            fileStream.close(() => {
              if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('app-update:installing', { tempPath });
              }

              setTimeout(() => {
                try {
                  const currentExePath = process.execPath;
                  const updaterCmdPath = path.join(os.tmpdir(), \`iqc-silent-updater-\${Date.now()}.cmd\`);
                  const cmdContent = [
                    '@echo off',
                    'chcp 65001 >nul',
                    'timeout /t 2 /nobreak >nul',
                    \`start "" /wait "\${tempPath}" /S\`,
                    'timeout /t 1 /nobreak >nul',
                    'if exist "%LOCALAPPDATA%\\\\Programs\\\\iqc-by-thinhxu\\\\IQC by ThinhXu.exe" (',
                    '  start "" "%LOCALAPPDATA%\\\\Programs\\\\iqc-by-thinhxu\\\\IQC by ThinhXu.exe"',
                    ') else if exist "%LOCALAPPDATA%\\\\Programs\\\\IQC by ThinhXu\\\\IQC by ThinhXu.exe" (',
                    '  start "" "%LOCALAPPDATA%\\\\Programs\\\\IQC by ThinhXu\\\\IQC by ThinhXu.exe"',
                    \`) else if exist "\${currentExePath}" (\`,
                    \`  start "" "\${currentExePath}"\`,
                    ')',
                    \`del /f /q "\${tempPath}" >nul 2>&1\`,
                    'del "%~f0" >nul 2>&1',
                  ].join('\\r\\n');

                  fs.writeFileSync(updaterCmdPath, cmdContent, 'utf8');

                  const child = spawn('cmd.exe', ['/c', updaterCmdPath], {
                    detached: true,
                    stdio: 'ignore',
                    windowsHide: true,
                  });
                  child.unref();
                  app.quit();
                } catch {
                  const child = spawn(tempPath, ['/S'], {
                    detached: true,
                    stdio: 'ignore',
                    windowsHide: true,
                  });
                  child.unref();
                  app.quit();
                }
              }, 800);

              resolve({ success: true, path: tempPath });
            });
          });
        }).on('error', (err) => {
          fs.unlink(tempPath, () => {});
          reject(err);
        });
      }

      download(downloadUrl);
    } catch (err) {
      reject(err);
    }
  });
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
`;

const preloadCjsContent = `const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  downloadAndInstallUpdate: (downloadUrl) => ipcRenderer.invoke('app-update:download-and-install', { downloadUrl }),
  onUpdateProgress: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('app-update:progress', handler);
    return () => ipcRenderer.removeListener('app-update:progress', handler);
  },
  onUpdateInstalling: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('app-update:installing', handler);
    return () => ipcRenderer.removeListener('app-update:installing', handler);
  }
});
`;

const electronBuilderConfig = {
  appId: 'com.thinhxu.iqc',
  productName: 'IQC by ThinhXu',
  directories: {
    output: 'dist-electron',
  },
  files: [
    'dist/**/*',
    'electron/**/*',
  ],
  extraMetadata: {
    main: 'electron/main.cjs',
  },
  win: {
    target: ['nsis', 'portable'],
  },
  nsis: {
    oneClick: true,
    perMachine: false,
    runAfterFinish: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
  },
};

fs.writeFileSync(path.join(electronDir, 'main.cjs'), mainCjsContent, 'utf8');
fs.writeFileSync(path.join(electronDir, 'preload.cjs'), preloadCjsContent, 'utf8');
fs.writeFileSync(path.join(rootDir, 'electron-builder.json'), JSON.stringify(electronBuilderConfig, null, 2), 'utf8');
console.log('Prepared electron/main.cjs, electron/preload.cjs, and electron-builder.json for silent auto-update.');
