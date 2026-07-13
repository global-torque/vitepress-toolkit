# @global-torque/vitepress-toolkit

> **Public 0.2 prerelease:** install the exact beta version. The public API may
> still change before the stable 0.2 release.

Pure VitePress content, font-head, SEO, and sitemap builders, with filesystem
and Git helpers isolated behind explicit Node-only subpaths.

## Installation and compatibility

Install the exact reviewed npm prerelease and its content peer:

```sh
pnpm add @global-torque/vitepress-toolkit@0.2.0-beta.6 @global-torque/content-toolkit@0.2.0-beta.8 vitepress@1.6.4 vue@^3.5
```

| Contract         | Supported                            |
| ---------------- | ------------------------------------ |
| Runtime          | ESM-only, ES2022                     |
| Node.js          | 22.x and 24.x; 26.x informational    |
| VitePress        | `1.6.4` with the Vite override below |
| Vue              | `^3.5.0`                             |
| Content toolkit  | `>=0.2.0-0 <0.3.0`                   |
| Package managers | npm and pnpm clean-room installs     |

VitePress 1.6.4 declares Vite 5, whose latest compatible release has open
high/moderate development-server advisories. Until VitePress publishes a
supported patched dependency path, consuming roots must pin its internal Vite
to the independently tested 6.4.3 mitigation:

```yaml
# pnpm-workspace.yaml
overrides:
  'vitepress@1.6.4>vite': 6.4.3
```

```json
{
  "overrides": {
    "vitepress@1.6.4": {
      "vite": "6.4.3"
    }
  }
}
```

The toolkit and a minimal VitePress production site pass on Node 22 and 24 with
that exact graph. Vite 6 remains outside VitePress 1.6.4's declared dependency
range, so hosts must run their own site build before promotion. Root overrides
do not propagate through npm packages; installing this toolkit does not apply
the mitigation for a consumer.

## Runtime boundaries

The root and these subpaths do not load Node built-ins:

- `@global-torque/vitepress-toolkit/content`
- `@global-torque/vitepress-toolkit/head`
- `@global-torque/vitepress-toolkit/seo`
- `@global-torque/vitepress-toolkit/sitemap`

Build-only code is never re-exported from the root:

- `@global-torque/vitepress-toolkit/node/drafts`
- `@global-torque/vitepress-toolkit/node/build-metadata`

## Strict content adapter

```ts
import { normalizeVitePressFrontmatter } from '@global-torque/vitepress-toolkit/content';

const record = normalizeVitePressFrontmatter(page, {
  formatPath: (path) => path,
});
```

The adapter returns a detached record, does not mutate VitePress input, and
rejects nested legacy cover fields. Hosts preprocess legacy data and own slug,
image, summary, transliteration, and folder policy.

## Pure SEO builder

```ts
import { createSeoPageDataBuilder } from '@global-torque/vitepress-toolkit/seo';

const buildPageData = createSeoPageDataBuilder({
  siteUrl: 'https://example.test/docs/',
  siteName: 'Example Docs',
  generateJsonLd: (page, { canonicalUrl }) => ({
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    url: canonicalUrl.toString(),
    name: page.title,
  }),
});

// VitePress owns hook mutation; keep it in the host adapter.
export function transformPageData(page) {
  const built = buildPageData(page);
  Object.assign(page, built, { frontmatter: built.frontmatter });
}
```

The builder uses `URL`, respects a site base path, emits Open Graph metadata
with `property`, removes/replaces managed entries, is idempotent, and serializes
JSON-LD objects with `<` escaped. Raw script strings are not accepted.
Its public declarations use package-owned structural page/head contracts, so a
strict consumer does not load VitePress's transitive Vite/Rollup declaration
graph merely by importing the browser-safe builders.

## Draft discovery

```ts
import { findDraftFiles } from '@global-torque/vitepress-toolkit/node/drafts';

const srcExclude = findDraftFiles('./docs');
```

Results are sorted POSIX paths relative to the declared root. Unreadable or
malformed files throw by default. Symlink entries are ignored and a symlinked
root is rejected by default; explicit opt-in still enforces realpath
containment. `onError: 'skip'` is available only when a host deliberately
chooses best-effort discovery.

## Explicit build metadata

```ts
import {
  createBuildMetadata,
  resolveGitHash,
} from '@global-torque/vitepress-toolkit/node/build-metadata';

const metadata = createBuildMetadata({
  cwd: process.cwd(),
  clock: () => new Date(),
  resolveGitHash: (cwd) => resolveGitHash({ cwd }),
});
```

The metadata builder requires its cwd, clock, and Git resolver and never reads
or writes application environment contracts. Calling `resolveGitHash` without
an injected `runGit` adapter explicitly opts into a `git rev-parse` subprocess.

## Font and sitemap builders

```ts
import { createFontPreloadTransform } from '@global-torque/vitepress-toolkit/head';

export const transformHead = createFontPreloadTransform({
  fontNames: ['Inter'],
});
```

`createFontPreloadTransform` requires a matcher or escaped font-name list and
neutralizes stateful regex flags. `createSitemapConfig` accepts `siteUrl`,
filters drafts, preserves base paths across supported nested URL fields, and
returns a frozen array of detached mutable transport items. Caller inputs stay
untouched; the items and outer config remain extensible where `SitemapStream`
performs its documented in-place normalization.

This packed example is executed in clean npm and pnpm consumers:

```js clean-room
import assert from 'node:assert/strict';
import { createSitemapConfig } from '@global-torque/vitepress-toolkit/sitemap';

const config = createSitemapConfig({
  siteUrl: 'https://example.test/docs/',
});
const items = config.transformItems([
  { url: '/guide' },
  { url: '/draft', draft: true },
]);

assert.equal(config.hostname, 'https://example.test/docs/');
assert.deepEqual(items, [{ url: 'https://example.test/docs/guide' }]);
```

Generated API references cover the [root/browser-safe surface](docs/api/vitepress-toolkit.md),
[draft discovery](docs/api-node-drafts/vitepress-toolkit.md), and
[build metadata](docs/api-node-build-metadata/vitepress-toolkit.md). Matching
committed API reports live under `etc/`.

## Breaking migration from 0.1

- Replace `/drafts` with `/node/drafts`.
- Remove `/env`; load app environment in the host and pass explicit metadata.
- Replace mutating `createTransformPageData` with `createSeoPageDataBuilder`
  plus a private VitePress hook adapter.
- Pass `siteUrl` and `formatUrl` directly to `createSitemapConfig`.
- Supply an explicit font matcher or font-name list.
- Consume `content-toolkit >=0.2.0-0 <0.3.0` and preprocess legacy fields in
  the host.

## Non-goals and ownership

The package does not own app environment loading, product URL/folder policy,
legacy cover migration, host route tables, raw JSON-LD scripts, deployment, or
VitePress hook mutation. Hosts own those adapters. This repository owns only
the product-neutral builders and explicit Node helpers documented above.

## Rollback

Pin the last known-good tarball SHA-512 (or exact npm version), reinstall it in
every named consumer, and rerun the same clean-room and consumer matrix. Never
retag or replace a failed artifact. Deprecate a bad registry version, publish a
new version from a reviewed tarball, and record the regression in the changelog
and release issue.

## Verification and support

Run `pnpm run format:check`, `pnpm run lint`, `pnpm run typecheck`,
`pnpm run test:coverage`, `pnpm run build`, `pnpm run api:check`, and
`pnpm run package:lint` in this package. Security reports use GitHub private
vulnerability reporting. Public compatibility begins only after an approved
immutable release.

Feature proposals and reproducible bugs go to
<https://github.com/global-torque/vitepress-toolkit/issues>. Changes require
an issue describing the use case, a focused pull request with tests, generated
API/report updates, DCO sign-off, and named-consumer evidence. Maintainers
support the compatibility matrix above, while application integrations remain
owned by their host repositories. Release history and breaking changes are
recorded in `CHANGELOG.md`.
