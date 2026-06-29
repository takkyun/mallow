# mallow

> English: [README.md](README.md)

軽量な Markdown / 設定ファイルビューワ。
フォルダを開いてツリーから選び、Markdown は GitHub 同等のレンダリング、設定系ファイル
(JSON/YAML/TOML 系) は折りたたみ可能な階層ツリーで表示します。

## 主な機能

- **2 カラム UI**: 左にファイルツリー（フォルダ階層・遅延読み込み）、右にビューア。
- **Markdown レンダリング**
  - GitHub-flavored markdown（テーブル、絵文字 `:emoji:`、GFM alerts `> [!NOTE]` …）
  - コードブロックのシンタックスハイライト（Shiki / github-light・github-dark）＋コピー
  - mermaid 図（PNG / SVG コピー対応）
  - 目次（アウトライン、スクロールスパイ）
  - プレビュー／ソース切替（ソースは行番号付き）
- **設定ファイル**（json / jsonc / json5 / jsonl / ndjson / yaml / yml / toml）
  - 折りたたみ階層ツリー（すべて展開／折りたたみ、ツリー／ソース表示の切替）
  - 構文エラー時はソース表示にして該当行をハイライト
- **mermaid 単体ファイル**（.mmd / .mermaid）の表示
- **ライブ更新**: 表示中ファイルの変更を検知して自動再描画（スクロール位置を保持）、
  ツリーも追従。
- **エディタで開く**: VS Code / Zed / CotEditor / mi（macOS）、Notepad++ / サクラ（Windows）等を
  検出して起動。OS のファイルマネージャで表示も可能。
- **テーマ**: light / dark / auto + Solarized Light/Dark・Dracula・Nord。
- **設定の永続化 / セッション復元**: テーマ・エクスプローラ幅と位置・最後に開いていた
  フォルダ/ファイル・ウィンドウ位置を保存し、次回起動時に復元。

## 技術スタック

- [Tauri v2](https://v2.tauri.app/)（Rust バックエンド + OS ネイティブ WebView）
- Vite + React + TypeScript
- SCSS（Tailwind 不使用）
- markdown-it + @shikijs/markdown-it + mermaid + markdown-it-emoji / -github-alerts / -anchor
- 設定パース: yaml / smol-toml / jsonc-parser / json5

## 開発

```sh
pnpm install
pnpm tauri dev      # 開発起動（ホットリロード）
pnpm tauri build    # リリースビルド（.app / .dmg などを生成）
pnpm build          # フロントの型チェック + バンドルのみ

# アプリアイコンの再生成（元画像から各サイズ/形式を生成）
pnpm tauri icon src-tauri/icons/app-icon.png
```

## 構成

```
src/                フロントエンド（React + TS）
  components/        Explorer / Viewer / MarkdownView / ConfigView / SourceView / ...
  lib/              markdown・shiki・mermaid・config-parse・frontmatter・watch・settings・theme ...
  hooks/useFileTree ファイルツリーの集中管理（遅延読み込み・更新・展開復元）
  styles/           SCSS（_vars / global / app / markdown / config / source）
src-tauri/          Rust バックエンド
  src/commands.rs   read_dir_tree / read_file / path_exists（std::fs）
  src/watch.rs      notify による再帰ファイル監視（fs:change イベント）
  src/editors.rs    エディタ検出・起動・OS で表示
  icons/app-icon.png  アイコンの元画像（再生成の入力）
```
