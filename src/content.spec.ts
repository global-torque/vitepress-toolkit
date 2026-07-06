import { describe, expect, it } from 'vitest';
import type { ContentData } from 'vitepress';

import {
  createVitePressFrontmatterRecord,
  legacyCoverNormalizeFrontmatterOptions,
  normalizeVitePressFrontmatter,
} from './index';
import { urlFormat } from '@global-torque/content-toolkit/url';

describe('vitepress-toolkit content adapter', () => {
  it('normalizes legacy loader data through content-toolkit options', () => {
    const page = {
      url: '/ru/йога/йога.html',
      relativePath: 'ru/йога/йога.md',
      filePath: 'ru/йога/йога.md',
      src: 'Йога content',
      frontmatter: {
        title: 'Йога',
        cover: {
          image: '/images/legacy/yoga.webp',
        },
      },
    } as unknown as ContentData;

    const frontmatter = normalizeVitePressFrontmatter(page);

    expect(frontmatter.url).toBe('/ru/yoga/yoga');
    expect(frontmatter.rawUrl).toBe('/ru/йога/йога.html');
    expect(frontmatter.slug).toBe('yoga');
    expect(frontmatter.image).toBe('/images/legacy/yoga.webp');
    expect('cover' in frontmatter).toBe(false);
  });

  it('accepts host-provided URL policy without exporting product-specific profiles', () => {
    const page = {
      url: '/products/internal/investor-portal/investor-portal.html',
      relativePath: 'products/internal/investor-portal/investor-portal.md',
      filePath: 'products/internal/investor-portal/investor-portal.md',
      frontmatter: {
        image: '/images/public/investor-portal.webp',
      },
    } as unknown as ContentData;

    const frontmatter = normalizeVitePressFrontmatter(page, {
      ...legacyCoverNormalizeFrontmatterOptions,
      urlFormatter: (url) => urlFormat(url, {
        removeDuplicateSegments: true,
        removeFolders: ['internal'],
      }),
    });

    expect(frontmatter.url).toBe('/products/investor-portal');
    expect(frontmatter.image).toBe('/images/public/investor-portal.webp');
  });

  it('returns a detached record for loader maps', () => {
    const page = {
      url: '/en/example.html',
      frontmatter: {
        image: '/images/example.webp',
      },
    } as unknown as ContentData;

    const frontmatter = createVitePressFrontmatterRecord(page);

    expect(frontmatter).toEqual(expect.objectContaining({
      image: '/images/example.webp',
      url: '/en/example.html',
    }));
    expect(frontmatter).not.toBe(page.frontmatter);
  });
});
