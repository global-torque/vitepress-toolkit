/**
 * Minimal VitePress sitemap item understood by draft filtering and URL resolution.
 *
 * @public
 */
export interface SitemapItem {
  /** Relative or absolute page URL. */
  readonly url: string;
  /** Exclude the item when `true`. */
  readonly draft?: boolean;
}

/**
 * Host policy for VitePress sitemap construction.
 *
 * @public
 */
export interface CreateSitemapConfigOptions<
  TItem extends SitemapItem = SitemapItem,
> {
  /** Absolute site base, including any deployed base path. */
  siteUrl: string | URL;
  /** Format a relative item URL before absolute resolution. */
  formatUrl?: (url: string) => string;
  /** Return a transformed clone; the callback input is frozen. */
  transformItem?: (item: Readonly<TItem>) => TItem;
}

function cloneValue(value: unknown): unknown {
  if (value instanceof Date) return new Date(value.getTime());
  if (value instanceof URL) return new URL(value.toString());
  if (value instanceof ArrayBuffer) return value.slice(0);
  if (
    typeof SharedArrayBuffer !== 'undefined' &&
    value instanceof SharedArrayBuffer
  ) {
    return new Uint8Array(new Uint8Array(value)).buffer;
  }
  if (value instanceof DataView) {
    const bytes = new Uint8Array(
      value.buffer,
      value.byteOffset,
      value.byteLength,
    );
    return new DataView(new Uint8Array(bytes).buffer);
  }
  if (ArrayBuffer.isView(value)) {
    const constructor = value.constructor as {
      readonly name?: string;
      from?: (input: ArrayBufferView) => unknown;
    };
    if (constructor.name === 'Buffer' && constructor.from) {
      return constructor.from(value);
    }
    const View = constructor as unknown as new (
      input: ArrayLike<number> | ArrayLike<bigint>,
    ) => ArrayBufferView;
    return new View(value as unknown as ArrayLike<number> | ArrayLike<bigint>);
  }
  if (Array.isArray(value)) {
    return (value as readonly unknown[]).map(cloneValue);
  }
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, cloneValue(item)]),
    );
  }
  return value;
}

function deepFreezeValue(value: unknown): unknown {
  if (ArrayBuffer.isView(value)) {
    // ECMAScript forbids freezing non-empty typed arrays. They are detached
    // above, so callback mutation cannot reach the caller's binary path value.
    return value;
  }
  if (Array.isArray(value)) {
    value.forEach(deepFreezeValue);
  } else if (value !== null && typeof value === 'object') {
    Object.values(value).forEach(deepFreezeValue);
  }
  return value !== null && typeof value === 'object'
    ? Object.freeze(value)
    : value;
}

function cloneAndFreeze<T>(value: T): T {
  return deepFreezeValue(cloneValue(value)) as T;
}

function siteBaseUrl(value: string | URL): URL {
  const url = new URL(value);
  if (!url.pathname.endsWith('/')) url.pathname += '/';
  url.search = '';
  url.hash = '';
  return url;
}

function absoluteItemUrl(value: string, siteUrl: URL): string {
  if (/^https?:\/\//i.test(value)) return new URL(value).toString();
  return new URL(value.replace(/^\/+/, ''), siteUrl).toString();
}

function normalizeUrlField(
  record: Record<string, unknown>,
  key: string,
  siteUrl: URL,
) {
  if (typeof record[key] === 'string') {
    record[key] = absoluteItemUrl(record[key], siteUrl);
  }
}

function normalizeNestedUrls(item: Record<string, unknown>, siteUrl: URL) {
  for (const field of ['androidLink', 'ampLink']) {
    normalizeUrlField(item, field, siteUrl);
  }

  if (Array.isArray(item.links)) {
    for (const link of item.links) {
      if (link !== null && typeof link === 'object') {
        normalizeUrlField(link as Record<string, unknown>, 'url', siteUrl);
      }
    }
  }

  const images = Array.isArray(item.img) ? item.img : [item.img];
  for (const image of images) {
    if (typeof image === 'string') {
      const index = (item.img as unknown[]).indexOf(image);
      if (Array.isArray(item.img))
        item.img[index] = absoluteItemUrl(image, siteUrl);
      else item.img = absoluteItemUrl(image, siteUrl);
    } else if (image !== null && typeof image === 'object') {
      const imageRecord = image as Record<string, unknown>;
      normalizeUrlField(imageRecord, 'url', siteUrl);
      normalizeUrlField(imageRecord, 'license', siteUrl);
    }
  }

  const videos = Array.isArray(item.video) ? item.video : [item.video];
  for (const video of videos) {
    if (video === null || typeof video !== 'object') continue;
    const videoRecord = video as Record<string, unknown>;
    for (const field of [
      'thumbnail_loc',
      'content_loc',
      'player_loc',
      'gallery_loc',
      'uploader:info',
    ]) {
      normalizeUrlField(videoRecord, field, siteUrl);
    }
  }
}

/**
 * Build a VitePress-compatible mutable config with detached transport items.
 * The returned array is frozen, while its cloned items remain mutable because
 * SitemapStream normalizes standard fields in place.
 *
 * @public
 */
export function createSitemapConfig<TItem extends SitemapItem = SitemapItem>(
  input: CreateSitemapConfigOptions<TItem>,
) {
  const { siteUrl, formatUrl = (url) => url, transformItem } = input;
  const baseUrl = siteBaseUrl(siteUrl);

  // VitePress passes this object to SitemapStream, which adds stream options.
  // The config itself therefore must remain extensible.
  return {
    hostname: baseUrl.toString(),
    lastmodDateOnly: false,
    transformItems: (items: readonly TItem[]): TItem[] =>
      Object.freeze(
        items
          .filter((item) => item.draft !== true)
          .map((item) => {
            const formatted = {
              ...item,
              url: formatUrl(item.url),
            } as TItem;
            const transformed =
              transformItem?.(cloneAndFreeze(formatted)) ?? formatted;
            const transportItem = cloneValue({
              ...transformed,
              url: absoluteItemUrl(transformed.url, baseUrl),
            }) as TItem;
            normalizeNestedUrls(
              transportItem as Record<string, unknown>,
              baseUrl,
            );
            return transportItem;
          }),
      ) as TItem[],
  };
}
