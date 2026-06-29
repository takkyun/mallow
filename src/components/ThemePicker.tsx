import { useEffect, useRef, useState } from 'react';
import { getTheme, setTheme, THEMES, type ThemeId } from '../lib/theme';
import { AutoIcon, MoonIcon, SunIcon } from './icons';

function glyphFor(id: ThemeId) {
  if (id === 'light' || id === 'solarized-light') return SunIcon;
  if (id === 'auto') return AutoIcon;
  return MoonIcon;
}

export function ThemePicker() {
  const [current, setCurrent] = useState<ThemeId>(() => getTheme());
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

  function pick(id: ThemeId) {
    setTheme(id);
    setCurrent(id);
    setOpen(false);
  }

  const Icon = glyphFor(current);

  return (
    <div className="menu" ref={rootRef}>
      <button
        type="button"
        className="icon-btn"
        title="テーマを選択"
        aria-label="テーマを選択"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <Icon />
      </button>
      {open && (
        <div className="menu__popup" role="menu">
          {THEMES.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`menu__item${current === t.id ? ' is-active' : ''}`}
              role="menuitemradio"
              aria-checked={current === t.id}
              onClick={() => pick(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
