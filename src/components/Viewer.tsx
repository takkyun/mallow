import { useEffect, useState } from 'react';
import { readFile } from '../lib/tauri';
import type { FileEntry } from '../lib/types';
import { ConfigView } from './ConfigView';
import { MarkdownView } from './MarkdownView';
import { MermaidView } from './MermaidView';

interface ViewerProps {
  file: FileEntry | null;
  /** Bumped by the watcher when the open file changes on disk, forcing a re-read. */
  reloadToken: number;
}

export function Viewer({ file, reloadToken }: ViewerProps) {
  const [content, setContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!file) {
      setContent(null);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    readFile(file.path)
      .then((text) => {
        if (!cancelled) setContent(text);
      })
      .catch((e) => {
        if (!cancelled) {
          setError(String(e));
          setContent(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [file?.path, reloadToken]);

  if (!file) {
    return (
      <main className="viewer viewer--empty">
        <p>ファイルを選択してください</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="viewer">
        <div className="viewer__placeholder is-error">
          <code>{file.path}</code>
          <p>{error}</p>
        </div>
      </main>
    );
  }

  if (content === null) {
    return (
      <main className="viewer">
        {loading && <div className="viewer__placeholder">読み込み中…</div>}
      </main>
    );
  }

  return (
    <main className="viewer">
      <ViewerBody key={file.path} file={file} content={content} />
    </main>
  );
}

function ViewerBody({ file, content }: { file: FileEntry; content: string }) {
  switch (file.kind) {
    case 'markdown':
      return <MarkdownView source={content} />;
    case 'mermaid':
      return <MermaidView source={content} />;
    case 'json':
    case 'yaml':
    case 'toml':
      return <ConfigView source={content} file={file} />;
    default:
      return (
        <div className="doc-scroll">
          <div className="doc">
            <pre className="raw-view">{content}</pre>
          </div>
        </div>
      );
  }
}
