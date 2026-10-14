# TikTok Desktop

A Windows desktop wrapper for the official TikTok website. It has two separate builds:

- **TikTok Desktop** — normal connection, like the original app.
- **TikTok Desktop Proxy** — sends its Electron browser session through one explicitly configured proxy. It fails closed if the proxy is missing or invalid; it does not silently fall back to a direct connection.

## Requirements

- Windows 10/11
- Node.js 20 or newer (Node.js LTS recommended)

## Run the normal version

```bash
npm install
npm start
```

## Build the two separate Windows installers

```bash
npm install
npm run dist:all
```

The installers are output to `dist/normal/` and `dist/proxy/`. To build only one version, use `npm run dist:normal` or `npm run dist:proxy`.

The builds use different application IDs and product names so they can be installed separately. Build artifacts have not been tested on every Windows machine.

## Configure the proxy version

The proxy build requires a proxy server you trust; the app does not provide or create a proxy service.

1. Launch **TikTok Desktop Proxy** once. If no configuration exists, it creates a sample file and displays its location, then exits without connecting directly.
2. Open that `proxy-config.json` file in a text editor.
3. Replace the example with your actual proxy endpoint, for example:

   ```json
   {
     "proxyRules": "http://proxy.example.com:8080"
   }
   ```

   Or, if your provider explicitly gives you a SOCKS5 endpoint:

   ```json
   {
     "proxyRules": "socks5://127.0.0.1:1080"
   }
   ```

4. Save the file and reopen the proxy app.

Use the exact host and port supplied by your proxy provider. This simple configuration does not support proxy credentials. Do not use a proxy you do not trust, and do not assume a proxy guarantees anonymity or prevents every attack. If the proxy is down or incorrectly configured, the proxy version will show an error and quit rather than silently connect directly.

## Security notes

- The app loads TikTok's official website; it is not an official TikTok app.
- Renderer Node.js integration is disabled; context isolation and sandboxing are enabled.
- Unneeded browser permissions are denied and untrusted navigation is blocked.
- TLS certificate validation is not disabled.
- The proxy setting applies to the Electron session used by the app; links opened in the system browser are handled by that browser and are not covered by the app's proxy.
- A proxy changes the IP address seen by destinations only when traffic actually passes through that proxy. It does not by itself prevent attacks against your home Internet connection.
- TikTok may change its site or restrict embedded Chromium/Electron windows.
- No software can be guaranteed to always work or be immune to every attack.
- The app is a normal desktop process, not hidden from Task Manager, antivirus, or security monitoring. This project does not bypass TikTok restrictions, ads, login requirements, or security controls.
