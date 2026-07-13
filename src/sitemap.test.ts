import { describe, expect, it } from 'vitest';
import { SitemapStream, streamToPromise } from 'sitemap';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import type { UserConfig } from 'vitepress';

import { createSitemapConfig, type SitemapItem } from './sitemap';

interface LinkedSitemapItem extends SitemapItem {
  readonly links?: readonly {
    readonly lang: string;
    readonly url: string;
  }[];
  readonly lastmodfile?: string | Buffer | URL;
  readonly img?:
    | string
    | {
        readonly url: string;
        readonly license?: string;
      };
  readonly video?: Readonly<Record<string, string>>;
}

interface DatedSitemapItem extends SitemapItem {
  readonly lastmod?: Date;
  readonly payload?: Uint8Array;
}

describe('createSitemapConfig', () => {
  it('filters drafts and returns detached mutable absolute transport items', () => {
    const items = Object.freeze([
      Object.freeze({ url: '/UPPER', draft: false, label: 'keep' }),
      Object.freeze({ url: '/draft', draft: true, label: 'drop' }),
    ]);
    const sitemap = createSitemapConfig({
      siteUrl: 'https://example.test/base/',
      formatUrl: (url) => url.toLowerCase(),
    });

    const result = sitemap.transformItems(items);
    expect(sitemap.hostname).toBe('https://example.test/base/');
    expect(result).toEqual([
      {
        url: 'https://example.test/base/upper',
        draft: false,
        label: 'keep',
      },
    ]);
    expect(result[0]).not.toBe(items[0]);
    expect(items[0]?.url).toBe('/UPPER');
    expect(result).not.toBe(items);
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result[0])).toBe(false);
    expect(Object.isExtensible(sitemap)).toBe(true);
  });

  it('runs host transforms on clones only', () => {
    const original = Object.freeze({ url: '/page', draft: false, priority: 1 });
    const sitemap = createSitemapConfig({
      siteUrl: new URL('https://example.test'),
      transformItem: (item) => ({ ...item, priority: 2 }),
    });
    const result = sitemap.transformItems([original]);
    expect(result).toEqual([
      {
        url: 'https://example.test/page',
        draft: false,
        priority: 2,
      },
    ]);
    expect(Object.isFrozen(result[0])).toBe(false);
    expect(original.priority).toBe(1);
  });

  it('clones dates and accepts absolute item URLs', () => {
    const lastmod = new Date('2026-07-10T00:00:00.000Z');
    const shared = new SharedArrayBuffer(2);
    const payload = new Uint8Array(shared);
    payload[0] = 1;
    const sitemap = createSitemapConfig<DatedSitemapItem>({
      siteUrl: 'https://example.test/base',
    });
    const result = sitemap.transformItems([
      { url: '/dated', lastmod, payload },
      { url: 'https://other.example/page' },
    ]);

    expect(result[0]?.url).toBe('https://example.test/base/dated');
    expect(result[0]?.lastmod).not.toBe(lastmod);
    expect(Object.isFrozen(result[0]?.lastmod)).toBe(false);
    expect(result[0]?.payload).not.toBe(payload);
    expect(result[0]?.payload?.buffer).not.toBe(shared);
    result[0]?.payload?.set([9]);
    expect(payload[0]).toBe(1);
    expect(result[1]?.url).toBe('https://other.example/page');
  });

  it('is directly assignable to the VitePress sitemap contract', () => {
    const config = {
      sitemap: createSitemapConfig({ siteUrl: 'https://example.test' }),
    } satisfies UserConfig;

    expect(config.sitemap.hostname).toBe('https://example.test/');
  });

  it('integrates with SitemapStream across nested mutable URL fields and a base path', async () => {
    const packageJsonPath = path.resolve(process.cwd(), 'package.json');
    const bufferPath = Buffer.from(packageJsonPath);
    const urlPath = pathToFileURL(packageJsonPath);
    const sitemap = createSitemapConfig<LinkedSitemapItem>({
      siteUrl: 'https://example.test/base/',
    });
    const items = sitemap.transformItems([
      {
        url: '/page',
        links: [
          { lang: 'es', url: 'es/page' },
          { lang: 'fr', url: '/fr/page' },
        ],
        img: {
          url: 'image.png',
          license: '/licenses/image',
        },
        video: {
          thumbnail_loc: 'thumb.png',
          title: 'Video',
          description: 'Video description',
          content_loc: '/video.mp4',
        },
        lastmodfile: bufferPath,
      } as LinkedSitemapItem,
      {
        url: '/url-path',
        lastmodfile: urlPath,
      } as LinkedSitemapItem,
    ]);
    expect(Object.isFrozen(items[0]?.links)).toBe(false);
    expect(Object.isFrozen(items[0])).toBe(false);
    expect(Buffer.isBuffer(items[0]?.lastmodfile)).toBe(true);
    expect(items[0]?.lastmodfile).not.toBe(bufferPath);
    expect(items[1]?.lastmodfile).toBeInstanceOf(URL);
    expect(items[1]?.lastmodfile).not.toBe(urlPath);

    const stream = new SitemapStream(sitemap);
    const xmlPromise = streamToPromise(stream);
    items.forEach((item) => stream.write(item));
    stream.end();
    const xml = (await xmlPromise).toString();

    expect(xml).toContain('<loc>https://example.test/base/page</loc>');
    expect(xml).toContain(
      '<xhtml:link rel="alternate" hreflang="es" href="https://example.test/base/es/page"/>',
    );
    expect(xml).toContain(
      '<xhtml:link rel="alternate" hreflang="fr" href="https://example.test/base/fr/page"/>',
    );
    expect(xml).toContain(
      '<image:loc>https://example.test/base/image.png</image:loc>',
    );
    expect(xml).toContain(
      '<image:license>https://example.test/base/licenses/image</image:license>',
    );
    expect(xml).toContain('<loc>https://example.test/base/url-path</loc>');
    expect(xml).toContain(
      '<video:thumbnail_loc>https://example.test/base/thumb.png</video:thumbnail_loc>',
    );
    expect(xml).toContain(
      '<video:content_loc>https://example.test/base/video.mp4</video:content_loc>',
    );
  });
});
