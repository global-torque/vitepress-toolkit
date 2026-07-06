import { describe, expect, it } from 'vitest';
import type { PageData } from 'vitepress';

import { createTransformPageData } from './seo';

const strip = (value: string) => value.replace(/(<([^>]+)>)/gi, '').replace(/\*\*/g, '');

const createPage = (frontmatter: Record<string, any>): PageData => ({
  title: frontmatter.title ?? 'Example Page',
  description: '',
  frontmatter,
  headers: [],
  relativePath: 'example-page.md',
  filePath: 'example-page.md',
}) as PageData;

const normalizeStrictFrontmatter = (pageData: PageData) => {
  if (Object.prototype.hasOwnProperty.call(pageData.frontmatter, 'cover')) {
    throw new Error('Frontmatter "cover" is not supported. Use top-level image/srcset instead.');
  }

  pageData.frontmatter.url = `/${pageData.relativePath.replace('.md', '')}`;
  pageData.frontmatter.slug ??= pageData.frontmatter.url.split('/').pop();
  pageData.frontmatter.image ||= '/images/sharing.png';
};

const createTransform = (envOverrides: Record<string, unknown> = {}) => createTransformPageData({
  env: {
    FRONTEND_URL: 'https://example.com',
    author: 'Example',
    keywords: ['example'],
    locale: 'en_US',
    title: 'Example Site',
    ...envOverrides,
  },
  normalizeFrontmatter: normalizeStrictFrontmatter,
  stripHtmlAndMarkdown: strip,
  includeMetaTitle: true,
});

const transform = createTransform();

const getHeadContent = (page: PageData, name: string) => (
  page.frontmatter.head.find((entry: any[]) => (
    entry[0] === 'meta'
    && (entry[1]?.name === name || entry[1]?.property === name)
  ))?.[1]?.content
);

describe('createTransformPageData', () => {
  it('uses frontmatter.image for social images', () => {
    const page = createPage({
      title: 'Image Page',
      image: '/images/page.png',
    });

    transform(page);

    expect(page.frontmatter.image).toBe('/images/page.png');
    expect(getHeadContent(page, 'og:image')).toBe('https://example.com/images/page.png');
    expect(getHeadContent(page, 'twitter:image')).toBe('https://example.com/images/page.png');
  });

  it('rejects deprecated nested image frontmatter through normalization', () => {
    const page = createPage({
      title: 'Deprecated Image Page',
      cover: '/images/deprecated.png',
    });

    expect(() => transform(page)).toThrow(
      'Frontmatter "cover" is not supported. Use top-level image/srcset instead.',
    );
  });

  it('does not prefix absolute image urls', () => {
    const page = createPage({
      title: 'Absolute Image Page',
      image: 'https://cdn.example.com/page.png',
    });

    transform(page);

    expect(getHeadContent(page, 'og:image')).toBe('https://cdn.example.com/page.png');
  });

  it('falls back to the configured default image', () => {
    const page = createPage({
      title: 'Fallback Image Page',
    });

    transform(page);

    expect(getHeadContent(page, 'og:image')).toBe('https://example.com/images/sharing.png');
  });

  it('uses frontmatter description without adding undefined fallback text', () => {
    const page = createPage({
      title: 'Described Page',
      description: 'A precise page description.',
    });

    transform(page);

    expect(page.description).toBe('A precise page description.');
    expect(getHeadContent(page, 'description')).toBe('A precise page description.');
    expect(getHeadContent(page, 'og:description')).toBe('A precise page description.');
    expect(getHeadContent(page, 'description')).not.toContain('undefined');
  });

  it('allows robots indexing by default', () => {
    const page = createPage({ title: 'Default Robot Page' });

    transform(page);

    expect(getHeadContent(page, 'robots')).toBe('index, follow');
  });

  it('disables robots indexing when robotIndex is false', () => {
    const page = createPage({ title: 'Hidden Robot Page' });
    const transformNoIndex = createTransform({ robotIndex: false });

    transformNoIndex(page);

    expect(getHeadContent(page, 'robots')).toBe('noindex, nofollow');
  });

  it('allows robots indexing when robotIndex is true-like', () => {
    const page = createPage({ title: 'Indexed Robot Page' });
    const transformIndex = createTransform({ robotIndex: 'true' });

    transformIndex(page);

    expect(getHeadContent(page, 'robots')).toBe('index, follow');
  });
});
