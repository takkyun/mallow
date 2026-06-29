# AGENTS.ja.md

> English: [AGENTS.md](AGENTS.md)

このリポジトリで作業するエージェント／コントリビュータ向けのガイドです。**mallow** は
独立した軽量デスクトップ Markdown / 設定ファイルビューワです。利用者向けの概要は
[README.ja.md](README.ja.md) を参照してください。

## コマンド

```sh
pnpm install
pnpm tauri dev      # ホットリロード付きで起動
pnpm build          # フロントの型チェック(tsc) + バンドル(vite)。FE 変更の検証用
pnpm tauri build    # リリースビルド + バンドル
pnpm tauri icon src-tauri/icons/app-icon.png   # 全アプリアイコンの再生成
pnpm notices        # THIRD-PARTY-NOTICES.md を再生成（同梱する依存ライセンス）
cargo check         # src-tauri/ 内で実行し Rust を検証
```

## スタック

Tauri v2 (Rust) + Vite + React + TypeScript + SCSS。**Tailwind は不使用。**

## アーキテクチャ

**フロントエンド (`src/`)**
- `App.tsx` — 最上位の状態: フォルダを開く、選択、ファイル監視の配線、エクスプローラの
  幅/左右、セッション復元、設定モーダルの開閉（フッターのボタン・`menu:settings`
  イベント・`Cmd/Ctrl+,` ショートカットのいずれからも開く）。
- `hooks/useFileTree.ts` — ファイルツリーの集中管理（展開集合・子マップ・`refresh`・
  `expandPaths`）。ツリーコンポーネントはこれに制御される。
- `components/` — Explorer/FileTree、Viewer（種別でルーティング）、MarkdownView、
  ConfigView/ConfigTree、SourceView（共通・行番号付き）、MermaidView、Outline、
  Toolbar、OpenWith、ThemePicker、SettingsModal、icons（Lucide の SVG をインライン化・
  ランタイム依存なし）。
- `lib/` — `markdown`（markdown-it パイプライン）、`shiki`（ハイライタ singleton +
  `stripPreBackground`）、`mermaid` + `mermaid-copy` + `codeblock`（命令的 DOM 強化）、
  `frontmatter`、`config-parse`、`scroll`（スクロール位置保持）、`watch`、
  `settings`（plugin-store）、`theme`、`i18n`（ja/en 辞書 + provider/hooks。言語は
  localStorage に永続化）、`file`、`tauri`（invoke ラッパ）、`types`。
- `styles/` — SCSS: `_vars`（パレット + `on-dark` mixin）、`global`、`app`、
  `markdown`、`config`、`source`。

**バックエンド (`src-tauri/src/`)**
- `commands.rs` — `read_dir_tree` / `read_file` / `path_exists` を素の `std::fs` で実装
  （fs プラグインは使わない）。ユーザーが選んだ任意フォルダをスコープ設定なしで扱える。
- `watch.rs` — `notify` の再帰ウォッチャ。`fs:change` イベント（パス配列）を emit。
  ウォッチャは `WatcherState` が保持。
- `editors.rs` — `detect_editors` / `open_in_editor` / `reveal_in_os` を `std::process`
  で実装（OS ごとに `cfg` で分岐）。
- `lib.rs` — プラグイン登録（opener, dialog, store, window-state）、`invoke_handler`、
  および（macOS のみ）ネイティブアプリメニュー。Settings… 項目（⌘,）が
  `menu:settings` イベントを emit し、フロントがそれを購読する。

## 規約

- SCSS のみ。Tailwind は決して導入しない。
- コードコメントは英語。
- `src-tauri/target` はコミットしない（ビルド成果物・git 無視済み）。
- mallow は独立プロジェクトとして扱う。コード/コメント/ドキュメントに外部プロジェクトを
  「由来」として記述しない。
- production 依存の追加前に確認する。
- 第三者ライセンス通知（`THIRD-PARTY-NOTICES.md`）は `pnpm notices`
  （`scripts/gen-third-party-notices.mjs`）で生成し、`bundle.resources` でアプリに
  同梱する。依存を変更したら再生成する。

## 実装メモ / 注意点

- Markdown は**実行時に WebView 内でレンダリング**する（ビルド時ではない）。
  `renderMarkdown` は `{ html, headings }` を返し、先頭の front-matter（YAML `---` /
  TOML `+++`）は key/value テーブルとして抽出表示する。
- Markdown の HTML は `dangerouslySetInnerHTML` で注入。命令的強化（コードコピー、
  mermaid 描画、外部リンク横取り）は `[result, mode]` 依存の `useEffect` で実行する。
  プレビュー↔ソース切替で article が再マウントされるため、強化処理を再実行する必要が
  ある。**`mode` を依存配列に残すこと。**
- テーマ = `data-theme` 属性 + CSS 変数パレット（瞬時切替・非 React の描画 HTML にも適用）。
  7 種類。ダークパレットを追加する際は `_vars.scss` の `on-dark` mixin と `global.scss`
  の適用にも追加すること。
- i18n は `lib/i18n.tsx` の自作辞書（ライブラリ不使用）。UI 文言は `useT()` /
  `t(key, params)` 経由にし、キーは `ja` と `en` の**両方**の辞書に追加する。言語は
  localStorage → OS ロケール → 日本語 の順で決定。
- アイコンは Lucide (https://lucide.dev) の SVG を `components/icons.tsx` に
  インライン化（24×24・`stroke="currentColor"`）。追加時は `lucide-react` を入れず
  パスデータをそのままコピーする。
- ネイティブのウィンドウタイトルは開いているドキュメントに追従する（`lib/title.ts`:
  markdown の front-matter `title` があればそれ、なければファイル名、未選択時は `mallow`）。
  `Viewer` から `setWindowTitle` で設定する。`document.title` では Tauri のウィンドウ
  タイトルは変わらないため `core:window:allow-set-title` 権限が必要。
- Shiki のデュアルテーマ: light はインライン、dark は `--shiki-dark` として出力し
  `on-dark` で差し替え。コードのトークン色はパレットに関わらず github-light/dark のまま。
- `SourceView` の行番号: Shiki は `<span class="line">` を出力するので、CSS は
  `code { display: grid }` + `.line::before { counter }` を使用。
- 独自 Rust コマンドと core イベントは capabilities の許可不要。plugin/core API のみが
  ゲートされる（`src-tauri/capabilities/default.json` 参照）。

## 変更の検証

- フロント: `pnpm build`（tsc + vite）。純ロジックのモジュール（`markdown`・
  `config-parse`・`frontmatter` など）は `pnpm dlx tsx <script>` で `src/lib/*` を
  import して回す GUI 不要チェックが速い。
- バックエンド: `src-tauri/` 内で `cargo check`。
- エンドツーエンド: `pnpm tauri dev`（GUI）または `pnpm tauri build`。

## 既知の未対応

- 設定ツリーの展開状態はライブ更新で保持されない。
- ビルドは未署名（macOS の初回起動で Gatekeeper 警告）。
- 数式 (KaTeX) は意図的に未実装。
