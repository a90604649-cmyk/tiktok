const { app, BrowserWindow, shell, session, dialog } = require("electron");
const fs = require("node:fs");
const path = require("node:path");
const packageInfo = require("../package.json");

const TIKTOK_URL = "https://www.tiktok.com/";
const PROXY_MODE = packageInfo.proxyMode === true;
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
  if (url) void shell.openExternal(url.href).catch(() => {});
}

function readProxyRules() {
  const configPath = path.join(app.getPath("userData"), "proxy-config.json");

  if (!fs.existsSync(configPath)) {
    fs.mkdirSync(path.dirname(configPath), { recursive: true });
    fs.writeFileSync(
      configPath,
      JSON.stringify({ proxyRules: "http://HOST:PORT" }, null, 2) + "\n",
      "utf8"
    );
    throw new Error(
      "Se creó un archivo de configuración de ejemplo en:\n" +
      configPath +
      "\n\nEdita proxyRules con la dirección y el puerto de un proxy confiable, guarda el archivo y vuelve a abrir la aplicación. No se conectará directamente si el proxy no está configurado."
    );
  }

  let config;
  try {
    config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  } catch {
    throw new Error("El archivo proxy-config.json no contiene JSON válido: " + configPath);
  }

  const rules = typeof config.proxyRules === "string" ? config.proxyRules.trim() : "";
  // Accept one explicit proxy endpoint only. Do not permit direct:// fallback.
  if (!/^(https?|socks4|socks5):\/\/[A-Za-z0-9.-]+:\d{1,5}$/i.test(rules)) {
    throw new Error(
      "proxyRules no es válido. Usa un único servidor, por ejemplo http://proxy.ejemplo.com:8080 o socks5://127.0.0.1:1080. No uses direct:// ni reglas de respaldo."
    );
  }
  return rules;
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 800,
    minHeight: 600,
    title: PROXY_MODE ? "TikTok Desktop Proxy" : "TikTok Desktop",
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

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (isAllowedTikTokUrl(url)) return { action: "allow" };
    openExternalSafely(url);
    return { action: "deny" };
  });

  win.webContents.on("will-navigate", (event, url) => {
    if (isAllowedTikTokUrl(url)) return;
    event.preventDefault();
    openExternalSafely(url);
  });

  win.webContents.on("will-redirect", (event, url) => {
    if (isAllowedTikTokUrl(url)) return;
    event.preventDefault();
    openExternalSafely(url);
  });

  win.webContents.session.setPermissionRequestHandler(
    (_webContents, _permission, callback) => callback(false)
  );
  win.webContents.session.setPermissionCheckHandler(() => false);
  win.webContents.on("will-attach-webview", (event) => event.preventDefault());

  win.loadURL(TIKTOK_URL).catch(() => {
    if (!win.isDestroyed()) {
      win.webContents.loadURL("about:blank").catch(() => {});
      win.setTitle("TikTok Desktop - no se pudo abrir de forma segura");
    }
  });
}

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

  app.whenReady().then(async () => {
    if (PROXY_MODE) {
      try {
        const proxyRules = readProxyRules();
        await session.defaultSession.setProxy({
          mode: "fixed_servers",
          proxyRules
        });
        await session.defaultSession.closeAllConnections();
      } catch (error) {
        dialog.showErrorBox(
          "TikTok Desktop Proxy no está configurado",
          String(error && error.message ? error.message : error)
        );
        app.quit();
        return;
      }
    }

    createWindow();
    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  }).catch((error) => {
    dialog.showErrorBox("TikTok Desktop", "No se pudo iniciar de forma segura. " + String(error));
    app.quit();
  });
}

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
