const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('scalePicker', {
  load: () => ipcRenderer.invoke('scale-picker:load'),
  save: (payload) => ipcRenderer.invoke('scale-picker:save', payload),
  autoDetect: () => ipcRenderer.invoke('scale-picker:auto-detect'),
  testPort: (payload) => ipcRenderer.invoke('scale-picker:test', payload),
  cancel: () => ipcRenderer.send('scale-picker:cancel'),
});
