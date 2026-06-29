import { useEffect, useRef, useState } from 'react';
import { GearIcon } from './icons';

interface SettingsMenuProps {
  side: 'left' | 'right';
  onSideChange: (side: 'left' | 'right') => void;
}

export function SettingsMenu({ side, onSideChange }: SettingsMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  return (
    <div className="menu" ref={rootRef}>
      <button
        type="button"
        className="icon-btn"
        title="設定"
        aria-label="設定"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <GearIcon />
      </button>
      {open && (
        <div className="menu__popup" role="menu">
          <div className="menu__label">エクスプローラの位置</div>
          <button
            type="button"
            className={`menu__item${side === 'left' ? ' is-active' : ''}`}
            role="menuitemradio"
            aria-checked={side === 'left'}
            onClick={() => onSideChange('left')}
          >
            左
          </button>
          <button
            type="button"
            className={`menu__item${side === 'right' ? ' is-active' : ''}`}
            role="menuitemradio"
            aria-checked={side === 'right'}
            onClick={() => onSideChange('right')}
          >
            右
          </button>
        </div>
      )}
    </div>
  );
}
