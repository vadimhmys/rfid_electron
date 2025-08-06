// preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    on: (channel, callback) => ipcRenderer.on(channel, callback),
    removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
  },
});

contextBridge.exposeInMainWorld('api', {
  saveUser: (userData) => ipcRenderer.send('save-user', userData),
  onSaveResponse: (callback) => ipcRenderer.on('save-user-response', (event, args) => callback(args))
});
