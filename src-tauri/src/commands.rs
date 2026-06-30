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

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use std::path::PathBuf;
    use std::sync::atomic::{AtomicU32, Ordering as AtomicOrdering};

    static COUNTER: AtomicU32 = AtomicU32::new(0);

    /// Minimal self-cleaning temp directory, so the tests don't pull in a
    /// `tempfile` dev-dependency.
    struct TempDir(PathBuf);

    impl TempDir {
        fn new() -> Self {
            let n = COUNTER.fetch_add(1, AtomicOrdering::SeqCst);
            let dir = std::env::temp_dir().join(format!("mallow-test-{}-{n}", std::process::id()));
            fs::create_dir_all(&dir).unwrap();
            TempDir(dir)
        }

        fn path(&self) -> &Path {
            &self.0
        }

        fn s(&self, child: &str) -> String {
            self.0.join(child).to_string_lossy().to_string()
        }
    }

    impl Drop for TempDir {
        fn drop(&mut self) {
            let _ = fs::remove_dir_all(&self.0);
        }
    }

    #[test]
    fn file_kind_maps_supported_extensions() {
        assert_eq!(file_kind("readme.md").as_deref(), Some("markdown"));
        assert_eq!(file_kind("notes.markdown").as_deref(), Some("markdown"));
        assert_eq!(file_kind("flow.mmd").as_deref(), Some("mermaid"));
        assert_eq!(file_kind("flow.mermaid").as_deref(), Some("mermaid"));
        assert_eq!(file_kind("data.json").as_deref(), Some("json"));
        assert_eq!(file_kind("log.ndjson").as_deref(), Some("json"));
        assert_eq!(file_kind("c.yml").as_deref(), Some("yaml"));
        assert_eq!(file_kind("Cargo.toml").as_deref(), Some("toml"));
        // Extension matching is case-insensitive.
        assert_eq!(file_kind("DATA.JSON").as_deref(), Some("json"));
    }

    #[test]
    fn file_kind_rejects_unsupported_and_extensionless() {
        assert_eq!(file_kind("photo.png"), None);
        assert_eq!(file_kind("Makefile"), None);
        assert_eq!(file_kind(".gitignore"), None);
    }

    #[test]
    fn read_dir_tree_filters_unsupported_files_and_sorts_dirs_first() {
        let tmp = TempDir::new();
        fs::create_dir(tmp.path().join("zsub")).unwrap();
        fs::create_dir(tmp.path().join("Asub")).unwrap();
        fs::write(tmp.path().join("b.md"), "x").unwrap();
        fs::write(tmp.path().join("a.json"), "{}").unwrap();
        fs::write(tmp.path().join("skip.png"), "x").unwrap(); // unsupported
        fs::write(tmp.path().join("noext"), "x").unwrap(); // no extension

        let entries = read_dir_tree(tmp.path().to_string_lossy().to_string()).unwrap();
        let names: Vec<&str> = entries.iter().map(|e| e.name.as_str()).collect();
        // Directories first (case-insensitive), then the supported files.
        assert_eq!(names, vec!["Asub", "zsub", "a.json", "b.md"]);

        let asub = entries.iter().find(|e| e.name == "Asub").unwrap();
        assert!(asub.is_dir);
        assert_eq!(asub.kind, "directory");
        assert_eq!(entries.iter().find(|e| e.name == "a.json").unwrap().kind, "json");
    }

    #[test]
    fn read_dir_tree_errors_on_missing_path() {
        let tmp = TempDir::new();
        assert!(read_dir_tree(tmp.s("does-not-exist")).is_err());
    }

    #[test]
    fn read_file_reads_utf8_contents() {
        let tmp = TempDir::new();
        fs::write(tmp.path().join("a.txt"), "hello world").unwrap();
        assert_eq!(read_file(tmp.s("a.txt")).unwrap(), "hello world");
    }

    #[test]
    fn read_file_errors_on_missing_file() {
        let tmp = TempDir::new();
        assert!(read_file(tmp.s("nope.txt")).is_err());
    }

    #[test]
    fn read_file_rejects_oversized_files() {
        let tmp = TempDir::new();
        let file = fs::File::create(tmp.path().join("big.bin")).unwrap();
        // Sparse: report a length over the cap without writing the bytes.
        file.set_len(MAX_FILE_SIZE + 1).unwrap();
        drop(file);
        let err = read_file(tmp.s("big.bin")).unwrap_err();
        assert!(err.contains("too large"), "unexpected error: {err}");
    }

    #[test]
    fn path_exists_reports_presence() {
        let tmp = TempDir::new();
        fs::write(tmp.path().join("here.txt"), "x").unwrap();
        assert!(path_exists(tmp.s("here.txt")));
        assert!(path_exists(tmp.path().to_string_lossy().to_string()));
        assert!(!path_exists(tmp.s("absent")));
    }
}
