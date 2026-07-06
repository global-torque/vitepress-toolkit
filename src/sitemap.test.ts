import { describe, expect, it } from 'vitest';

import { createSitemapConfig } from './sitemap';

describe('createSitemapConfig', () => {
  it('formats urls and drops draft items', () => {
    const sitemap = createSitemapConfig({
      env: { FRONTEND_URL: 'https://example.com' },
      urlFormat: (url) => url.toLowerCase(),
    });

    expect(sitemap.hostname).toBe('https://example.com');
    expect(sitemap.transformItems([{ url: '/UPPER' }])).toEqual([{ url: '/upper' }]);
    expect(sitemap.transformItems([{ url: '/draft', draft: true }])).toEqual([{}]);
  });
});
