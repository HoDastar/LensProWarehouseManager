const { app, dialog } = require("electron");
const windowManager = require("./main/windowManager");
const trayManager = require("./main/trayManager");
const { registerRendererEvents } = require("./main/ipcManager");
const config = require('./main/config');

app.isQuitting = false;
app.disableHardwareAcceleration();
app.commandLine.appendSwitch("disable-gpu");
app.commandLine.appendSwitch("disable-software-rasterizer");
app.commandLine.appendSwitch("no-sandbox");

app.whenReady().then(async () => {
  // 测试连接服务器
  try {
    await fetch(config.getUrl());
  } catch {
    dialog.showErrorBox("错误", "服务器连接失败，请稍后重试。");
    app.quit();
  }
  // 验证版本
  const checkVersionResult = await config.checkVersion();
  if (!checkVersionResult) {
    dialog.showErrorBox("错误", "当前版本: "+ config.getRendererConfig().version +" 已废弃，请更新至最新版本。");
    app.quit();
  }
  
  registerRendererEvents(windowManager);
  windowManager.createLoginWindow();
  trayManager.createTray(windowManager);

  app.on("activate", () => {
    windowManager.showAppWindow();
  });
});

app.on("before-quit", () => {
  app.isQuitting = true;
  trayManager.destroyTray();
});

app.on("window-all-closed", (event) => {
  event.preventDefault();
});
