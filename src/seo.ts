import { normalizeVitePressFrontmatter } from './content.js';

/**
 * Package-owned structural page-data contract compatible with VitePress 1.x.
 * It prevents consumers from loading VitePress's complete build-tool type
 * graph merely to use the framework-neutral SEO builder.
 *
 * @public
 */
export interface SeoPageData {
  /** Root-relative source path. */
  readonly relativePath: string;
  /** Source file path after host rewrites. */
  readonly filePath: string;
  /** Resolved page title. */
  readonly title: string;
  /** Optional VitePress title-template override. */
  readonly titleTemplate?: string | boolean;
  /** Resolved page description. */
  readonly description: string;
  /** Detached heading tree. */
  readonly headers: SeoPageHeader[];
  /** Detached host frontmatter. */
  readonly frontmatter: Record<string, unknown>;
  /** Optional detached dynamic-route parameters. */
  readonly params?: Record<string, unknown>;
  /** Whether the page represents a not-found result. */
  readonly isNotFound?: boolean;
  /** Optional last-modified epoch timestamp. */
  readonly lastUpdated?: number;
}

/** Package-owned structural heading contract compatible with VitePress 1.x. @public */
export interface SeoPageHeader {
  /** Heading depth. */
  readonly level: number;
  /** Rendered heading title. */
  readonly title: string;
  /** Heading identifier. */
  readonly slug: string;
  /** Heading anchor link. */
  readonly link: string;
  /** Nested headings. */
  readonly children: SeoPageHeader[];
}

/** SEO builder output with a sanitized, always-present head collection. @public */
export interface SeoPageDataResult extends SeoPageData {
  /** Detached frontmatter with the sanitized generated head collection. */
  readonly frontmatter: Record<string, unknown> & {
    /** Sanitized, idempotent head entries. */
    readonly head: readonly HeadEntry[];
  };
}

/** Sanitized primitive attributes for one VitePress head entry. @public */
export type HeadAttrs = Readonly<Record<string, string | number | boolean>>;
/** Sanitized VitePress head tuple. @public */
export type HeadEntry = readonly [string, HeadAttrs?, string?];
/** JSON-LD primitive value. @public */
export type JsonLdPrimitive = string | number | boolean | null;
/** Recursive JSON-LD value. @public */
export type JsonLdValue =
  JsonLdPrimitive | JsonLdObject | readonly JsonLdValue[];
/** JSON-LD object contract. @public */
export interface JsonLdObject {
  /** JSON-LD property value. */
  readonly [key: string]: JsonLdValue;
}

/**
 * Canonical URL context passed to host JSON-LD generators.
 *
 * @public
 */
export interface SeoBuildContext {
  /** Normalized absolute site base. */
  readonly siteUrl: URL;
  /** Canonical absolute page URL. */
  readonly canonicalUrl: URL;
}

/** Required result of a host frontmatter normalizer. @public */
export interface SeoFrontmatterResult {
  /** Non-empty page URL resolved against the configured site base. */
  readonly url: string;
  /** Additional detached host frontmatter fields. */
  readonly [key: string]: unknown;
}

/**
 * Explicit host policy for detached SEO page-data construction.
 *
 * @public
 */
export interface CreateSeoPageDataBuilderOptions {
  /** Absolute site base, including any deployed base path. */
  siteUrl: string | URL;
  /** Optional site name used only in requested tags and fallbacks. */
  siteName?: string;
  /** Default author when frontmatter does not provide one. */
  author?: string;
  /** Default non-empty description. */
  description?: string;
  /** Default keywords when frontmatter does not provide them. */
  keywords?: readonly string[] | string;
  /** Default Open Graph locale. */
  locale?: string;
  /** Host robots policy expressed as a primitive. */
  robotIndex?: string | number | boolean | null;
  /** Pure host frontmatter normalization callback. */
  normalizeFrontmatter?: (
    pageData: Readonly<SeoPageData>,
  ) => SeoFrontmatterResult;
  /** Pure host preparation callback run before normalization. */
  preparePage?: (pageData: Readonly<SeoPageData>) => SeoPageData;
  /** Remove host markup from generated title, description, and keywords. */
  stripText?: (value: string) => string;
  /** Generate structured JSON-LD from detached final page data. */
  generateJsonLd?: (
    pageData: Readonly<SeoPageData>,
    context: SeoBuildContext,
  ) => JsonLdObject | undefined;
  /** Resolve a preferred description; empty values fall through. */
  resolveDescription?: (pageData: Readonly<SeoPageData>) => string;
  /** Host-owned fallback image path or URL. */
  defaultImage?: string;
  /** Emit the nonstandard `meta[name=title]` compatibility entry. */
  includeMetaTitle?: boolean;
  /** Emit a Twitter description. Defaults to `true`. */
  includeTwitterDescription?: boolean;
  /** Emit Open Graph site name. Defaults to `false`. */
  includeSiteName?: boolean;
}

const MANAGED_META = new Set([
  'title',
  'description',
  'author',
  'robots',
  'keywords',
  'twitter:title',
  'twitter:image',
  'twitter:url',
  'twitter:description',
  'og:title',
  'og:image',
  'og:url',
  'og:description',
  'og:type',
  'og:audio',
  'og:video',
  'og:locale',
  'og:site_name',
  'article:modified_time',
  'article:published_time',
]);

function normalizeHeadValue(
  value: unknown,
): string | number | boolean | undefined {
  if (value === null || value === undefined) return undefined;
  if (['string', 'number', 'boolean'].includes(typeof value)) {
    return value as string | number | boolean;
  }
  return undefined;
}

/**
 * Detach head tuples and retain only primitive attribute/inner values.
 *
 * @public
 */
export function sanitizeHeadEntries(
  head: readonly unknown[],
): readonly HeadEntry[] {
  return Object.freeze(
    head
      .filter(
        (
          entry,
        ): entry is readonly [string, Record<string, unknown>?, unknown?] =>
          Array.isArray(entry) && typeof entry[0] === 'string',
      )
      .map(([tag, attrs = {}, innerHTML]) => {
        const safeAttrs: Record<string, string | number | boolean> = {};
        for (const [key, value] of Object.entries(attrs)) {
          const normalized = normalizeHeadValue(value);
          if (normalized !== undefined) safeAttrs[key] = normalized;
        }
        const normalizedHtml = normalizeHeadValue(innerHTML);
        return Object.freeze(
          normalizedHtml === undefined
            ? ([tag, Object.freeze(safeAttrs)] as const)
            : ([
                tag,
                Object.freeze(safeAttrs),
                String(normalizedHtml),
              ] as const),
        );
      }),
  );
}

function isManaged(entry: HeadEntry): boolean {
  const [tag, attrs = {}] = entry;
  if (tag === 'link' && attrs.rel === 'canonical') return true;
  if (tag === 'script' && attrs.type === 'application/ld+json') {
    return true;
  }
  if (tag !== 'meta') return false;
  return [attrs.name, attrs.property].some(
    (name) => typeof name === 'string' && MANAGED_META.has(name),
  );
}

function siteBaseUrl(value: string | URL): URL {
  const url = new URL(value);
  if (!url.pathname.endsWith('/')) url.pathname += '/';
  url.search = '';
  url.hash = '';
  return url;
}

function absoluteUrl(value: string, siteUrl: URL): URL {
  if (/^https?:\/\//i.test(value)) return new URL(value);
  return new URL(value.replace(/^\/+/, ''), siteUrl);
}

function meta(name: string, content: unknown): HeadEntry {
  return Object.freeze([
    'meta',
    Object.freeze({ name, content: String(normalizeHeadValue(content) ?? '') }),
  ]);
}

function openGraph(property: string, content: unknown): HeadEntry {
  return Object.freeze([
    'meta',
    Object.freeze({
      property,
      content: String(normalizeHeadValue(content) ?? ''),
    }),
  ]);
}

function resolveRobotIndex(
  value: CreateSeoPageDataBuilderOptions['robotIndex'],
): boolean {
  if (value === undefined || value === null || value === '') return true;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  const normalized = value.trim().toLowerCase();
  if (['false', '0', 'no', 'noindex', 'deny'].includes(normalized))
    return false;
  if (['true', '1', 'yes', 'index', 'allow'].includes(normalized)) return true;
  return Boolean(normalized);
}

function serializeJsonLd(value: unknown): string {
  if (value === null || Array.isArray(value) || typeof value !== 'object') {
    throw new TypeError('JSON-LD must be a non-null object.');
  }
  return JSON.stringify(value).replaceAll('<', '\\u003c');
}

function cloneDetached<T>(value: T, seen = new WeakMap<object, unknown>()): T {
  if (
    value === null ||
    (typeof value !== 'object' && typeof value !== 'function')
  ) {
    return value;
  }
  if (typeof value === 'function') return value;
  const cached = seen.get(value);
  if (cached !== undefined) return cached as T;
  if (value instanceof Date) return new Date(value.getTime()) as T;
  if (value instanceof URL) return new URL(value.toString()) as T;
  if (value instanceof ArrayBuffer) return value.slice(0) as T;
  if (
    typeof SharedArrayBuffer !== 'undefined' &&
    value instanceof SharedArrayBuffer
  ) {
    return new Uint8Array(new Uint8Array(value)).buffer as T;
  }
  if (value instanceof DataView) {
    const bytes = new Uint8Array(
      value.buffer,
      value.byteOffset,
      value.byteLength,
    );
    return new DataView(new Uint8Array(bytes).buffer) as T;
  }
  if (ArrayBuffer.isView(value)) {
    const constructor = value.constructor as {
      readonly name?: string;
      from?: (input: ArrayBufferView) => unknown;
      new (input: ArrayLike<number> | ArrayLike<bigint>): ArrayBufferView;
    };
    if (constructor.name === 'Buffer' && constructor.from) {
      return constructor.from(value) as T;
    }
    return new constructor(
      value as unknown as ArrayLike<number> | ArrayLike<bigint>,
    ) as T;
  }
  if (Array.isArray(value)) {
    const clone: unknown[] = new Array(value.length);
    seen.set(value, clone);
    Reflect.ownKeys(value).forEach((key) => {
      if (key === 'length') return;
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (descriptor?.enumerable && 'value' in descriptor) {
        Object.defineProperty(clone, key, {
          configurable: true,
          enumerable: true,
          writable: true,
          value: cloneDetached(descriptor.value, seen),
        });
      }
    });
    return clone as T;
  }

  const clone = (
    Reflect.getPrototypeOf(value) === null ? Object.create(null) : {}
  ) as Record<PropertyKey, unknown>;
  seen.set(value, clone);
  Reflect.ownKeys(value).forEach((key) => {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (descriptor?.enumerable && 'value' in descriptor) {
      Object.defineProperty(clone, key, {
        configurable: true,
        enumerable: true,
        writable: true,
        value: cloneDetached(descriptor.value, seen),
      });
    }
  });
  return clone as T;
}

function clonePageData(pageData: Readonly<SeoPageData>): SeoPageDataResult {
  const detached = cloneDetached(pageData);
  const frontmatter = detached.frontmatter as Readonly<Record<string, unknown>>;
  const rawHead = frontmatter.head;
  return {
    ...detached,
    frontmatter: {
      ...frontmatter,
      head: sanitizeHeadEntries(Array.isArray(rawHead) ? rawHead : []).map(
        (entry) => [...entry],
      ),
    },
    headers: detached.headers,
    ...(detached.params ? { params: detached.params } : {}),
  };
}

function firstNonEmptyTransformed(
  transform: (value: string) => string,
  ...values: readonly unknown[]
): string | undefined {
  for (const value of values) {
    const source =
      typeof value === 'string'
        ? value
        : typeof value === 'number' || typeof value === 'boolean'
          ? String(value)
          : undefined;
    if (source === undefined || source.trim() === '') continue;
    const transformed = transform(source);
    if (transformed.trim() !== '') return transformed;
  }
  return undefined;
}

/**
 * Build detached, idempotent SEO page data. Hosts apply it to VitePress hooks.
 *
 * @public
 */
export function createSeoPageDataBuilder(
  options: CreateSeoPageDataBuilderOptions,
) {
  const siteUrl = siteBaseUrl(options.siteUrl);
  const stripText = options.stripText ?? ((value: string) => value);

  return (input: Readonly<SeoPageData>): SeoPageDataResult => {
    const cloned = clonePageData(input);
    const prepared = options.preparePage
      ? clonePageData(options.preparePage(cloned))
      : cloned;
    const normalized = cloneDetached(
      options.normalizeFrontmatter?.(prepared) ??
        normalizeVitePressFrontmatter(prepared as never),
    );
    if (typeof normalized.url !== 'string' || normalized.url.trim() === '') {
      throw new TypeError(
        'SEO frontmatter normalization must return a non-empty string URL.',
      );
    }
    const frontmatter: Record<string, unknown> = {
      ...prepared.frontmatter,
      ...normalized,
    };
    const canonicalUrl = absoluteUrl(normalized.url, siteUrl);
    const context = Object.freeze({
      siteUrl: new URL(siteUrl),
      canonicalUrl: new URL(canonicalUrl),
    });
    const title =
      firstNonEmptyTransformed(
        stripText,
        prepared.title,
        frontmatter.title,
        options.siteName,
      ) ?? '';
    const fallbackDescription = [
      firstNonEmptyTransformed(stripText, frontmatter.title, prepared.title),
      firstNonEmptyTransformed(stripText, options.siteName),
    ]
      .filter((value): value is string => value !== undefined)
      .join(' ');
    const description =
      firstNonEmptyTransformed(
        stripText,
        options.resolveDescription?.(prepared),
        frontmatter.description,
        prepared.description,
        frontmatter.summary,
        options.description,
      ) ?? fallbackDescription;
    const existing = sanitizeHeadEntries(
      (frontmatter.head as readonly unknown[] | undefined) ?? [],
    ).filter((entry) => !isManaged(entry));
    const generated: HeadEntry[] = [];

    if (options.includeMetaTitle === true) generated.push(meta('title', title));
    generated.push(openGraph('og:title', title), meta('twitter:title', title));

    const image =
      typeof frontmatter.image === 'string' && frontmatter.image !== ''
        ? frontmatter.image
        : options.defaultImage;
    if (image) {
      const canonicalImage = absoluteUrl(image, siteUrl).toString();
      generated.push(
        openGraph('og:image', canonicalImage),
        meta('twitter:image', canonicalImage),
      );
    }

    generated.push(
      Object.freeze([
        'link',
        Object.freeze({ rel: 'canonical', href: canonicalUrl.toString() }),
      ]),
      openGraph('og:url', canonicalUrl.toString()),
      meta('twitter:url', canonicalUrl.toString()),
      meta('description', description),
      openGraph('og:description', description),
    );
    if (options.includeTwitterDescription !== false) {
      generated.push(meta('twitter:description', description));
    }

    const author = frontmatter.author ?? options.author;
    if (author !== undefined) {
      generated.push(
        meta('author', Array.isArray(author) ? author.join(', ') : author),
      );
    }
    generated.push(
      meta(
        'robots',
        resolveRobotIndex(options.robotIndex)
          ? 'index, follow'
          : 'noindex, nofollow',
      ),
    );

    const keywords =
      frontmatter.keywords ?? frontmatter.tags ?? options.keywords;
    if (keywords !== undefined) {
      const keywordText = Array.isArray(keywords)
        ? (keywords as readonly unknown[])
            .map(normalizeHeadValue)
            .filter(
              (value): value is string | number | boolean =>
                value !== undefined,
            )
            .join(', ')
        : normalizeHeadValue(keywords);
      generated.push(meta('keywords', stripText(String(keywordText ?? ''))));
    }
    generated.push(openGraph('og:type', frontmatter.ogType ?? 'website'));

    if (typeof frontmatter.audio === 'string' && frontmatter.audio.trim()) {
      generated.push(
        openGraph(
          'og:audio',
          absoluteUrl(frontmatter.audio, siteUrl).toString(),
        ),
      );
    }
    if (typeof frontmatter.video === 'string' && frontmatter.video.trim()) {
      generated.push(
        openGraph(
          'og:video',
          absoluteUrl(frontmatter.video, siteUrl).toString(),
        ),
      );
    }
    if (frontmatter.jsonLDType === 'BlogPosting') {
      if (frontmatter.lastmod)
        generated.push(openGraph('article:modified_time', frontmatter.lastmod));
      if (frontmatter.publishDate) {
        generated.push(
          openGraph('article:published_time', frontmatter.publishDate),
        );
      }
    }
    generated.push(
      openGraph('og:locale', frontmatter.locale ?? options.locale ?? ''),
    );
    if (options.includeSiteName === true && options.siteName) {
      generated.push(openGraph('og:site_name', options.siteName));
    }

    const builtPage = {
      ...prepared,
      description,
      frontmatter: {
        ...frontmatter,
        description,
      },
    };
    const jsonLd = options.generateJsonLd?.(clonePageData(builtPage), context);
    if (jsonLd) {
      generated.push(
        Object.freeze([
          'script',
          Object.freeze({
            type: 'application/ld+json',
            'data-gt-managed': 'seo',
          }),
          serializeJsonLd(jsonLd),
        ]),
      );
    }

    return {
      ...builtPage,
      frontmatter: {
        ...builtPage.frontmatter,
        head: [...existing, ...generated].map((entry) => [...entry]),
      },
    };
  };
}
