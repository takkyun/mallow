/**
 * Runtime markdown pipeline. markdown-it + Shiki (dual theme) + emoji + GitHub
 * alerts + heading anchors, plus a mermaid fence rewrite. Returns the HTML and a
 * flat heading list for the outline.
 */
import { fromHighlighter } from '@shikijs/markdown-it/core';
import type { BundledLanguage } from 'shiki';
import GithubSlugger from 'github-slugger';
import MarkdownIt from 'markdown-it';
import anchor from 'markdown-it-anchor';
import { full as emoji } from 'markdown-it-emoji';
import githubAlerts from 'markdown-it-github-alerts';
import { extractFrontMatter, renderFrontMatterTable } from './frontmatter';
import { getHighlighter, SHIKI_THEMES, stripPreBackground } from './shiki';

export interface Heading {
  depth: number;
  slug: string;
  text: string;
}

export interface RenderResult {
  html: string;
  headings: Heading[];
}

// GitHub-compatible, deduplicating slugs (same library Astro uses). Reset before
// each render so slug counters start fresh per document.
const slugger = new GithubSlugger();
// Filled by the anchor plugin's callback during a (synchronous) render.
let headingSink: Heading[] = [];

/**
 * Rewrite ```mermaid fenced blocks into `<pre class="mermaid">` so Shiki leaves
 * them alone and the client renderer (lib/mermaid.ts) can pick them up.
 */
function mermaidFence(md: MarkdownIt): void {
  const defaultFence = md.renderer.rules.fence!;
  md.renderer.rules.fence = (tokens, idx, options, env, self) => {
    const token = tokens[idx];
    if (token.info.trim().toLowerCase() === 'mermaid') {
      return `<pre class="mermaid">${md.utils.escapeHtml(token.content)}</pre>\n`;
    }
    return defaultFence(tokens, idx, options, env, self);
  };
}

let mdPromise: Promise<MarkdownIt> | null = null;

async function getMd(): Promise<MarkdownIt> {
  if (!mdPromise) {
    mdPromise = (async () => {
      const highlighter = await getHighlighter();
      // Security boundary: mallow opens untrusted Markdown, so raw HTML embedded
      // in a document is NOT rendered. `html: false` makes markdown-it escape any
      // literal `<script>`, `<img onerror=...>`, etc. into visible text instead of
      // live DOM. markdown-it's default `validateLink` additionally drops dangerous
      // link hrefs (javascript:, vbscript:, file:, and data: other than images), so
      // `[x](javascript:alert(1))` is not turned into a link at all. HTML that mallow itself
      // generates (Shiki code blocks, GitHub alerts, the mermaid fence rewrite below,
      // and the front-matter table) is emitted by the renderer regardless of this
      // flag — `html` only governs raw HTML *in the source* — so none of it breaks.
      const md = new MarkdownIt({ html: false, linkify: true });

      md.use(
        fromHighlighter(highlighter, {
          themes: SHIKI_THEMES,
          transformers: [stripPreBackground],
          // `text` is a Shiki special language (no grammar needed); it isn't in
          // the BundledLanguage union, so assert it for the type checker.
          fallbackLanguage: 'text' as unknown as BundledLanguage,
        }),
      );
      md.use(emoji);
      md.use(githubAlerts);
      md.use(anchor, {
        slugify: (s: string) => slugger.slug(s),
        callback: (token, info) => {
          headingSink.push({
            depth: Number(token.tag.slice(1)) || 1,
            slug: info.slug,
            text: info.title,
          });
        },
      });
      // Must run after the Shiki plugin so it wraps Shiki's fence rule.
      mermaidFence(md);

      return md;
    })();
  }
  return mdPromise;
}

/** Render markdown source to HTML and extract its heading outline. Leading
 *  front-matter (YAML / TOML) is shown as a key/value table above the body. */
export async function renderMarkdown(src: string): Promise<RenderResult> {
  const md = await getMd();
  const { data, body } = extractFrontMatter(src);
  slugger.reset();
  headingSink = [];
  const bodyHtml = md.render(body);
  const html = data && Object.keys(data).length > 0 ? renderFrontMatterTable(data) + bodyHtml : bodyHtml;
  return { html, headings: headingSink.slice() };
}
