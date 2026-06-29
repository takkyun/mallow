# AGENTS.md

> 日本語: [AGENTS.ja.md](AGENTS.ja.md)

Guidance for agents and contributors working in this repository. **mallow** is a
standalone, lightweight desktop Markdown / config-file viewer. See
[README.md](README.md) for the user-facing overview.

## Commands

```sh
pnpm install
pnpm tauri dev      # run the app with hot reload
pnpm build          # frontend type-check (tsc) + bundle (vite) — validate FE changes
pnpm tauri build    # release build + bundle
pnpm tauri icon src-tauri/icons/app-icon.png   # regenerate all app icons
cargo check         # run inside src-tauri/ to validate Rust
```

## Stack

Tauri v2 (Rust) + Vite + React + TypeScript + SCSS. **No Tailwind.**

## Architecture

**Frontend (`src/`)**
- `App.tsx` — top-level state: open folder, selection, file-watch wiring, explorer
  width/side, session restore.
- `hooks/useFileTree.ts` — centralized lazy file-tree state (expanded set, children
  map, `refresh`, `expandPaths`). The tree components are controlled by this.
- `components/` — Explorer/FileTree, Viewer (routes by file kind), MarkdownView,
  ConfigView/ConfigTree, SourceView (shared, line-numbered), MermaidView, Outline,
  Toolbar, OpenWith, ThemePicker, SettingsMenu, icons.
- `lib/` — `markdown` (markdown-it pipeline), `shiki` (highlighter singleton +
  `stripPreBackground`), `mermaid` + `mermaid-copy` + `codeblock` (imperative DOM
  enhancements), `frontmatter`, `config-parse`, `scroll` (anchor preservation),
  `watch`, `settings` (plugin-store), `theme`, `file`, `tauri` (invoke wrappers), `types`.
- `styles/` — SCSS: `_vars` (palettes + `on-dark` mixin), `global`, `app`,
  `markdown`, `config`, `source`.

**Backend (`src-tauri/src/`)**
- `commands.rs` — `read_dir_tree`, `read_file`, `path_exists` via plain `std::fs`
  (NOT the fs plugin), so any user-picked folder works without scope config.
- `watch.rs` — `notify` recursive watcher; emits the `fs:change` event (list of
  paths). The watcher handle lives in `WatcherState`.
- `editors.rs` — `detect_editors` / `open_in_editor` / `reveal_in_os` via
  `std::process`, gated per-OS with `cfg`.
- `lib.rs` — plugin registration (opener, dialog, store, window-state) + the
  `invoke_handler`.

## Conventions

- SCSS only — never introduce Tailwind.
- Code comments in English.
- Do not commit `src-tauri/target` (build output; already git-ignored).
- Treat mallow as an independent project — do not add references to any external
  project as its origin in code/comments/docs.
- Ask before adding new production dependencies.

## Implementation notes / gotchas

- Markdown is rendered **at runtime in the WebView** (not at build time).
  `renderMarkdown` returns `{ html, headings }`; leading front-matter (YAML `---`
  / TOML `+++`) is extracted and shown as a key/value table.
- The markdown HTML is injected via `dangerouslySetInnerHTML`. Imperative
  enhancements (code-copy buttons, mermaid render, external-link interception) run
  in a `useEffect` keyed on `[result, mode]`. Toggling preview↔source remounts the
  article, so those enhancements must re-run — **keep `mode` in the deps.**
- Theme = `data-theme` attribute + CSS-variable palettes (instant switch; also
  styles the non-React rendered HTML). 7 themes. When adding a dark palette, also
  add it to the `on-dark` mixin in `_vars.scss` and apply it in `global.scss`.
- Shiki dual theme: light is inlined, dark emitted as `--shiki-dark` and swapped
  under `on-dark`. Code token colors stay github-light/dark regardless of palette.
- `SourceView` line numbers: Shiki emits `<span class="line">`; CSS uses
  `code { display: grid }` + `.line::before { counter }`.
- Custom Rust commands and core events are NOT gated by capabilities; only
  plugin/core APIs are (see `src-tauri/capabilities/default.json`).

## Verifying changes

- Frontend: `pnpm build` (tsc + vite). For pure-logic modules (e.g.
  `markdown`, `config-parse`, `frontmatter`), a quick `pnpm dlx tsx <script>`
  importing from `src/lib/*` is a fast non-GUI check.
- Backend: `cargo check` inside `src-tauri/`.
- End-to-end: `pnpm tauri dev` (GUI) or `pnpm tauri build`.

## Known follow-ups

- Config-tree expansion state is not preserved across a live reload.
- The build is unsigned (macOS Gatekeeper warning on first launch).
- Math (KaTeX) is intentionally not implemented.
