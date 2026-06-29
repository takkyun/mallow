/** Frontend side of the Rust filesystem watcher (watch.rs). */
import { invoke } from '@tauri-apps/api/core';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';

/** Start watching a folder recursively (replaces any previous watch). */
export function startWatch(path: string): Promise<void> {
  return invoke('start_watch', { path });
}

export function stopWatch(): Promise<void> {
  return invoke('stop_watch');
}

/** Subscribe to `fs:change` events (a list of changed paths). */
export function onFsChange(callback: (paths: string[]) => void): Promise<UnlistenFn> {
  return listen<string[]>('fs:change', (event) => callback(event.payload));
}
