export function createSitemapConfig({ env, urlFormat, transformItem, }) {
    return {
        hostname: env.FRONTEND_URL ?? '',
        lastmodDateOnly: false,
        transformItems: (items) => items.map((item) => {
            if (item.url != null) {
                item.url = urlFormat(item.url);
            }
            if (item.draft === true) {
                return {};
            }
            return transformItem?.(item) ?? item;
        }),
    };
}
//# sourceMappingURL=sitemap.js.map