import { describe, expect, it } from 'vitest';

import { createFontPreloadTransform } from './head';

describe('createFontPreloadTransform', () => {
  it('requires explicit font policy', () => {
    expect(() => createFontPreloadTransform({})).toThrow(TypeError);
    expect(() => createFontPreloadTransform({ fontNames: [''] })).toThrow(
      TypeError,
    );
    expect(() => createFontPreloadTransform({ fontNames: ['  '] })).toThrow(
      TypeError,
    );
  });

  it('escapes font names and emits correct metadata', () => {
    const transform = createFontPreloadTransform({ fontNames: ['Admin+Sans'] });
    expect(
      transform({
        assets: [
          'assets/Admin+Sans-Regular.woff2',
          'assets/AdminxSans-Regular.woff2',
        ],
      }),
    ).toEqual([
      [
        'link',
        {
          rel: 'preload',
          href: 'assets/Admin+Sans-Regular.woff2',
          as: 'font',
          type: 'font/woff2',
          crossorigin: '',
        },
      ],
    ]);
  });

  it('neutralizes stateful global and sticky regex flags', () => {
    const transform = createFontPreloadTransform({
      fontPattern: /font-\d+\.woff2/gy,
    });
    expect(
      transform({ assets: ['font-1.woff2', 'font-2.woff2'] })?.map(
        (entry) => entry[1].href,
      ),
    ).toEqual(['font-1.woff2', 'font-2.woff2']);
  });

  it('can select only the first stable match', () => {
    const transform = createFontPreloadTransform({
      fontPattern: /\.ttf$/,
      firstOnly: true,
    });
    expect(transform({ assets: ['a.ttf', 'b.ttf'] })).toHaveLength(1);
  });

  it('handles supported font MIME variants and an empty match set', () => {
    const transform = createFontPreloadTransform({
      fontPattern: /font(?:\.[a-z]+)?$/i,
    });
    expect(
      transform({ assets: ['font.eot', 'font.svg', 'font'] })?.map(
        (entry) => entry[1].type,
      ),
    ).toEqual(['application/vnd.ms-fontobject', 'image/svg+xml', 'font/woff2']);
    expect(transform({ assets: ['image.png'] })).toBeUndefined();
  });
});
