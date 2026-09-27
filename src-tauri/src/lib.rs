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

/// A formula file of the library: where it is, its name without `.json`, and when it
/// last changed (milliseconds since 1970).
#[derive(serde::Serialize)]
struct FormulaFile {
    path: String,
    name: String,
    modified_ms: u64,
}

/// Lists the formulas of the library (P44), the most recent first. A folder that does
/// not exist yet is an empty library, not an error.
#[tauri::command]
fn list_formulas(dir: String) -> Result<Vec<FormulaFile>, String> {
    let entries = match fs::read_dir(&dir) {
        Ok(entries) => entries,
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => return Ok(Vec::new()),
        Err(e) => return Err(format!("{dir}: {e}")),
    };
    let mut files = Vec::new();
    for entry in entries.flatten() {
        let path = entry.path();
        let is_json = path.extension().and_then(|e| e.to_str()).is_some_and(|e| e.eq_ignore_ascii_case("json"));
        let Ok(meta) = entry.metadata() else { continue };
        if !is_json || !meta.is_file() {
            continue;
        }
        let modified_ms = meta
            .modified()
            .ok()
            .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
            .map_or(0, |d| d.as_millis() as u64);
        let name = path.file_stem().map(|s| s.to_string_lossy().into_owned()).unwrap_or_default();
        files.push(FormulaFile { path: path.to_string_lossy().into_owned(), name, modified_ms });
    }
    files.sort_by(|a, b| b.modified_ms.cmp(&a.modified_ms));
    Ok(files)
}

/// Renames a formula file when its formula changes name. Never over another file.
#[tauri::command]
fn move_file(from: String, to: String) -> Result<(), String> {
    if std::path::Path::new(&to).exists() {
        return Err(format!("{to}: ya existe"));
    }
    fs::rename(&from, &to).map_err(|e| format!("{from} → {to}: {e}"))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![read_text_file, write_text_file, list_formulas, move_file])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod tests {
    use super::*;

    fn scratch(name: &str) -> std::path::PathBuf {
        let dir = std::env::temp_dir().join(format!("perfumeria-test-{name}-{}", std::process::id()));
        let _ = fs::remove_dir_all(&dir);
        dir
    }

    #[test]
    fn a_missing_library_is_empty_and_a_new_one_is_made_on_the_first_write() {
        let dir = scratch("library");
        let dir_s = dir.to_string_lossy().into_owned();
        assert!(list_formulas(dir_s.clone()).unwrap().is_empty());
        write_text_file(dir.join("Lejía.json").to_string_lossy().into_owned(), "{}".into()).unwrap();
        write_text_file(dir.join("notas.txt").to_string_lossy().into_owned(), "x".into()).unwrap();
        let files = list_formulas(dir_s).unwrap();
        assert_eq!(files.len(), 1);
        assert_eq!(files[0].name, "Lejía");
        assert!(!dir.join("Lejía.json.tmp").exists());
        fs::remove_dir_all(&dir).unwrap();
    }

    #[test]
    fn a_rename_never_lands_on_another_formula() {
        let dir = scratch("move");
        let a = dir.join("A.json").to_string_lossy().into_owned();
        let b = dir.join("B.json").to_string_lossy().into_owned();
        let c = dir.join("C.json").to_string_lossy().into_owned();
        write_text_file(a.clone(), "a".into()).unwrap();
        write_text_file(b.clone(), "b".into()).unwrap();
        assert!(move_file(a.clone(), b.clone()).is_err());
        assert_eq!(read_text_file(b.clone()).unwrap(), "b");
        move_file(a.clone(), c.clone()).unwrap();
        assert_eq!(read_text_file(c).unwrap(), "a");
        assert!(read_text_file(a).is_err());
        fs::remove_dir_all(&dir).unwrap();
    }
}
