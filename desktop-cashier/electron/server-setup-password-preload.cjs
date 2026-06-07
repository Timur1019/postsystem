const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('passwordApi', {
  submit: (password) => ipcRenderer.send('server-setup-password:submit', password),
  cancel: () => ipcRenderer.send('server-setup-password:cancel'),
});
