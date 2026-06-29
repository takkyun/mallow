import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { Explorer } from './components/Explorer';
import { Toolbar } from './components/Toolbar';
import { Viewer } from './components/Viewer';
import { useFileTree } from './hooks/useFileTree';
import { ancestorDirs, fileEntryFromPath } from './lib/file';
import { loadSettings, saveSetting } from './lib/settings';
import { pathExists, pickFolder } from './lib/tauri';
import type { FileEntry } from './lib/types';
import { onFsChange, startWatch } from './lib/watch';

const DEFAULT_WIDTH = 280;
const MIN_WIDTH = 180;
const MAX_WIDTH = 600;

export default function App() {
  const tree = useFileTree();
  const [selected, setSelected] = useState<FileEntry | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [explorerWidth, setExplorerWidth] = useState(DEFAULT_WIDTH);
  const [explorerSide, setExplorerSide] = useState<'left' | 'right'>('left');

  const selectedRef = useRef<FileEntry | null>(null);
  const widthRef = useRef(explorerWidth);
  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);
  useEffect(() => {
    widthRef.current = explorerWidth;
  }, [explorerWidth]);

  const { open: openTree, refresh, expandPaths } = tree;

  const selectFile = useCallback((entry: FileEntry) => {
    setSelected(entry);
    void saveSetting('lastFile', entry.path);
  }, []);

  const openFolder = useCallback(async () => {
    const dir = await pickFolder();
    if (!dir) return;
    setSelected(null);
    void saveSetting('lastFolder', dir);
    void saveSetting('lastFile', undefined);
    await openTree(dir);
    startWatch(dir).catch((e) => console.error('Failed to start watch', e));
  }, [openTree]);

  // ---- Session restore + settings (on launch) -------------------------------
  useEffect(() => {
    let disposed = false;
    (async () => {
      const s = await loadSettings();
      if (disposed) return;
      if (s.explorerWidth) setExplorerWidth(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, s.explorerWidth)));
      if (s.explorerSide) setExplorerSide(s.explorerSide);

      if (s.lastFolder && (await pathExists(s.lastFolder))) {
        await openTree(s.lastFolder);
        startWatch(s.lastFolder).catch((e) => console.error('Failed to start watch', e));
        if (s.lastFile && s.lastFile.startsWith(s.lastFolder) && (await pathExists(s.lastFile))) {
          await expandPaths(ancestorDirs(s.lastFolder, s.lastFile));
          if (!disposed) setSelected(fileEntryFromPath(s.lastFile));
        }
      }
    })().catch((e) => console.error('Session restore failed', e));
    return () => {
      disposed = true;
    };
  }, [openTree, expandPaths]);

  // ---- Filesystem watch (debounced) -----------------------------------------
  useEffect(() => {
    let unlisten: (() => void) | undefined;
    let disposed = false;
    const changed = new Set<string>();
    let timer = 0;

    const flush = () => {
      const paths = Array.from(changed);
      changed.clear();
      const sel = selectedRef.current;
      if (sel && paths.includes(sel.path)) setReloadToken((t) => t + 1);
      void refresh();
    };

    onFsChange((paths) => {
      paths.forEach((p) => changed.add(p));
      window.clearTimeout(timer);
      timer = window.setTimeout(flush, 150);
    }).then((fn) => {
      if (disposed) fn();
      else unlisten = fn;
    });

    return () => {
      disposed = true;
      window.clearTimeout(timer);
      unlisten?.();
    };
  }, [refresh]);

  // ---- Explorer resize ------------------------------------------------------
  const [dragging, setDragging] = useState(false);
  const startResize = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setDragging(true);
      const startX = e.clientX;
      const startW = widthRef.current;
      const onMove = (ev: MouseEvent) => {
        const dx = ev.clientX - startX;
        const raw = explorerSide === 'left' ? startW + dx : startW - dx;
        setExplorerWidth(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, raw)));
      };
      const onUp = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        setDragging(false);
        void saveSetting('explorerWidth', widthRef.current);
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    },
    [explorerSide],
  );

  const changeSide = useCallback((side: 'left' | 'right') => {
    setExplorerSide(side);
    void saveSetting('explorerSide', side);
  }, []);

  const explorer = (
    <Explorer tree={tree} selectedPath={selected?.path ?? null} onSelect={selectFile} onOpenFolder={openFolder} />
  );
  const resizer = (
    <div
      className={`app__resizer${dragging ? ' is-dragging' : ''}`}
      role="separator"
      aria-orientation="vertical"
      onMouseDown={startResize}
    />
  );
  const viewer = <Viewer file={selected} reloadToken={reloadToken} />;

  return (
    <div className="app">
      <Toolbar
        selected={selected}
        onOpenFolder={openFolder}
        explorerSide={explorerSide}
        onExplorerSideChange={changeSide}
      />
      <div className="app__body" data-side={explorerSide} style={{ '--explorer-width': `${explorerWidth}px` } as CSSProperties}>
        {explorerSide === 'left' ? (
          <>
            {explorer}
            {resizer}
            {viewer}
          </>
        ) : (
          <>
            {viewer}
            {resizer}
            {explorer}
          </>
        )}
      </div>
    </div>
  );
}
