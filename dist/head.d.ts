import type { HeadConfig } from 'vitepress';
export interface CreateFontPreloadTransformOptions {
    fontNames?: string[];
    fontPattern?: RegExp;
    firstOnly?: boolean;
}
export interface TransformHeadContext {
    assets: string[];
}
export declare function createFontPreloadTransform({ fontNames, fontPattern, firstOnly, }?: CreateFontPreloadTransformOptions): ({ assets }: TransformHeadContext) => HeadConfig[] | undefined;
//# sourceMappingURL=head.d.ts.map