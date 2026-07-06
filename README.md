# @global-torque/vitepress-toolkit

VitePress helpers for Global Torque content sites.

This package combines the former VitePress content adapter and shared
VitePress config helpers into one public package.

Use it when a VitePress `createContentLoader` pipeline needs to normalize
`ContentData.frontmatter` with the shared `content-toolkit` rules:

```ts
import { createContentLoader } from 'vitepress';
import { normalizeVitePressFrontmatter } from '@global-torque/vitepress-toolkit/content';

export default createContentLoader('docs/**/*.md', {
  transform(raw) {
    return raw.map((page) => normalizeVitePressFrontmatter(page));
  },
});
```

For non-VitePress content pipelines, import `@global-torque/content-toolkit`
directly.

## Compatibility

- Depends on `content-toolkit` for all content behavior.
- Treats VitePress and Vue as peer dependencies.
- Does not import app routes, app aliases, Pinia stores, UI components, browser
  globals, env singletons, or product-specific config.
- Defaults to the generic legacy-cover normalization profile. Hosts can pass
  their own `NormalizeFrontmatterOptions` for URL policy, image srcset
  generation, legacy-field mapping, and slug behavior.

## Exports

- `@global-torque/vitepress-toolkit`
- `@global-torque/vitepress-toolkit/content`
- `@global-torque/vitepress-toolkit/drafts`
- `@global-torque/vitepress-toolkit/env`
- `@global-torque/vitepress-toolkit/head`
- `@global-torque/vitepress-toolkit/seo`
- `@global-torque/vitepress-toolkit/sitemap`
