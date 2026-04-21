const path = require("path");
const { BrowserWindow, app } = require("electron");
const windowStateManager = require("./windowStateManager");

let loginWindow = null;
let mainWindow = null;

function createBaseWindow(options) {
  const windowInstance = new BrowserWindow({
    frame: false,
    show: false,
    backgroundColor: "#f4f4f4",
    icon: undefined,
    webPreferences: {
      preload: path.join(__dirname, "..", "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    },
    ...options
  });

  windowInstance.on("close", (event) => {
    if (app.isQuitting || windowInstance.forceClose) {
      return;
    }

    event.preventDefault();
    windowInstance.hide();
    windowInstance.setSkipTaskbar(true);
  });

  windowInstance.on("show", () => {
    windowInstance.setSkipTaskbar(false);
  });

  return windowInstance;
}

function createLoginWindow() {
  if (loginWindow && !loginWindow.isDestroyed()) {
    loginWindow.show();
    loginWindow.focus();
    return loginWindow;
  }

  loginWindow = createBaseWindow({
    width: 420,
    height: 300,
    resizable: false,
    maximizable: false,
    icon: path.join(__dirname, "./../icon.png"),
    title: "登录 - 器材管理系统"
  });

  loginWindow.loadFile(path.join(__dirname, "..", "renderer", "login.html"));
  loginWindow.once("ready-to-show", () => {
    loginWindow.show();
  });
  loginWindow.on("closed", () => {
    loginWindow = null;
  });

  return loginWindow;
}

function createMainWindow() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.show();
    mainWindow.focus();
    return mainWindow;
  }

  const savedMainWindowState = windowStateManager.getSavedMainWindowState();
  const shouldRestoreMaximized = savedMainWindowState.isMaximized;
  delete savedMainWindowState.isMaximized;

  mainWindow = createBaseWindow({
    width: 1280,
    height: 820,
    minWidth: 1180,
    minHeight: 720,
    icon: path.join(__dirname, "./../icon.png"),
    title: "器材管理系统",
    ...savedMainWindowState
  });

  windowStateManager.bindMainWindowState(mainWindow);

  mainWindow.loadFile(path.join(__dirname, "..", "renderer", "index.html"));
  mainWindow.once("ready-to-show", () => {
    if (shouldRestoreMaximized) {
      mainWindow.maximize();
    }
    mainWindow.show();
  });
  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  return mainWindow;
}

function closeLoginWindow() {
  if (loginWindow && !loginWindow.isDestroyed()) {
    loginWindow.forceClose = true;
    loginWindow.close();
  }
}

function showAppWindow() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.show();
    mainWindow.focus();
    return mainWindow;
  }

  if (loginWindow && !loginWindow.isDestroyed()) {
    loginWindow.show();
    loginWindow.focus();
    return loginWindow;
  }

  return createLoginWindow();
}

function getLoginWindow() {
  return loginWindow;
}

function getMainWindow() {
  return mainWindow;
}

function getFocusedManagedWindow() {
  return BrowserWindow.getFocusedWindow() || mainWindow || loginWindow;
}

module.exports = {
  createLoginWindow,
  createMainWindow,
  closeLoginWindow,
  showAppWindow,
  getLoginWindow,
  getMainWindow,
  getFocusedManagedWindow
};

