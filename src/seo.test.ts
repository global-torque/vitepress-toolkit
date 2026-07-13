import { describe, expect, it } from 'vitest';
import type { PageData } from 'vitepress';

import {
  createSeoPageDataBuilder,
  sanitizeHeadEntries,
  type SeoFrontmatterResult,
} from './seo';

const createPage = (frontmatter: Record<string, unknown> = {}): PageData =>
  ({
    title: 'Example **Page**',
    description: '',
    frontmatter,
    headers: [],
    relativePath: 'docs/example-page.md',
    filePath: 'docs/example-page.md',
  }) as PageData;

const strip = (value: string) => value.replaceAll('**', '');

function findMeta(page: PageData, key: string) {
  const entry = page.frontmatter.head.find(
    (candidate: unknown) =>
      Array.isArray(candidate) &&
      candidate[0] === 'meta' &&
      (candidate[1]?.name === key || candidate[1]?.property === key),
  );
  return entry?.[1];
}

describe('createSeoPageDataBuilder', () => {
  it('types normalized host frontmatter with required URL and custom fields', () => {
    const normalized = {
      url: '/typed',
      description: 'Description',
      custom: { value: true },
    } satisfies SeoFrontmatterResult;
    expect(normalized.url).toBe('/typed');
  });

  it('is pure, base-path aware, Open Graph-correct, and idempotent', () => {
    const input = Object.freeze(
      createPage(
        Object.freeze({
          description: 'A **safe** description.',
          image: '/images/page.png',
          head: Object.freeze([
            Object.freeze([
              'meta',
              Object.freeze({
                name: 'custom',
                property: 'og:title',
                content: 'stale',
              }),
            ]),
            Object.freeze([
              'meta',
              Object.freeze({ name: 'custom', content: 'preserve' }),
            ]),
          ]),
        }),
      ),
    ) as PageData;
    const build = createSeoPageDataBuilder({
      siteUrl: 'https://example.test/base/',
      siteName: 'Example',
      author: 'Maintainer',
      locale: 'en_US',
      keywords: ['one', 'two'],
      stripText: strip,
      includeSiteName: true,
      includeMetaTitle: true,
    });

    const first = build(input);
    const second = build(first);

    expect(input.frontmatter.head).toHaveLength(2);
    expect(first).not.toBe(input);
    expect(first.frontmatter).not.toBe(input.frontmatter);
    expect(first.frontmatter.head).toEqual(second.frontmatter.head);
    expect(
      first.frontmatter.head.filter(
        (entry: readonly unknown[]) =>
          (entry[1] as Record<string, unknown> | undefined)?.property ===
          'og:title',
      ),
    ).toHaveLength(1);
    expect(findMeta(first, 'og:title')).toMatchObject({ property: 'og:title' });
    expect(findMeta(first, 'og:site_name')).toMatchObject({
      property: 'og:site_name',
    });
    expect(first.frontmatter.head).toContainEqual([
      'meta',
      { name: 'custom', content: 'preserve' },
    ]);
    expect(first.frontmatter.head).toContainEqual([
      'link',
      { rel: 'canonical', href: 'https://example.test/base/docs/example-page' },
    ]);
    expect(findMeta(first, 'og:image')?.content).toBe(
      'https://example.test/base/images/page.png',
    );
    expect(first.description).toBe('A safe description.');
  });

  it('does not embed a product image default', () => {
    const build = createSeoPageDataBuilder({ siteUrl: 'https://example.test' });
    const page = build(createPage());
    expect(findMeta(page, 'og:image')).toBeUndefined();
    expect(findMeta(page, 'twitter:image')).toBeUndefined();
  });

  it('serializes JSON-LD objects with less-than characters escaped', () => {
    const build = createSeoPageDataBuilder({
      siteUrl: 'https://example.test',
      generateJsonLd: () => ({
        '@context': 'https://schema.org',
        name: '</script><script>alert(1)</script>',
      }),
    });
    const page = build(createPage());
    const script = page.frontmatter.head.find(
      (entry: readonly unknown[]) => entry[0] === 'script',
    );
    expect(script?.[2]).not.toContain('<');
    expect(script?.[2]).toContain('\\u003c/script>');
  });

  it('replaces every existing JSON-LD script and remains idempotent', () => {
    const input = createPage({
      head: [
        [
          'script',
          { type: 'application/ld+json' },
          '{"name":"</script><script>alert(1)</script>"}',
        ],
      ],
    });
    const build = createSeoPageDataBuilder({
      siteUrl: 'https://example.test',
      generateJsonLd: () => ({ name: 'safe' }),
    });

    const first = build(input);
    const second = build(first);
    const scripts = second.frontmatter.head.filter(
      (entry: readonly unknown[]) =>
        entry[0] === 'script' &&
        (entry[1] as Record<string, unknown> | undefined)?.type ===
          'application/ld+json',
    );

    expect(scripts).toHaveLength(1);
    expect(scripts[0]?.[2]).toBe('{"name":"safe"}');
    expect(JSON.stringify(second.frontmatter.head)).not.toContain('alert(1)');
    expect(second.frontmatter.head).toEqual(first.frontmatter.head);
  });

  it('uses first-non-empty title and description fallbacks', () => {
    const build = createSeoPageDataBuilder({
      siteUrl: 'https://example.test',
      siteName: 'Fallback Site',
      description: 'Site description',
      resolveDescription: () => '   ',
    });
    const summaryPage = build({
      ...createPage({
        title: 'Frontmatter title',
        summary: 'Summary description',
      }),
      title: '',
      description: '',
    });
    const defaultPage = build({
      ...createPage({ title: 'Frontmatter title' }),
      title: '',
      description: '',
    });

    expect(findMeta(summaryPage, 'og:title')?.content).toBe(
      'Frontmatter title',
    );
    expect(summaryPage.description).toBe('Summary description');
    expect(findMeta(summaryPage, 'og:description')?.content).toBe(
      'Summary description',
    );
    expect(defaultPage.description).toBe('Site description');
  });

  it('falls through values that become empty after host text stripping', () => {
    const stripMarkup = (value: string) => value.replace(/<[^>]*>/g, '');
    const build = createSeoPageDataBuilder({
      siteUrl: 'https://example.test',
      siteName: 'Fallback Site',
      description: 'Site description',
      stripText: stripMarkup,
    });
    const summaryPage = build({
      ...createPage({
        title: '<b></b>',
        description: '<i></i>',
        summary: 'Useful summary',
      }),
      title: '<strong></strong>',
      description: '<em></em>',
    });
    const defaultPage = build({
      ...createPage({ title: '<b></b>', description: '<i></i>' }),
      title: '<strong></strong>',
      description: '<em></em>',
    });

    expect(findMeta(summaryPage, 'og:title')?.content).toBe('Fallback Site');
    expect(summaryPage.description).toBe('Useful summary');
    expect(defaultPage.description).toBe('Site description');
  });

  it('passes detached normalized final page data and canonical URL to JSON-LD', () => {
    let receivedPage: Readonly<PageData> | undefined;
    let receivedCanonical = '';
    const build = createSeoPageDataBuilder({
      siteUrl: 'https://example.test/base/',
      normalizeFrontmatter: (page) => ({
        ...page.frontmatter,
        url: '/canonical-page',
        summary: 'Resolved summary',
      }),
      generateJsonLd: (page, context) => {
        receivedPage = page;
        receivedCanonical = context.canonicalUrl.toString();
        return {
          url: context.canonicalUrl.toString(),
          description: page.description,
        };
      },
    });
    const input = createPage();
    const page = build(input);
    const script = page.frontmatter.head.find(
      (entry: readonly unknown[]) => entry[0] === 'script',
    );
    const jsonLd = JSON.parse(String(script?.[2]));

    expect(receivedPage).not.toBe(input);
    expect(receivedPage?.frontmatter).not.toBe(input.frontmatter);
    expect(receivedPage?.description).toBe('Resolved summary');
    expect(receivedPage?.frontmatter.url).toBe('/canonical-page');
    expect(receivedCanonical).toBe('https://example.test/base/canonical-page');
    expect(jsonLd).toEqual({
      url: 'https://example.test/base/canonical-page',
      description: 'Resolved summary',
    });
  });

  it('rejects raw JSON-LD strings at runtime', () => {
    const build = createSeoPageDataBuilder({
      siteUrl: 'https://example.test',
      generateJsonLd: (() => '<script>raw</script>') as never,
    });
    expect(() => build(createPage())).toThrow(TypeError);
  });

  it('supports explicit preparation and normalized frontmatter callbacks without mutating input', () => {
    const input = createPage({ title: 'Original' });
    const build = createSeoPageDataBuilder({
      siteUrl: 'https://example.test',
      preparePage: (page) =>
        ({
          ...page,
          title: 'Prepared',
          frontmatter: {
            ...page.frontmatter,
            description: 'Prepared description',
          },
        }) as PageData,
      normalizeFrontmatter: (page) => ({
        ...page.frontmatter,
        url: '/custom-path',
      }),
      robotIndex: false,
    });
    const page = build(input);
    expect(page.title).toBe('Prepared');
    expect(input.title).toBe('Example **Page**');
    expect(findMeta(page, 'robots')?.content).toBe('noindex, nofollow');
    expect(page.frontmatter.head).toContainEqual([
      'link',
      { rel: 'canonical', href: 'https://example.test/custom-path' },
    ]);
  });

  it('covers explicit social, article, sanitization, and robots policies', () => {
    expect(
      sanitizeHeadEntries([
        null,
        [42],
        ['meta', { name: 'custom', empty: null, object: { value: true } }, 0],
      ]),
    ).toEqual([['meta', { name: 'custom' }, '0']]);

    const build = createSeoPageDataBuilder({
      siteUrl: 'https://example.test/base?query=drop#fragment',
      siteName: 'Example',
      includeTwitterDescription: false,
      robotIndex: 'deny',
    });
    const page = build(
      createPage({
        url: '/article',
        image: 'https://cdn.example/image.png',
        author: ['One', 'Two'],
        keywords: 'alpha, beta',
        ogType: 'article',
        audio: '/audio.mp3',
        video: 'https://cdn.example/video.mp4',
        jsonLDType: 'BlogPosting',
        lastmod: '2026-07-10',
        publishDate: '2026-07-01',
        locale: 'en_GB',
        head: [['style', {}, 'body{}']],
      }),
    );

    expect(page.frontmatter.head).toContainEqual(['style', {}, 'body{}']);
    expect(findMeta(page, 'og:image')?.content).toBe(
      'https://cdn.example/image.png',
    );
    expect(findMeta(page, 'author')?.content).toBe('One, Two');
    expect(findMeta(page, 'keywords')?.content).toBe('alpha, beta');
    expect(findMeta(page, 'robots')?.content).toBe('noindex, nofollow');
    expect(findMeta(page, 'og:audio')?.content).toBe(
      'https://example.test/base/audio.mp3',
    );
    expect(findMeta(page, 'og:video')?.content).toBe(
      'https://cdn.example/video.mp4',
    );
    expect(findMeta(page, 'article:modified_time')).toBeDefined();
    expect(findMeta(page, 'article:published_time')).toBeDefined();
    expect(findMeta(page, 'og:locale')?.content).toBe('en_GB');
    expect(findMeta(page, 'twitter:description')).toBeUndefined();
  });

  it('deeply detaches callback inputs and returned page data', () => {
    const input = {
      ...createPage(),
      params: {
        nested: { values: ['caller'] },
      },
      headers: [
        {
          level: 2,
          title: 'Parent',
          slug: 'parent',
          link: '#parent',
          children: [
            {
              level: 3,
              title: 'Child',
              slug: 'child',
              link: '#child',
              children: [],
            },
          ],
        },
      ],
    } as unknown as PageData;
    const build = createSeoPageDataBuilder({
      siteUrl: 'https://example.test',
      preparePage(page) {
        const params = page.params as unknown as {
          nested: { values: string[] };
        };
        params.nested.values.push('callback');
        page.headers[0]?.children.push({
          level: 3,
          title: 'Callback',
          slug: 'callback',
          link: '#callback',
          children: [],
        });
        return page as PageData;
      },
    });

    const result = build(input);
    const resultParams = result.params as unknown as {
      nested: { values: string[] };
    };
    resultParams.nested.values.push('consumer');
    result.headers[0]?.children.push({
      level: 3,
      title: 'Consumer',
      slug: 'consumer',
      link: '#consumer',
      children: [],
    });

    expect(
      (input.params as unknown as { nested: { values: string[] } }).nested
        .values,
    ).toEqual(['caller']);
    expect(input.headers[0]?.children).toHaveLength(1);
  });

  it('detaches nested values returned by the frontmatter normalizer', () => {
    const external = { nested: { values: ['owner'] } };
    const build = createSeoPageDataBuilder({
      siteUrl: 'https://example.test',
      normalizeFrontmatter: () => ({
        url: '/custom',
        injected: external,
      }),
    });
    const result = build(createPage());
    const injected = result.frontmatter.injected as {
      nested: { values: string[] };
    };

    injected.nested.values.push('consumer');
    expect(injected).not.toBe(external);
    expect(injected.nested).not.toBe(external.nested);
    expect(external.nested.values).toEqual(['owner']);
  });

  it('rejects missing, blank, or non-string normalized URLs', () => {
    for (const url of [undefined, null, '', '   ', 123]) {
      const build = createSeoPageDataBuilder({
        siteUrl: 'https://example.test/base/',
        normalizeFrontmatter: (() => ({ url })) as never,
      });
      expect(() => build(createPage())).toThrow(/non-empty string URL/);
    }
  });

  it('detaches typed views backed by shared memory before callbacks run', () => {
    const shared = new SharedArrayBuffer(2);
    const callerView = new Uint8Array(shared);
    callerView[0] = 1;
    const input = {
      ...createPage(),
      params: { view: callerView },
    } as unknown as PageData;
    const build = createSeoPageDataBuilder({
      siteUrl: 'https://example.test',
      preparePage(page) {
        const view = (page.params as unknown as { view: Uint8Array }).view;
        view[0] = 9;
        return page as PageData;
      },
    });

    const result = build(input);
    const resultView = (result.params as unknown as { view: Uint8Array }).view;
    expect(callerView[0]).toBe(1);
    expect(resultView[0]).toBe(9);
    expect(resultView.buffer).not.toBe(shared);
  });

  it.each([
    [true, 'index, follow'],
    [1, 'index, follow'],
    [0, 'noindex, nofollow'],
    ['yes', 'index, follow'],
    ['custom', 'index, follow'],
    ['', 'index, follow'],
  ] as const)('normalizes robot policy %j', (robotIndex, expected) => {
    const page = createSeoPageDataBuilder({
      siteUrl: 'https://example.test',
      robotIndex,
    })(createPage());
    expect(findMeta(page, 'robots')?.content).toBe(expected);
  });
});
