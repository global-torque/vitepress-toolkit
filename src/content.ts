import type { ContentData } from 'vitepress';
import type { FrontmatterLike } from '@global-torque/content-toolkit/pageData';
import {
  legacyCoverNormalizeFrontmatterOptions,
  normalizeFrontmatter,
  type NormalizedFrontmatter,
  type NormalizeFrontmatterOptions,
  type PageDataLike,
} from '@global-torque/content-toolkit/pageData';

export type VitePressPageData<TFrontmatter extends FrontmatterLike = FrontmatterLike> =
  Omit<ContentData, 'frontmatter'> &
  Omit<PageDataLike, 'frontmatter'> & {
    frontmatter: TFrontmatter;
  };

export {
  legacyCoverNormalizeFrontmatterOptions,
  type NormalizeFrontmatterOptions,
};

export function normalizeVitePressFrontmatter<TFrontmatter extends FrontmatterLike = FrontmatterLike>(
  page: ContentData,
  options: NormalizeFrontmatterOptions = legacyCoverNormalizeFrontmatterOptions,
): NormalizedFrontmatter<TFrontmatter> {
  return normalizeFrontmatter(
    page as VitePressPageData<TFrontmatter>,
    options,
  );
}

export function createVitePressFrontmatterRecord<TFrontmatter extends FrontmatterLike = FrontmatterLike>(
  page: ContentData,
  options: NormalizeFrontmatterOptions = legacyCoverNormalizeFrontmatterOptions,
): NormalizedFrontmatter<TFrontmatter> {
  return {
    ...normalizeVitePressFrontmatter<TFrontmatter>(page, options),
  };
}
