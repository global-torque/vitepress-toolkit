import type { ContentData } from 'vitepress';
import type { FrontmatterLike } from '@global-torque/content-toolkit/pageData';
import { legacyCoverNormalizeFrontmatterOptions, type NormalizedFrontmatter, type NormalizeFrontmatterOptions, type PageDataLike } from '@global-torque/content-toolkit/pageData';
export type VitePressPageData<TFrontmatter extends FrontmatterLike = FrontmatterLike> = Omit<ContentData, 'frontmatter'> & Omit<PageDataLike, 'frontmatter'> & {
    frontmatter: TFrontmatter;
};
export { legacyCoverNormalizeFrontmatterOptions, type NormalizeFrontmatterOptions, };
export declare function normalizeVitePressFrontmatter<TFrontmatter extends FrontmatterLike = FrontmatterLike>(page: ContentData, options?: NormalizeFrontmatterOptions): NormalizedFrontmatter<TFrontmatter>;
export declare function createVitePressFrontmatterRecord<TFrontmatter extends FrontmatterLike = FrontmatterLike>(page: ContentData, options?: NormalizeFrontmatterOptions): NormalizedFrontmatter<TFrontmatter>;
//# sourceMappingURL=content.d.ts.map