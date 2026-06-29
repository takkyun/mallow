//! Recursive filesystem watcher. Emits a `fs:change` event (a list of changed
//! paths) to the frontend, which debounces and reacts (re-render / tree refresh).

use std::path::Path;
use std::sync::Mutex;

use notify::{RecommendedWatcher, RecursiveMode, Watcher};
use tauri::{AppHandle, Emitter, State};

/// Holds the active watcher so it isn't dropped. Replacing it stops the old one.
#[derive(Default)]
pub struct WatcherState(pub Mutex<Option<RecommendedWatcher>>);

/// Watch `path` recursively, replacing any previously active watcher.
#[tauri::command]
pub fn start_watch(path: String, app: AppHandle, state: State<WatcherState>) -> Result<(), String> {
    let app_handle = app.clone();
    let mut watcher = notify::recommended_watcher(move |res: notify::Result<notify::Event>| {
        if let Ok(event) = res {
            let paths: Vec<String> = event.paths.iter().map(|p| p.to_string_lossy().to_string()).collect();
            if !paths.is_empty() {
                let _ = app_handle.emit("fs:change", paths);
            }
        }
    })
    .map_err(|e| e.to_string())?;

    watcher
        .watch(Path::new(&path), RecursiveMode::Recursive)
        .map_err(|e| e.to_string())?;

    // Dropping the previous watcher (if any) stops it.
    *state.0.lock().map_err(|e| e.to_string())? = Some(watcher);
    Ok(())
}

/// Stop watching (drops the active watcher).
#[tauri::command]
pub fn stop_watch(state: State<WatcherState>) -> Result<(), String> {
    *state.0.lock().map_err(|e| e.to_string())? = None;
    Ok(())
}
