const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('setupApi', {
  save: (data) => ipcRenderer.send('setup:save', data),
});
