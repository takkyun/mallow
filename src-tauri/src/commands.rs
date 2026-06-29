//! Filesystem commands exposed to the frontend.
//!
//! Reading is done with `std::fs` directly (not the fs plugin) so the user can
//! open any folder they pick via the native dialog without pre-declaring a scope.

use std::cmp::Ordering;
use std::path::Path;

/// Reject reading files larger than this to avoid loading huge blobs into the
/// WebView. 10 MiB comfortably covers any hand-authored markdown / config file.
const MAX_FILE_SIZE: u64 = 10 * 1024 * 1024;

/// A single entry in a directory listing returned to the frontend.
#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FileEntry {
    name: String,
    path: String,
    is_dir: bool,
    /// One of: "directory" | "markdown" | "mermaid" | "json" | "yaml" | "toml".
    kind: String,
}

/// Map a file name to a supported viewer category by extension, or `None` when
/// the file type is not one we display (so it gets filtered out of the tree).
fn file_kind(name: &str) -> Option<String> {
    let ext = name.rsplit('.').next()?;
    // No extension at all (rsplit yields the whole name when there is no dot).
    if !name.contains('.') {
        return None;
    }
    match ext.to_ascii_lowercase().as_str() {
        "md" | "markdown" => Some("markdown".into()),
        "mmd" | "mermaid" => Some("mermaid".into()),
        "json" | "jsonc" | "json5" | "jsonl" | "ndjson" => Some("json".into()),
        "yaml" | "yml" => Some("yaml".into()),
        "toml" => Some("toml".into()),
        _ => None,
    }
}

/// List the immediate children of `path`. Directories are always included;
/// files are included only when their extension maps to a supported `kind`.
/// Children are loaded lazily (one level at a time) as the user expands nodes.
#[tauri::command]
pub fn read_dir_tree(path: String) -> Result<Vec<FileEntry>, String> {
    let dir = std::fs::read_dir(&path).map_err(|e| format!("{path}: {e}"))?;
    let mut entries: Vec<FileEntry> = Vec::new();

    for entry in dir {
        let entry = entry.map_err(|e| e.to_string())?;
        let file_type = entry.file_type().map_err(|e| e.to_string())?;
        let name = entry.file_name().to_string_lossy().to_string();
        let full = entry.path().to_string_lossy().to_string();

        if file_type.is_dir() {
            entries.push(FileEntry { name, path: full, is_dir: true, kind: "directory".into() });
        } else if let Some(kind) = file_kind(&name) {
            entries.push(FileEntry { name, path: full, is_dir: false, kind });
        }
    }

    // Directories first, then files; each group sorted case-insensitively.
    entries.sort_by(|a, b| match (a.is_dir, b.is_dir) {
        (true, false) => Ordering::Less,
        (false, true) => Ordering::Greater,
        _ => a.name.to_lowercase().cmp(&b.name.to_lowercase()),
    });

    Ok(entries)
}

/// Read a text file as UTF-8, guarding against oversized files.
#[tauri::command]
pub fn read_file(path: String) -> Result<String, String> {
    let meta = std::fs::metadata(&path).map_err(|e| format!("{path}: {e}"))?;
    if meta.len() > MAX_FILE_SIZE {
        return Err(format!("File too large: {} bytes (max {MAX_FILE_SIZE})", meta.len()));
    }
    std::fs::read_to_string(&path).map_err(|e| format!("{path}: {e}"))
}

/// Whether a path currently exists (used to validate the restored session).
#[tauri::command]
pub fn path_exists(path: String) -> bool {
    Path::new(&path).exists()
}
