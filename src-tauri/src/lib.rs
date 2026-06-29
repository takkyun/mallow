mod commands;
mod editors;
mod watch;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .manage(watch::WatcherState::default())
        .invoke_handler(tauri::generate_handler![
            commands::read_dir_tree,
            commands::read_file,
            commands::path_exists,
            watch::start_watch,
            watch::stop_watch,
            editors::detect_editors,
            editors::open_in_editor,
            editors::reveal_in_os,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
