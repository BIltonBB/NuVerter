# Fully Web-Rendered Installer (future prompt)

Goal: Replace the NSIS wizard with a fully custom, web-rendered installer that matches the NuVerter web UI (dark/light theme, modern components).

Requirements:
- Installer is a small Tauri/Electron app (or webview) that runs the install flow in HTML/CSS/JS.
- Must support install, upgrade, repair, uninstall, and rollback.
- Must respect system light/dark theme and use the same design tokens as web/.
- Must be code-signed to avoid antivirus false positives (see notes below).
- Should bundle the app payload and extract it with progress UI.
- Should integrate with Windows Add/Remove Programs and create shortcuts.

Antivirus note:
- Avast/Defender may flag unsigned nuverter-tauri.exe and build artifacts as suspicious.
- Mitigation: code-sign binaries/installer with a trusted cert, avoid UPX/packing, and submit false-positive reports.
