# TikTok Desktop

A minimal Windows desktop wrapper that opens TikTok in its own app window instead of launching a separate browser.

## Features
- Opens the official `https://www.tiktok.com/` website.
- No TikTok password is collected or stored by this project.
- Electron's renderer has Node.js integration disabled, context isolation enabled, and sandboxing enabled.
- Links outside TikTok are opened in the system browser rather than being loaded inside the app.
- GitHub Actions can build a Windows installer (`.exe`).

## Requirements
- Windows 10/11
- Node.js 20 or newer (Node.js LTS recommended)

## Run locally
```bash
npm install
npm start
```

## Build the Windows installer
```bash
npm run dist
```
The installer will be placed in `dist/`.

## Build using GitHub Actions
1. Push the project to the `main` branch.
2. Open the repository's **Actions** tab and run **Build Windows EXE**, or push a commit to `main`.
3. Open the completed workflow run and download the `TikTok-Desktop-Windows-Installer` artifact.

## Important limitations
- This app displays TikTok's official website; it is not an official TikTok app.
- TikTok may block or change behavior in embedded Chromium/Electron windows. If that happens, the app may need updating or TikTok may require its supported browser.
- No software can honestly be guaranteed to always work or be immune to every attack. Keep Windows and dependencies updated, and only install builds you trust.
- The app runs as a normal desktop process; it is not hidden from Task Manager, antivirus, or security monitoring.
- This project does not bypass TikTok restrictions, ads, login requirements, or security controls.
