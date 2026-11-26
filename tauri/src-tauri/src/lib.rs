use std::fs;
use std::path::PathBuf;
use tauri::Manager;
#[cfg(desktop)]
use tauri_plugin_updater::UpdaterExt;

fn config_path(app: &tauri::AppHandle) -> PathBuf {
    app.path().app_data_dir().unwrap_or_else(|_| PathBuf::from(".")).join("nuverter-config.json")
}

fn read_config(app: &tauri::AppHandle) -> serde_json::Value {
    let p = config_path(app);
    fs::read_to_string(p)
        .ok()
        .and_then(|s| serde_json::from_str(&s).ok())
        .unwrap_or_else(|| serde_json::json!({}))
}

fn write_config(app: &tauri::AppHandle, cfg: &serde_json::Value) {
    let p = config_path(app);
    if let Some(parent) = p.parent() {
        let _ = fs::create_dir_all(parent);
    }
    let _ = fs::write(p, serde_json::to_string_pretty(cfg).unwrap_or_default());
}

fn storage_root(app: &tauri::AppHandle) -> PathBuf {
    let cfg = read_config(app);
    if let Some(s) = cfg.get("storageRoot").and_then(|v| v.as_str()) {
        let p = PathBuf::from(s);
        if p.exists() {
            return p;
        }
    }
    app.path().app_data_dir().unwrap_or_else(|_| PathBuf::from("."))
}

fn ensure_dir(p: &PathBuf) -> PathBuf {
    if !p.exists() {
        let _ = fs::create_dir_all(p);
    }
    p.clone()
}

#[tauri::command]
fn get_user_data_path(app: tauri::AppHandle) -> String {
    app.path().app_data_dir().unwrap_or_else(|_| PathBuf::from(".")).to_string_lossy().to_string()
}

#[tauri::command]
fn get_storage_root(app: tauri::AppHandle) -> String {
    storage_root(&app).to_string_lossy().to_string()
}

#[tauri::command]
fn set_storage_root(app: tauri::AppHandle, dir: Option<String>) -> bool {
    let mut cfg = read_config(&app);
    match dir {
        Some(d) if !d.is_empty() => {
            let p = PathBuf::from(&d);
            if fs::create_dir_all(&p).is_ok() {
                cfg["storageRoot"] = serde_json::json!(d);
                write_config(&app, &cfg);
                return true;
            }
            false
        }
        _ => {
            if let Some(obj) = cfg.as_object_mut() {
                obj.remove("storageRoot");
            }
            write_config(&app, &cfg);
            true
        }
    }
}

#[cfg(desktop)]
#[tauri::command]
fn select_storage_dir(app: tauri::AppHandle) -> Option<String> {
    use tauri_plugin_dialog::DialogExt;
    let folder = app.dialog().file().blocking_pick_folder();
    if let Some(fp) = folder {
        let s = fp.to_string();
        let mut cfg = read_config(&app);
        let p = PathBuf::from(&s);
        if fs::create_dir_all(&p).is_ok() {
            cfg["storageRoot"] = serde_json::json!(s);
            write_config(&app, &cfg);
            return Some(s);
        }
    }
    None
}

#[cfg(mobile)]
#[tauri::command]
fn select_storage_dir(_app: tauri::AppHandle) -> Option<String> {
    // Folder pickers are desktop-only in the dialog plugin; mobile storage is app-private.
    None
}

#[tauri::command]
fn get_app_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

#[cfg(desktop)]
#[tauri::command]
fn uninstall_app(app: tauri::AppHandle) {
    #[cfg(target_os = "windows")]
    {
        use std::process::Command;
        if let Ok(exe) = std::env::current_exe() {
            if let Some(dir) = exe.parent() {
                for name in ["Uninstall NuVerter.exe", "uninstall.exe", "Uninstall.exe", "unins000.exe"] {
                    let unins = dir.join(name);
                    if unins.exists() {
                        let _ = Command::new(&unins).spawn();
                        app.exit(0);
                        return;
                    }
                }
            }
        }
        let _ = Command::new("cmd").args(["/c", "start", "appwiz.cpl"]).spawn();
    }
    app.exit(0);
}

#[cfg(mobile)]
#[tauri::command]
fn uninstall_app(app: tauri::AppHandle) {
    // Mobile apps are removed from the system settings; nothing to launch here.
    let _ = app;
}

#[tauri::command]
fn get_models_path(app: tauri::AppHandle) -> String {
    let p = ensure_dir(&storage_root(&app).join("models"));
    p.to_string_lossy().to_string()
}

#[tauri::command]
fn write_file(app: tauri::AppHandle, name: String, data: Vec<u8>) -> Result<String, String> {
    let dir = ensure_dir(&storage_root(&app).join("files"));
    let path = dir.join(name);
    fs::write(&path, data).map_err(|e| e.to_string())?;
    Ok(path.to_string_lossy().to_string())
}

#[tauri::command]
fn read_file(app: tauri::AppHandle, name: String) -> Option<Vec<u8>> {
    let path = storage_root(&app).join("files").join(name);
    fs::read(path).ok()
}

#[tauri::command]
fn list_files(app: tauri::AppHandle) -> Vec<String> {
    let dir = ensure_dir(&storage_root(&app).join("files"));
    fs::read_dir(dir)
        .ok()
        .map(|rd| rd.filter_map(|e| e.ok()).map(|e| e.file_name().to_string_lossy().to_string()).collect())
        .unwrap_or_default()
}

#[cfg(desktop)]
#[tauri::command]
async fn check_update(app: tauri::AppHandle) -> Result<Option<String>, String> {
    let updater = app.updater().map_err(|e| e.to_string())?;
    match updater.check().await {
        Ok(Some(update)) => Ok(Some(update.version.clone())),
        Ok(None) => Ok(None),
        Err(e) => Err(e.to_string()),
    }
}

#[cfg(mobile)]
#[tauri::command]
async fn check_update(_app: tauri::AppHandle) -> Result<Option<String>, String> {
    // The desktop updater plugin is not available on mobile. The web layer
    // falls back to the GitHub releases API and opens the APK download.
    Err("in-app updates are desktop only".to_string())
}

// Writes a download into the file the user picked with the system save dialog.
// The dialog returns a content:// URI on Android, which only the fs plugin's
// Android bridge can turn into a file descriptor, so the bytes arrive as the
// raw IPC body and the target URI rides along as a percent-encoded header.
#[cfg(mobile)]
#[tauri::command]
fn save_to_uri(app: tauri::AppHandle, request: tauri::ipc::Request<'_>) -> Result<(), String> {
    use std::io::Write;
    use tauri_plugin_fs::{FilePath, FsExt, OpenOptions};

    let uri = request
        .headers()
        .get("x-target-uri")
        .and_then(|v| v.to_str().ok())
        .map(percent_decode)
        .filter(|s| !s.is_empty())
        .ok_or_else(|| "missing target uri".to_string())?;

    // Android has no raw IPC body: the webview JSON-serializes the bytes into a
    // number array. Desktop (and the channel API) send ArrayBuffer instead. Take both.
    let bytes = match request.body() {
        tauri::ipc::InvokeBody::Raw(data) => data.clone(),
        tauri::ipc::InvokeBody::Json(serde_json::Value::Array(data)) => data
            .iter()
            .map(|v| {
                v.as_u64()
                    .and_then(|v| u8::try_from(v).ok())
                    .ok_or_else(|| "invalid byte in the file data".to_string())
            })
            .collect::<Result<Vec<u8>, String>>()?,
        _ => return Err("unexpected file data".to_string()),
    };

    let target = tauri::Url::parse(&uri).map_err(|e| format!("invalid target uri: {e}"))?;
    let mut opts = OpenOptions::new();
    opts.read(false).write(true).truncate(true);
    let mut file = app
        .fs()
        .open(FilePath::Url(target), opts)
        .map_err(|e| format!("could not open the chosen file: {e}"))?;
    file.write_all(&bytes).map_err(|e| format!("could not write the file: {e}"))?;
    file.flush().map_err(|e| format!("could not flush the file: {e}"))?;
    Ok(())
}

#[cfg(mobile)]
fn percent_decode(input: &str) -> String {
    let bytes = input.as_bytes();
    let mut out = Vec::with_capacity(bytes.len());
    let mut i = 0;
    while i < bytes.len() {
        if bytes[i] == b'%' && i + 2 < bytes.len() {
            let hi = (bytes[i + 1] as char).to_digit(16);
            let lo = (bytes[i + 2] as char).to_digit(16);
            if let (Some(hi), Some(lo)) = (hi, lo) {
                out.push((hi * 16 + lo) as u8);
                i += 3;
                continue;
            }
        }
        out.push(bytes[i]);
        i += 1;
    }
    String::from_utf8_lossy(&out).into_owned()
}

#[cfg(desktop)]
#[tauri::command]
fn save_to_uri(_app: tauri::AppHandle, _request: tauri::ipc::Request<'_>) -> Result<(), String> {
    Err("native save is mobile only".to_string())
}

#[tauri::command]
fn open_url(app: tauri::AppHandle, url: String) -> Result<(), String> {
    use tauri_plugin_opener::OpenerExt;
    app.opener().open_url(url, None::<&str>).map_err(|e| e.to_string())
}

#[cfg(desktop)]
#[tauri::command]
async fn install_update(app: tauri::AppHandle, url: Option<String>) -> Result<(), String> {
    let log = app.path().app_data_dir().unwrap_or_else(|_| std::path::PathBuf::from(".")).join("install-error.log");
    let (invoke_result, open_url) = (
        async {
            let updater = app.updater().map_err(|e| e.to_string())?;
            let update = updater
                .check()
                .await
                .map_err(|e| e.to_string())?
                .ok_or_else(|| "no update available".to_string())?;
            update
                .download_and_install(|_, _| {}, || {})
                .await
                .map_err(|e| e.to_string())?;
            Ok::<(), String>(())
        }
        .await,
        url,
    );

    match invoke_result {
        Ok(()) => {
            let _ = std::fs::write(&log, "success, restarting".to_string());
            app.restart();
        }
        Err(e) => {
            let _ = std::fs::write(&log, format!("install err: {}", e));
            // Native updater failed (stale manifest, missing asset, signature, ...).
            // Always fall back to opening the release page so the Update button does something.
            if let Some(target) = open_url {
                use tauri_plugin_opener::OpenerExt;
                if app.opener().open_url(target, None::<&str>).is_ok() {
                    return Ok(());
                }
            }
            Err(e)
        }
    }
}

#[cfg(mobile)]
#[tauri::command]
async fn install_update(_app: tauri::AppHandle, _url: Option<String>) -> Result<(), String> {
    Err("in-app updates are desktop only".to_string())
}

// Tauri stages each downloaded updater payload in %TEMP%\NuVerter-<ver>-updater-*.
// The installer never removes that folder, so it piles up (~32 MB per update).
// Sweep it on startup; harmless if a file is locked (best effort).
#[cfg(desktop)]
fn cleanup_stale_updates() {
    let temp = std::env::temp_dir();
    if let Ok(entries) = fs::read_dir(&temp) {
        for entry in entries.flatten() {
            let name = entry.file_name().to_string_lossy().to_string();
            if name.starts_with("NuVerter-") && name.contains("-updater-") {
                let _ = fs::remove_dir_all(entry.path());
            }
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    #[cfg(desktop)]
    cleanup_stale_updates();

    let builder = tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init());
    #[cfg(mobile)]
    let builder = builder.plugin(tauri_plugin_fs::init());
    #[cfg(desktop)]
    let builder = builder.plugin(tauri_plugin_updater::Builder::new().build());

    builder
        .setup(|app| {
            #[cfg(target_os = "windows")]
            if let Some(window) = app.get_webview_window("main") {
                let _ = window_vibrancy::apply_mica(&window, None);
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_user_data_path,
            get_app_version,
            uninstall_app,
            get_storage_root,
            set_storage_root,
            select_storage_dir,
            get_models_path,
            write_file,
            read_file,
            list_files,
            check_update,
            install_update,
            open_url,
            save_to_uri
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

