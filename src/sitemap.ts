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

export function createSitemapConfig<TItem extends SitemapItem = SitemapItem>({
  env,
  urlFormat,
  transformItem,
}: CreateSitemapConfigOptions<TItem>) {
  return {
    hostname: env.FRONTEND_URL ?? '',
    lastmodDateOnly: false,
    transformItems: (items: TItem[]) => items.map((item) => {
      if (item.url != null) {
        item.url = urlFormat(item.url);
      }

      if (item.draft === true) {
        return {} as TItem;
      }

      return transformItem?.(item) ?? item;
    }),
  };
}
