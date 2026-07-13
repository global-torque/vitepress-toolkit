import {
  normalizeFrontmatter,
  type FrontmatterInput,
  type NormalizedFrontmatter,
  type NormalizeFrontmatterOptions,
  type PageDataLike,
} from '@global-torque/content-toolkit/pageData';

/**
 * Framework-neutral subset of VitePress content data accepted by the adapter.
 *
 * @public
 */
export interface VitePressPageData<
  TFrontmatter extends FrontmatterInput = FrontmatterInput,
> extends PageDataLike<TFrontmatter> {
  /** Parsed host frontmatter. */
  readonly frontmatter: TFrontmatter;
  /** Optional Markdown source requested by a VitePress content loader. */
  readonly src?: string;
  /** Optional rendered HTML requested by a VitePress content loader. */
  readonly html?: string;
  /** Optional rendered excerpt requested by a VitePress content loader. */
  readonly excerpt?: string;
}

/**
 * Pure, strict adapter from VitePress content data to a detached content record.
 *
 * @public
 */
export function normalizeVitePressFrontmatter<
  TFrontmatter extends FrontmatterInput = FrontmatterInput,
>(
  page: VitePressPageData<TFrontmatter>,
  options: NormalizeFrontmatterOptions = {},
): NormalizedFrontmatter<TFrontmatter> {
  if (Object.prototype.hasOwnProperty.call(page.frontmatter, 'cover')) {
    throw new TypeError(
      'Nested cover frontmatter is not part of the strict public contract.',
    );
  }
  return normalizeFrontmatter(page, options);
}
