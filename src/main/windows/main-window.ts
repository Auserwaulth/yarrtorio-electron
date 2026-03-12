import { BrowserWindow, app, shell } from "electron";
import { join } from "node:path";

let mainWindow: BrowserWindow | null = null;

function resolvePreloadPath(): string {
  const fileName = "index.cjs";

  if (process.env.NODE_ENV === "production" || app.isPackaged) {
    return join(__dirname, "../preload", fileName);
  }

  return join(process.cwd(), "out", "preload", fileName);
}

function resolveWindowIconPath(): string {
  if (process.env.NODE_ENV === "production" || app.isPackaged) {
    return join(process.resourcesPath, "icons", "icon.ico");
  }

  return join(process.cwd(), "resources", "icons", "icon.ico");
}

const preloadPath = resolvePreloadPath();
const iconPath = resolveWindowIconPath();

export function createMainWindow(): BrowserWindow {
  if (mainWindow && !mainWindow.isDestroyed()) {
    return mainWindow;
  }

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    backgroundColor: "#0a0f1c",
    icon: iconPath,
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });

  mainWindow.setIcon(iconPath);

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http://") || url.startsWith("https://")) {
      void shell.openExternal(url);
    }

    return { action: "deny" };
  });

  mainWindow.webContents.on("will-navigate", (event, url) => {
    if (url.startsWith("http://") || url.startsWith("https://")) {
      event.preventDefault();
      void shell.openExternal(url);
    }
  });

  if (process.env.ELECTRON_RENDERER_URL) {
    void mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    void mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
  }

  return mainWindow;
}
