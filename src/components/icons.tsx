/** Small inline SVG icons (use currentColor so CSS controls the color). */

export function ChevronRight() {
  return (
    <svg width="10" height="10" viewBox="0 0 16 16" aria-hidden="true">
      <path fill="currentColor" d="M6 4l4 4-4 4V4z" />
    </svg>
  );
}

export function FolderIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" aria-hidden="true">
      <path
        fill="currentColor"
        d="M1.5 3.5A1.5 1.5 0 0 1 3 2h2.6a1 1 0 0 1 .7.3L7.5 3.5H13A1.5 1.5 0 0 1 14.5 5v6A1.5 1.5 0 0 1 13 12.5H3A1.5 1.5 0 0 1 1.5 11V3.5z"
      />
    </svg>
  );
}

export function FileIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
      <path fill="currentColor" d="M3.5 1.5h5L13 6v8a.5.5 0 0 1-.5.5h-9A.5.5 0 0 1 3 14V2a.5.5 0 0 1 .5-.5zM8.5 2.2V6H12.3L8.5 2.2z" />
    </svg>
  );
}

export function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <circle cx="8" cy="8" r="3.1" fill="currentColor" />
      <g stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
        <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.2 3.2l1.4 1.4M11.4 11.4l1.4 1.4M12.8 3.2l-1.4 1.4M4.6 11.4l-1.4 1.4" />
      </g>
    </svg>
  );
}

export function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path fill="currentColor" d="M6.2 1.6a6.4 6.4 0 1 0 8.2 8.2A5.6 5.6 0 0 1 6.2 1.6z" />
    </svg>
  );
}

export function GearIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path
        fill="currentColor"
        d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zm6.4 2.5a6.5 6.5 0 0 0-.07-.86l1.3-1-1.4-2.42-1.55.5a5.6 5.6 0 0 0-1.48-.86L10.9.5h-2.8l-.3 1.86a5.6 5.6 0 0 0-1.48.86l-1.55-.5L3.37 5.14l1.3 1a5.7 5.7 0 0 0 0 1.72l-1.3 1 1.4 2.42 1.55-.5c.45.35.95.64 1.48.86l.3 1.86h2.8l.3-1.86c.53-.22 1.03-.51 1.48-.86l1.55.5 1.4-2.42-1.3-1c.05-.28.07-.57.07-.86z"
      />
    </svg>
  );
}

export function AutoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeWidth="1.3" />
      <path fill="currentColor" d="M8 2a6 6 0 0 1 0 12V2z" />
    </svg>
  );
}
