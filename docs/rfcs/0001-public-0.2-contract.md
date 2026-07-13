# RFC 0001: Public 0.2 contract

- Status: Accepted
- Target: `0.2.0-beta.6`
- Last updated: 2026-07-13

## External problem

VitePress sites need pure content adaptation, head/SEO/sitemap transforms, and explicitly isolated build-only draft and Git metadata helpers.

## Public surface

The supported imports are `.`, `./content`, `./head`, `./seo`, `./sitemap`, `./node/drafts`, and `./node/build-metadata`. Exports are ESM-only ES2022 with
declarations and Node.js 22 or newer. Undeclared deep imports are private.

## Non-goals

Vue components, routes, app config, environment mutation, implicit clocks/Git access, and product SEO defaults remain outside this package.

## Compatibility and release evidence

Two maintained VitePress sites and Advayta must build from this exact candidate
plus content-toolkit 0.2, with draft, canonical, social-head, and sitemap
evidence before automated or stable promotion and before private fallback
source is deleted. The organization owner separately authorized manual
publication of the initial `0.2.0-beta.6` prerelease before those named-consumer
gates.

The initial beta is built and packed once from a clean protected source commit.
Its npm-format tarball, SHA-512 digest, per-file manifest, and source commit
remain immutable. The later automated candidate path additionally requires a
GitHub attestation and registry provenance. A failed candidate receives a new
beta version; no tag or asset is replaced.

## Decision

Accept the initial beta contract after the source pull request, API report,
package tests, clean rooms, and independent review have no unresolved
actionable findings. Named-consumer evidence remains mandatory before
automated or stable promotion and before private fallback source is deleted.
