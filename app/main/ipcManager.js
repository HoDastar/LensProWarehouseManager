const { BrowserWindow, ipcMain, shell } = require("electron");
const { app } = require("electron");
const config = require("./config");

function getEventWindow(event, windowManager) {
  return BrowserWindow.fromWebContents(event.sender) || windowManager.getFocusedManagedWindow();
}

function registerRendererEvents(windowManager) {
  ipcMain.handle("auth:login", async (event, password) => {
    const apiUrl = config.getUrl();
    if (!apiUrl) {
      return { ok: false, message: "未配置服务器地址" };
    }

    let result;
    try {
      const response = await fetch(apiUrl + "/api/config/check_password?password=" + encodeURIComponent(password));
      result = await response.json();
    } catch (error) {
      return { ok: false, message: "无法连接服务器" };
    }

    const isValid = result.result;
    if (!isValid) {
      return { ok: false, message: result.msg || "访问密码错误" };
    }

    const responseToken = result.data && typeof result.data === "object" ? result.data.token : result.data;
    config.setToken(responseToken);
    windowManager.createMainWindow();
    windowManager.closeLoginWindow();
    return { ok: true };
  });

  ipcMain.handle("config:get", () => {
    return config.getRendererConfig();
  });

  ipcMain.handle("browser:open-link", async (event, link) => {
    if (!link || typeof link !== "string") {
      return { ok: false, message: "链接不能为空" };
    }

    let targetUrl;
    try {
      targetUrl = new URL(link);
    } catch (error) {
      return { ok: false, message: "链接格式不正确" };
    }

    if (!['http:', 'https:'].includes(targetUrl.protocol)) {
      return { ok: false, message: "仅支持打开网页链接" };
    }

    try {
      await shell.openExternal(targetUrl.toString());
      return { ok: true };
    } catch (error) {
      return { ok: false, message: "打开浏览器失败" };
    }
  });

  ipcMain.on("window:minimize", (event) => {
    const targetWindow = getEventWindow(event, windowManager);
    if (targetWindow && !targetWindow.isDestroyed()) {
      targetWindow.minimize();
    }
  });

  ipcMain.on("window:maximize", (event) => {
    const targetWindow = getEventWindow(event, windowManager);
    if (!targetWindow || targetWindow.isDestroyed() || !targetWindow.isMaximizable()) {
      return;
    }

    if (targetWindow.isMaximized()) {
      targetWindow.unmaximize();
    } else {
      targetWindow.maximize();
    }
  });

  ipcMain.on("window:close", (event) => {
    const targetWindow = getEventWindow(event, windowManager);
    if (targetWindow && !targetWindow.isDestroyed()) {
      targetWindow.close();
    }
  });

  ipcMain.on("app:restart", () => {
    app.relaunch();
    app.exit(0);
  });
}

module.exports = {
  registerRendererEvents
};
