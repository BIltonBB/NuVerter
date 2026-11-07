#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::fs;
use std::path::PathBuf;
use tauri::Manager;
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

#[tauri::command]
async fn select_storage_dir(app: tauri::AppHandle) -> Option<String> {
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

#[tauri::command]
fn get_app_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

#[tauri::command]
fn uninstall_app(app: tauri::AppHandle) {
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
    // Fallback: open Programs and Features
    let _ = Command::new("cmd").args(["/c", "start", "appwiz.cpl"]).spawn();
    app.exit(0);
}

#[tauri::command]
fn log_debug(msg: String) {
    let _ = std::fs::write("C:\\Users\\user\\frontend-debug.txt", msg);
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

#[tauri::command]
async fn check_update(app: tauri::AppHandle) -> Result<Option<String>, String> {
    let log = app.path().app_data_dir().unwrap_or_else(|_| std::path::PathBuf::from(".")).join("updater-error.log");
    let updater = match app.updater() {
        Ok(u) => u,
        Err(e) => {
            let _ = std::fs::write(&log, format!("updater() err: {}", e));
            return Err(e.to_string());
        }
    };
    match updater.check().await {
        Ok(Some(update)) => {
            let _ = std::fs::write(&log, format!("update available: {}", update.version));
            Ok(Some(update.version.clone()))
        }
        Ok(None) => {
            let _ = std::fs::write(&log, "no update available".to_string());
            Ok(None)
        }
        Err(e) => {
            let _ = std::fs::write(&log, format!("check err: {}", e));
            Err(e.to_string())
        }
    }
}

#[tauri::command]
async fn install_update(app: tauri::AppHandle) -> Result<(), String> {
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
    app.restart();
}

fn main() {
    let _ = std::fs::write("C:\\Users\\user\\tauri-started.txt", "started");
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .setup(|app| {
            #[cfg(target_os = "windows")]
            if let Some(window) = app.get_webview_window("main") {
                let _ = window_vibrancy::apply_mica(&window, None);
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_user_data_path,
            log_debug,
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
            install_update
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}