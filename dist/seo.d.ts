import type { PageData } from 'vitepress';
type HeadAttrs = Record<string, string | number | boolean>;
type HeadEntry = [string, HeadAttrs?, string?];
export interface SeoEnv {
    FRONTEND_URL?: string;
    author?: string;
    description?: string;
    keywords?: string[] | string;
    locale?: string;
    robotIndex?: string | number | boolean;
    title?: string;
}
export interface CreateTransformPageDataOptions {
    env: SeoEnv;
    normalizeFrontmatter: (pageData: PageData) => void;
    stripHtmlAndMarkdown: (value: string) => string;
    generateJsonLd?: (pageData: PageData, env: SeoEnv) => string | null | undefined;
    beforeNormalize?: (pageData: PageData) => void;
    resolveDescription?: (pageData: PageData, env: SeoEnv) => string;
    defaultImage?: string;
    includeMetaTitle?: boolean;
    includeTwitterDescription?: boolean;
    includeSiteName?: boolean;
    jsonLdMode?: 'always' | 'when-present';
    ogAttribute?: 'name' | 'property';
    sanitizeHead?: boolean;
}
export declare const sanitizeHeadEntries: (head: unknown[]) => HeadEntry[];
export declare function createTransformPageData({ env, normalizeFrontmatter, stripHtmlAndMarkdown, generateJsonLd, beforeNormalize, resolveDescription, defaultImage, includeMetaTitle, includeTwitterDescription, includeSiteName, jsonLdMode, ogAttribute, sanitizeHead, }: CreateTransformPageDataOptions): (pageData: PageData) => void;
export {};
//# sourceMappingURL=seo.d.ts.map