import { describe, expect, it } from 'vitest';
import { extractFrontMatter, renderFrontMatterTable } from './frontmatter';

describe('extractFrontMatter', () => {
  it('extracts a leading YAML block and returns the remaining body', () => {
    const { data, body } = extractFrontMatter('---\ntitle: Hi\ncount: 2\n---\n# Body\n');
    expect(data).toEqual({ title: 'Hi', count: 2 });
    expect(body).toBe('# Body\n');
  });

  it('extracts a leading TOML block (+++ fences)', () => {
    const { data, body } = extractFrontMatter('+++\ntitle = "Hi"\n+++\nbody\n');
    expect(data).toEqual({ title: 'Hi' });
    expect(body).toBe('body\n');
  });

  it('returns null data when there is no front-matter', () => {
    const { data, body } = extractFrontMatter('# Just a doc\n');
    expect(data).toBeNull();
    expect(body).toBe('# Just a doc\n');
  });

  it('leaves the document untouched when the fenced block is not a plain object', () => {
    // A YAML block that parses to a scalar (not a map) is not front-matter.
    const src = '---\njust a string\n---\nbody\n';
    const { data, body } = extractFrontMatter(src);
    expect(data).toBeNull();
    expect(body).toBe(src);
  });

  it('leaves the document untouched when the front-matter is invalid', () => {
    const src = '---\n: : :\n---\nbody\n';
    const { data } = extractFrontMatter(src);
    expect(data).toBeNull();
  });
});

describe('renderFrontMatterTable', () => {
  it('escapes HTML in keys and values', () => {
    const html = renderFrontMatterTable({ '<k>': '<script>alert(1)</script>' });
    expect(html).toContain('&lt;k&gt;');
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(html).not.toMatch(/<script\b/i);
  });

  it('joins scalar arrays with commas', () => {
    const html = renderFrontMatterTable({ tags: ['a', 'b', 'c'] });
    expect(html).toContain('<td>a, b, c</td>');
  });

  it('serializes nested objects as JSON', () => {
    const html = renderFrontMatterTable({ meta: { x: 1 } });
    expect(html).toContain('{&quot;x&quot;:1}');
  });
});
