const { Menu, Tray, nativeImage, app } = require("electron");
const path = require("path");

let appTray = null;

function createTray(windowManager) {
  if (appTray) {
    return appTray;
  }

  appTray = new Tray(path.join(__dirname, "./../icon.png"));
  appTray.setToolTip("LensPro库管系统");

  const showWindow = () => {
    windowManager.showAppWindow();
  };

  appTray.setContextMenu(Menu.buildFromTemplate([
    {
      label: "打开窗口",
      click: showWindow
    },
    { type: "separator" },
    {
      label: "退出",
      click: () => {
        app.isQuitting = true;
        app.quit();
      }
    }
  ]));

  appTray.on("double-click", showWindow);

  return appTray;
}

function destroyTray() {
  if (appTray) {
    appTray.destroy();
    appTray = null;
  }
}

module.exports = {
  createTray,
  destroyTray
};
