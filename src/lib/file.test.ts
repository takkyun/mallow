import { describe, expect, it } from 'vitest';
import { fileEntryFromPath, kindFromName } from './file';

describe('kindFromName', () => {
  it('maps supported extensions (case-insensitive)', () => {
    expect(kindFromName('README.md')).toBe('markdown');
    expect(kindFromName('flow.mmd')).toBe('mermaid');
    expect(kindFromName('data.JSON')).toBe('json');
    expect(kindFromName('config.yml')).toBe('yaml');
    expect(kindFromName('Cargo.toml')).toBe('toml');
  });

  it('defaults to markdown for anything else', () => {
    expect(kindFromName('notes.txt')).toBe('markdown');
    expect(kindFromName('Makefile')).toBe('markdown');
  });
});

describe('fileEntryFromPath', () => {
  it('takes the file name from a POSIX path', () => {
    const entry = fileEntryFromPath('/Users/me/docs/README.md');
    expect(entry.name).toBe('README.md');
    expect(entry.kind).toBe('markdown');
    expect(entry.isDir).toBe(false);
    expect(entry.path).toBe('/Users/me/docs/README.md');
  });

  it('takes the file name from a Windows path', () => {
    const entry = fileEntryFromPath('C:\\Users\\me\\docs\\README.md');
    expect(entry.name).toBe('README.md');
    expect(entry.kind).toBe('markdown');
    // The original path is preserved verbatim so it matches Rust's tree entries.
    expect(entry.path).toBe('C:\\Users\\me\\docs\\README.md');
  });
});
