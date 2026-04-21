const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("warehouseWindow", {
  minimize: () => ipcRenderer.send("window:minimize"),
  maximize: () => ipcRenderer.send("window:maximize"),
  close: () => ipcRenderer.send("window:close"),
  restart: () => ipcRenderer.send("app:restart")
});

contextBridge.exposeInMainWorld("warehouseAuth", {
  login: (password) => ipcRenderer.invoke("auth:login", password)
});

contextBridge.exposeInMainWorld("warehouseConfig", {
  get: () => ipcRenderer.invoke("config:get")
});

contextBridge.exposeInMainWorld("warehouseBrowser", {
  openLink: (link) => ipcRenderer.invoke("browser:open-link", link)
});
