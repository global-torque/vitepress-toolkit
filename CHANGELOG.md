# Changelog

## 0.2.0-beta.6 - 2026-07-13

- Prepared the independently reviewed 0.2 source for protected public `main` with
  SHA-pinned CI, public API governance, clean-source artifact manifests, and
  provenance workflow.
- Switched development and release verification to the exact published
  `@global-torque/content-toolkit@0.2.0-beta.8` registry version.
- Superseded the dirty-tree beta.5 implementation artifact.

## 0.2.0-beta.5 - Superseded local candidate

- Replaced public declaration imports from the full `vitepress` package with
  package-owned structural content, SEO page-data, and font-head contracts.
  This keeps strict NodeNext clean-room type probes isolated from VitePress's
  transitive Vite/Rollup declaration graph while remaining structurally
  compatible with VitePress 1.x hooks.
- Replaced destructured exported parameters in the head, sitemap, and build
  metadata APIs with named option inputs so generated parameter tables contain
  no phantom `(not declared)` rows.
- Supersedes immutable beta.4, whose runtime bytes passed artifact review but
  whose public declarations failed the required Node 22 strict clean room.

## 0.2.0-beta.4 - Superseded local candidate

- Preserved the configured base path in alternate, image, video, AMP, and
  Android sitemap URLs.
- Returned detached mutable transport items because `sitemap@8` normalizes
  `img`, `video`, and `lastmodfile` fields in place; the outer item array remains
  frozen and caller inputs remain untouched.
- Preserved detached `URL` and `Buffer`/typed-array `lastmodfile` values,
  normalized image-license URLs, and added real `SitemapStream` coverage.
- Applied host text stripping before choosing SEO title/description fallbacks so
  markup-only values cannot suppress valid summary or site defaults.
- Required sitemap item URLs and made the builder directly assignable to the
  VitePress sitemap contract.
- Made relative audio/video metadata base-aware, deduplicated every managed
  `name`/`property` combination, and deeply detached callback/output page data.
- Narrowed JSON-LD callbacks to the recursive JSON value contract and removed
  the ineffective `jsonLdMode` option.

## 0.2.0-beta.3 - Superseded local candidate

- Kept the VitePress sitemap config extensible for `SitemapStream` and added
  initial stream integration coverage.
- Replaced all existing JSON-LD safely, fixed empty-string SEO fallback, and
  passed normalized final page data plus the canonical URL to host generators.
- Required explicit build clocks/Git resolvers, rejected empty font names, made
  draft ordering locale-independent, and embedded sources in JavaScript maps.
- Never publish this candidate. Nested alternate URLs lost the site base path,
  and freezing transport items broke standard `img`, `video`, and
  `lastmodfile` normalization. Its local tarball SHA-512 was
  `0d39cfaec053f98d1c5a693d4ffc187191c0b910f3eaeccb989f2309ecf79d7dbd0d7d70fcfd0d4ba56c3cc7787f2a6a2059a503f02a1358756c4b74444a8c01`.

## 0.2.0-beta.2 - Superseded local candidate

- Froze publication after the 0.2 audit invalidated the earlier readiness
  assessment; pure and Node-only APIs are being separated and hardened.
- Moved draft and build metadata helpers to explicit Node-only exports and
  removed environment mutation from the public package.
- Added strict detached content adaptation, contained sorted draft discovery,
  explicit/stateless font matching, pure idempotent safe SEO output, and
  immutable draft-filtering sitemap transforms.
- Never publish this candidate. Real VitePress builds failed because the frozen
  sitemap config could not be extended by `SitemapStream`; JSON-LD and SEO
  fallbacks were also incorrect. Its local tarball SHA-512 was
  `b8e5e826b472bda962cca93a5ece99edd934263a8ba646a0487ad5d67f6850a467a6ea9daff771947f3aa52885a843de3f90e55107f16e6004739df02184ac20`.

## 0.2.0-beta.1 - Superseded

- Superseded after a named-consumer docs probe found that unrelated asset
  symlinks were rejected as fatal instead of being safely skipped.

## 0.2.0-beta.0 - Superseded

- Superseded after the first exact-artifact consumer typecheck exposed mutable
  VitePress return-contract mismatches; it must not be promoted or reused.

## 0.1.0

- Restored the VitePress adapter as a thin layer over `content-toolkit`.
- Added generic legacy-loader fixtures and host-provided URL policy coverage.
- Consolidated the former VitePress content adapter and VitePress config
  helpers into `@global-torque/vitepress-toolkit`.
