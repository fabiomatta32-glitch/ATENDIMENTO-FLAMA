
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Exemplo de ponte para chamadas nativas do sistema
  saveToDisk: (data) => ipcRenderer.send('save-db', data),
  onUpdateAvailable: (callback) => ipcRenderer.on('update-available', callback)
});

console.log('Electron Preload script loaded.');
