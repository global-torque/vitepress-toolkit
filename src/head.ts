/** One fresh font-preload tuple accepted by a VitePress head hook. @public */
export type FontPreloadHeadEntry = [tag: 'link', attrs: Record<string, string>];

/**
 * Explicit policy for selecting generated font assets to preload.
 *
 * @public
 */
export interface CreateFontPreloadTransformOptions {
  /** Non-empty literal font-name prefixes; safely escaped before matching. */
  fontNames?: readonly string[];
  /** Host-supplied font matcher; global and sticky state is removed. */
  fontPattern?: RegExp;
  /** Emit only the first matching asset. Defaults to `false`. */
  firstOnly?: boolean;
}

/**
 * Generated asset context accepted by the head transform.
 *
 * @public
 */
export interface TransformHeadContext {
  /** Generated asset paths in host order. */
  readonly assets: readonly string[];
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function statelessPattern(pattern: RegExp): RegExp {
  return new RegExp(pattern.source, pattern.flags.replace(/[gy]/g, ''));
}

function fontMimeType(extension: string): string {
  if (extension === 'eot') return 'application/vnd.ms-fontobject';
  if (extension === 'svg') return 'image/svg+xml';
  return `font/${extension}`;
}

/**
 * Create a deterministic VitePress head transform for font preloads.
 *
 * @public
 */
export function createFontPreloadTransform(
  input: CreateFontPreloadTransformOptions,
) {
  const { fontNames, fontPattern, firstOnly = false } = input;
  if (fontNames?.some((name) => name.trim() === '')) {
    throw new TypeError('fontNames entries must be non-empty.');
  }
  const normalizedFontNames = fontNames?.map((name) => name.trim());
  if (
    !fontPattern &&
    (!normalizedFontNames || normalizedFontNames.length === 0)
  ) {
    throw new TypeError('Provide fontPattern or at least one fontNames entry.');
  }
  const pattern = statelessPattern(
    fontPattern ??
      new RegExp(
        `(?:${(normalizedFontNames ?? []).map(escapeRegExp).join('|')})[-a-zA-Z0-9.]*\\.(?:woff2?|ttf|eot|svg)(?:[?#].*)?$`,
        'i',
      ),
  );

  return ({
    assets,
  }: TransformHeadContext): FontPreloadHeadEntry[] | undefined => {
    const matches = assets.filter((file) => pattern.test(file));
    const selected = firstOnly ? matches.slice(0, 1) : matches;
    if (selected.length === 0) return undefined;

    return selected.map((fontFile) => {
      const extension =
        /\.([a-z0-9]+)(?:[?#].*)?$/i.exec(fontFile)?.[1]?.toLowerCase() ??
        'woff2';
      return [
        'link',
        {
          rel: 'preload',
          href: fontFile,
          as: 'font',
          type: fontMimeType(extension),
          crossorigin: '',
        },
      ] satisfies FontPreloadHeadEntry;
    });
  };
}
