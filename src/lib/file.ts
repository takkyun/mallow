/** Frontend mirror of the Rust `file_kind` mapping, for synthesizing a FileEntry
 *  from a bare path (e.g. when restoring the last-opened file on launch). */
import { basename } from './path';
import type { FileEntry, FileKind } from './types';

export function kindFromName(name: string): FileKind {
  const ext = name.includes('.') ? name.slice(name.lastIndexOf('.') + 1).toLowerCase() : '';
  switch (ext) {
    case 'md':
    case 'markdown':
      return 'markdown';
    case 'mmd':
    case 'mermaid':
      return 'mermaid';
    case 'json':
    case 'jsonc':
    case 'json5':
    case 'jsonl':
    case 'ndjson':
      return 'json';
    case 'yaml':
    case 'yml':
      return 'yaml';
    case 'toml':
      return 'toml';
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'webp':
    case 'svg':
    // heic/heif only render on macOS; the backend gates them out of the tree on
    // other platforms, so the frontend can map them unconditionally.
    case 'heic':
    case 'heif':
      return 'image';
    case 'pdf':
      return 'pdf';
    case 'webm':
    case 'mp4':
    case 'mov':
      return 'video';
    default:
      return 'markdown';
  }
}

export function fileEntryFromPath(path: string): FileEntry {
  const name = basename(path);
  return { name, path, isDir: false, kind: kindFromName(name) };
}
