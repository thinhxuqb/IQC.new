const { contextBridge, ipcRenderer } = require('electron');

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
