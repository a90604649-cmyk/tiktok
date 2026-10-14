const { app, BrowserWindow, shell } = require("electron");

const TIKTOK_URL = "https://www.tiktok.com/";

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 800,
    minHeight: 600,
    title: "TikTok Desktop",
    backgroundColor: "#101010",
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webviewTag: false
    }
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https://www.tiktok.com/") ||
        url.startsWith("https://m.tiktok.com/")) {
      return { action: "allow" };
    }
    if (url.startsWith("https://")) shell.openExternal(url);
    return { action: "deny" };
  });

  win.webContents.on("will-navigate", (event, url) => {
    const allowed = url.startsWith("https://www.tiktok.com/") ||
                    url.startsWith("https://m.tiktok.com/");
    if (!allowed) {
      event.preventDefault();
      if (url.startsWith("https://")) shell.openExternal(url);
    }
  });

  win.loadURL(TIKTOK_URL);
}

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
