import { useEffect, useRef, useState } from 'react';
import { detectEditors, openInEditor, revealInOs } from '../lib/tauri';
import type { EditorInfo, FileEntry } from '../lib/types';

function revealLabel(): string {
  const p = navigator.platform.toLowerCase();
  if (p.includes('mac')) return 'Finder';
  if (p.includes('win')) return 'エクスプローラ';
  return 'ファイルマネージャ';
}

export function OpenWith({ file }: { file: FileEntry | null }) {
  const [editors, setEditors] = useState<EditorInfo[]>([]);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    detectEditors()
      .then(setEditors)
      .catch((e) => console.error('detectEditors failed', e));
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const disabled = !file;

  function openIn(id: string) {
    if (file) void openInEditor(id, file.path).catch((e) => console.error(e));
    setOpen(false);
  }

  function reveal() {
    if (file) void revealInOs(file.path).catch((e) => console.error(e));
    setOpen(false);
  }

  return (
    <div className="menu" ref={rootRef}>
      <button
        type="button"
        className="btn"
        disabled={disabled}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        開く ▾
      </button>
      {open && !disabled && (
        <div className="menu__popup" role="menu">
          {editors.length === 0 && <div className="menu__empty">対応エディタが見つかりません</div>}
          {editors.map((ed) => (
            <button key={ed.id} type="button" className="menu__item" role="menuitem" onClick={() => openIn(ed.id)}>
              {ed.label} で開く
            </button>
          ))}
          <div className="menu__sep" />
          <button type="button" className="menu__item" role="menuitem" onClick={reveal}>
            {revealLabel()} で表示
          </button>
        </div>
      )}
    </div>
  );
}
