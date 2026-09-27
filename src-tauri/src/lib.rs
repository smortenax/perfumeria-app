use std::fs;

/// Reads a formula file the user chose in a dialog.
#[tauri::command]
fn read_text_file(path: String) -> Result<String, String> {
    fs::read_to_string(&path).map_err(|e| format!("{path}: {e}"))
}

/// Writes a formula file, or the user's preferences: first to a temporary file
/// next to it, then renamed over the original, so a failed write never leaves
/// half a file on disk. Its folder is made if missing (the app's data folder).
#[tauri::command]
fn write_text_file(path: String, contents: String) -> Result<(), String> {
    if let Some(parent) = std::path::Path::new(&path).parent() {
        fs::create_dir_all(parent).map_err(|e| format!("{}: {e}", parent.display()))?;
    }
    let tmp = format!("{path}.tmp");
    fs::write(&tmp, contents).map_err(|e| format!("{tmp}: {e}"))?;
    fs::rename(&tmp, &path).map_err(|e| format!("{path}: {e}"))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![read_text_file, write_text_file])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
