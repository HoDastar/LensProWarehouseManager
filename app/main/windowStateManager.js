const fs = require("fs");
const path = require("path");
const { app, screen } = require("electron");

const DATA_DIR_NAME = "data";
const WINDOW_INFO_FILE_NAME = "windowsInfo.json";
const DEFAULT_MAIN_WINDOW_STATE = {
  width: 1280,
  height: 820
};

let saveTimer = null;

function getWindowInfoPath() {
  return path.join(app.getPath("userData"), DATA_DIR_NAME, WINDOW_INFO_FILE_NAME);
}

function ensureDataDirectory() {
  fs.mkdirSync(path.dirname(getWindowInfoPath()), { recursive: true });
}

function readWindowInfo() {
  try {
    const filePath = getWindowInfoPath();
    if (!fs.existsSync(filePath)) {
      return {};
    }

    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    console.warn("Failed to read windowsInfo.json:", error);
    return {};
  }
}

function writeWindowInfo(windowInfo) {
  try {
    ensureDataDirectory();
    fs.writeFileSync(getWindowInfoPath(), JSON.stringify(windowInfo, null, 2), "utf8");
  } catch (error) {
    console.warn("Failed to write windowsInfo.json:", error);
  }
}

function isBoundsVisible(bounds) {
  if (!bounds || typeof bounds !== "object") {
    return false;
  }

  const displays = screen.getAllDisplays();
  return displays.some((display) => {
    const area = display.workArea;
    const horizontalOverlap = bounds.x < area.x + area.width && bounds.x + bounds.width > area.x;
    const verticalOverlap = bounds.y < area.y + area.height && bounds.y + bounds.height > area.y;
    return horizontalOverlap && verticalOverlap;
  });
}

function getSavedMainWindowState() {
  const windowInfo = readWindowInfo();
  const savedState = windowInfo.mainWindow || {};
  const bounds = {
    x: savedState.x,
    y: savedState.y,
    width: savedState.width,
    height: savedState.height
  };

  const hasValidSize = Number.isInteger(bounds.width) && Number.isInteger(bounds.height) && bounds.width > 0 && bounds.height > 0;
  const hasValidPosition = Number.isInteger(bounds.x) && Number.isInteger(bounds.y);

  if (!hasValidSize) {
    return {
      ...DEFAULT_MAIN_WINDOW_STATE,
      isMaximized: Boolean(savedState.isMaximized)
    };
  }

  if (!hasValidPosition || !isBoundsVisible(bounds)) {
    return {
      width: bounds.width,
      height: bounds.height,
      isMaximized: Boolean(savedState.isMaximized)
    };
  }

  return {
    ...bounds,
    isMaximized: Boolean(savedState.isMaximized)
  };
}

function saveMainWindowState(mainWindow) {
  if (!mainWindow || mainWindow.isDestroyed() || mainWindow.isMinimized()) {
    return;
  }

  const windowInfo = readWindowInfo();
  const bounds = mainWindow.isMaximized() ? mainWindow.getNormalBounds() : mainWindow.getBounds();
  windowInfo.mainWindow = {
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
    isMaximized: mainWindow.isMaximized()
  };
  writeWindowInfo(windowInfo);
}

function scheduleSaveMainWindowState(mainWindow) {
  if (saveTimer) {
    clearTimeout(saveTimer);
  }

  saveTimer = setTimeout(() => {
    saveTimer = null;
    saveMainWindowState(mainWindow);
  }, 300);
}

function bindMainWindowState(mainWindow) {
  mainWindow.on("move", () => {
    if (!mainWindow.isMaximized()) {
      scheduleSaveMainWindowState(mainWindow);
    }
  });

  mainWindow.on("resize", () => {
    if (!mainWindow.isMaximized()) {
      scheduleSaveMainWindowState(mainWindow);
    }
  });

  mainWindow.on("maximize", () => {
    scheduleSaveMainWindowState(mainWindow);
  });

  mainWindow.on("unmaximize", () => {
    scheduleSaveMainWindowState(mainWindow);
  });

  mainWindow.on("hide", () => {
    saveMainWindowState(mainWindow);
  });

  mainWindow.on("close", () => {
    saveMainWindowState(mainWindow);
  });
}

module.exports = {
  getSavedMainWindowState,
  bindMainWindowState,
  saveMainWindowState
};
