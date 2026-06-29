import type { FileEntry } from '../lib/types';
import { FolderIcon } from './icons';
import { OpenWith } from './OpenWith';
import { SettingsMenu } from './SettingsMenu';
import { ThemePicker } from './ThemePicker';

interface ToolbarProps {
  selected: FileEntry | null;
  onOpenFolder: () => void;
  explorerSide: 'left' | 'right';
  onExplorerSideChange: (side: 'left' | 'right') => void;
}

export function Toolbar({ selected, onOpenFolder, explorerSide, onExplorerSideChange }: ToolbarProps) {
  return (
    <header className="toolbar">
      <span className="toolbar__brand">mallow</span>
      <button type="button" className="btn" onClick={onOpenFolder}>
        <FolderIcon />
        フォルダを開く
      </button>
      <span className="toolbar__path" title={selected?.path ?? undefined}>
        {selected?.path ?? ''}
      </span>
      <div className="toolbar__actions">
        <OpenWith file={selected} />
        <SettingsMenu side={explorerSide} onSideChange={onExplorerSideChange} />
        <ThemePicker />
      </div>
    </header>
  );
}
