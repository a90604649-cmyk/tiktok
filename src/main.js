const { app, BrowserWindow, shell, session } = require("electron");

const TIKTOK_URL = "https://www.tiktok.com/";
const ALLOWED_HOSTS = new Set([
  "www.tiktok.com",
  "m.tiktok.com",
  "accounts.tiktok.com",
  "login.tiktok.com"
]);

function parseSafeHttpsUrl(rawUrl) {
  try {
    const url = new URL(rawUrl);
    if (url.protocol !== "https:" || url.username || url.password) return null;
    return url;
  } catch {
    return null;
  }
}

function isAllowedTikTokUrl(rawUrl) {
  const url = parseSafeHttpsUrl(rawUrl);
  return Boolean(url && ALLOWED_HOSTS.has(url.hostname.toLowerCase()));
}

function openExternalSafely(rawUrl) {
  const url = parseSafeHttpsUrl(rawUrl);
  if (url) {
    // Only validated HTTPS URLs are handed to the operating system.
    void shell.openExternal(url.href).catch(() => {});
  }
}

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
      webviewTag: false,
      webSecurity: true,
      allowRunningInsecureContent: false,
      experimentalFeatures: false
    }
  });

  // Popups may stay in the app only when they target an explicitly allowed
  // TikTok host. Other HTTPS links open in the user's default browser.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (isAllowedTikTokUrl(url)) return { action: "allow" };
    openExternalSafely(url);
    return { action: "deny" };
  });

  // Prevent the main window from being navigated to arbitrary websites.
  win.webContents.on("will-navigate", (event, url) => {
    if (isAllowedTikTokUrl(url)) return;
    event.preventDefault();
    openExternalSafely(url);
  });

  // Apply the same rule to redirects, not just direct navigation.
  win.webContents.on("will-redirect", (event, url) => {
    if (isAllowedTikTokUrl(url)) return;
    event.preventDefault();
    openExternalSafely(url);
  });

  // This viewer does not need camera, microphone, notifications, geolocation,
  // or other browser permissions. Deny requests by default.
  win.webContents.session.setPermissionRequestHandler(
    (_webContents, _permission, callback) => callback(false)
  );
  win.webContents.session.setPermissionCheckHandler(() => false);

  win.webContents.on("will-attach-webview", (event) => {
    event.preventDefault();
  });

  win.loadURL(TIKTOK_URL).catch(() => {
    if (!win.isDestroyed()) {
      win.webContents.loadURL("about:blank").catch(() => {});
      win.setTitle("TikTok Desktop - no se pudo abrir de forma segura");
    }
  });
}

// Prevent multiple app instances from racing to create windows.
const gotSingleInstanceLock = app.requestSingleInstanceLock();
if (!gotSingleInstanceLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    const [win] = BrowserWindow.getAllWindows();
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });

  app.whenReady().then(() => {
    // Do not override Electron's default TLS certificate validation.
    // Invalid certificates should remain blocked.
    void session.defaultSession;
    createWindow();

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });
}

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
