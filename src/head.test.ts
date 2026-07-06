import { describe, expect, it } from 'vitest';

import { createFontPreloadTransform } from './head';

describe('createFontPreloadTransform', () => {
  it('preloads matching fonts', () => {
    const transform = createFontPreloadTransform({ fontNames: ['Avenir'] });

    expect(transform({ assets: ['assets/Avenir-Book.abc.woff2', 'assets/app.js'] })).toEqual([
      [
        'link',
        {
          rel: 'preload',
          href: 'assets/Avenir-Book.abc.woff2',
          as: 'font',
          type: 'font/woff2',
          crossorigin: '',
        },
      ],
    ]);
  });
});
