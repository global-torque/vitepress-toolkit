# RFC 0001: Public 0.2 contract

- Status: Proposed
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
evidence.

The candidate is built and packed once from a clean protected source commit.
The npm-format tarball, SHA-512 digest, per-file manifest, source commit, and
GitHub attestation remain immutable. A failed candidate receives a new beta
version; no tag or asset is replaced.

## Decision

Accept this contract only after the source pull request, API report, package
tests, clean rooms, and named-consumer evidence have no unresolved actionable
findings.
