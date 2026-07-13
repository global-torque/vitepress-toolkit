import { describe, expect, it } from 'vitest';
import type { ContentData } from 'vitepress';

import { normalizeVitePressFrontmatter } from './content';

describe('normalizeVitePressFrontmatter', () => {
  it('returns a detached generic record without mutating frozen page data', () => {
    const frontmatter = Object.freeze({ title: 'Überblick', draft: false });
    const page = Object.freeze({
      url: '/de/überblick.html',
      relativePath: 'de/überblick.md',
      filePath: 'de/überblick.md',
      frontmatter,
    }) as unknown as ContentData;

    const normalized = normalizeVitePressFrontmatter(page as never);

    expect(normalized).toEqual({
      title: 'Überblick',
      draft: false,
      url: '/de/überblick.html',
    });
    expect(normalized).not.toBe(frontmatter);
    expect(page.frontmatter).toBe(frontmatter);
    expect('image' in normalized).toBe(false);
    expect('slug' in normalized).toBe(false);
  });

  it('rejects legacy nested cover policy by default', () => {
    const page = {
      url: '/legacy',
      frontmatter: { cover: { image: '/legacy.webp' } },
    } as unknown as ContentData;
    expect(() => normalizeVitePressFrontmatter(page as never)).toThrow(
      /strict public contract/,
    );
  });

  it('accepts explicit host path policy without modifying suffixes', () => {
    const page = {
      url: '/Drafts/Guide?Case=Keep#Heading',
      frontmatter: { custom: true },
    } as unknown as ContentData;
    const normalized = normalizeVitePressFrontmatter(page as never, {
      formatPath: (value) => value.replace('/Drafts/', '/docs/'),
    });
    expect(normalized).toEqual({
      custom: true,
      url: '/docs/Guide?Case=Keep#Heading',
      rawUrl: '/Drafts/Guide?Case=Keep#Heading',
    });
  });
});
