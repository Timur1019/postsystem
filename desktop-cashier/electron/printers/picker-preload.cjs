const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('printerPicker', {
  load: () => ipcRenderer.invoke('printer-picker:load'),
  save: (name) => ipcRenderer.invoke('printer-picker:save', name),
  cancel: () => ipcRenderer.send('printer-picker:cancel'),
});
