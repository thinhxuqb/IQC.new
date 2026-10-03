const { app, BrowserWindow, Menu, shell, ipcMain } = require('electron');
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
    title: 'IQC by ThinhXu - Quản Lý Nội Kiểm Xét Nghiệm Y Khoa ISO 15189',
    icon: path.join(__dirname, '../public/pwa-512x512.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      preload: path.join(__dirname, 'preload.cjs'),
    },
    autoHideMenuBar: false,
  });

  // Load production dist or local dev server
  const isDev = !app.isPackaged && process.env.NODE_ENV === 'development';
  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Open external links in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url: targetUrl }) => {
    shell.openExternal(targetUrl);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Xử lý tự động tải gói cập nhật .EXE và tự động cài đặt ngầm (Silent Install)
ipcMain.handle('app-update:download-and-install', async (_event, { downloadUrl }) => {
  return new Promise((resolve, reject) => {
    try {
      const tempPath = path.join(os.tmpdir(), `IQC-Update-${Date.now()}.exe`);
      const fileStream = fs.createWriteStream(tempPath);

      function download(urlToGet) {
        const client = urlToGet.startsWith('https') ? https : http;
        client.get(urlToGet, (response) => {
          // Xử lý chuyển hướng HTTP (301, 302, 307) từ GitHub Release CDN
          if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
            return download(response.headers.location);
          }

          if (response.statusCode !== 200) {
            reject(new Error(`Tải tệp cập nhật thất bại: HTTP ${response.statusCode}`));
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

              // Chạy bộ cài NSIS tự động ở chế độ im lặng (/S) để tự ghi đè và cập nhật
              setTimeout(() => {
                try {
                  const child = spawn(tempPath, ['/S'], {
                    detached: true,
                    stdio: 'ignore'
                  });
                  child.unref();
                  app.quit();
                } catch {
                  // Dự phòng mở trình cài đặt bình thường nếu chế độ silent bị chặn
                  shell.openPath(tempPath);
                  app.quit();
                }
              }, 1200);

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
