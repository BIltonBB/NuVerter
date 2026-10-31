# NuVerter Tauri (lightweight desktop)

Requires Rust: https://rustup.rs

## Dev
```
cd tauri
cargo tauri dev
```

## Build
```
cd tauri
cargo tauri build
```
On low-RAM machines, a plain `cargo build --release` with `CARGO_PROFILE_RELEASE_OPT_LEVEL=0` also works and still uses the system webview.

Output in `tauri/src-tauri/target/release/bundle`.

## Notes
- Frontend is loaded from `../web` (same UI as the web/Electron builds).
- COOP/COEP headers are set by Tauri's webview config; FFmpeg.wasm works on localhost dev server.
- Auto-update: configure `plugins.updater` with a pubkey + endpoint, then publish signed releases.
- System webview is used, so idle RAM is ~30-60 MB instead of Electron's ~300 MB.
