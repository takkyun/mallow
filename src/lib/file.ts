/** Frontend mirror of the Rust `file_kind` mapping, for synthesizing a FileEntry
 *  from a bare path (e.g. when restoring the last-opened file on launch). */
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
    default:
      return 'markdown';
  }
}

export function fileEntryFromPath(path: string): FileEntry {
  const name = path.split('/').filter(Boolean).pop() || path;
  return { name, path, isDir: false, kind: kindFromName(name) };
}

/** Directory paths between `root` (exclusive) and `file` (its parent, inclusive),
 *  so the tree can be expanded to reveal a restored file. */
export function ancestorDirs(root: string, file: string): string[] {
  if (!file.startsWith(root)) return [];
  const rel = file.slice(root.length).replace(/^\/+/, '');
  const parts = rel.split('/');
  parts.pop(); // drop the file name
  const dirs: string[] = [];
  let current = root.replace(/\/+$/, '');
  for (const part of parts) {
    current = `${current}/${part}`;
    dirs.push(current);
  }
  return dirs;
}
