export interface SitemapItem {
    url?: string;
    draft?: boolean;
}
export interface CreateSitemapConfigOptions<TItem extends SitemapItem = SitemapItem> {
    env: {
        FRONTEND_URL?: string;
    };
    urlFormat: (url: string) => string;
    transformItem?: (item: TItem) => TItem;
}
export declare function createSitemapConfig<TItem extends SitemapItem = SitemapItem>({ env, urlFormat, transformItem, }: CreateSitemapConfigOptions<TItem>): {
    hostname: string;
    lastmodDateOnly: boolean;
    transformItems: (items: TItem[]) => TItem[];
};
//# sourceMappingURL=sitemap.d.ts.map