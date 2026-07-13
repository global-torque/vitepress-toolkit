# OpenSSF baseline review

Review date: 2026-07-13

This prerelease source applies the OSPS baseline proportionately to a small
ESM-only TypeScript library.

Implemented controls:

- protected `main` with pull-request, CODEOWNERS, conversation-resolution,
  linear-history, no-force-push, and no-deletion rules;
- protected immutable `v*` tags;
- least-privilege, SHA-pinned GitHub Actions;
- Node 22 and 24 required CI with Node 26 informational CI;
- DCO sign-off, dependency review, Dependabot, CodeQL, Scorecard, secret
  scanning, push protection, and private vulnerability reporting;
- explicit package contents, API reports, coverage thresholds, source maps,
  clean-room verification, SHA-512 manifests, and a provenance-capable
  candidate workflow.

The source workspace temporarily overrides VitePress 1.6.4's internal Vite to
6.4.3. Exact Node 22/24 toolkit and minimal-site builds pass with that graph and
the complete development audit is clean. Because root overrides do not
propagate through published packages and Vite 6 is outside VitePress 1.6.4's
declared range, consumers must repeat the override and verify their own site
build before promotion.

The organization owner authorized authenticated publication of the first
reviewed npm prerelease from its retained artifact. The exact named-consumer
gate, trusted publishing, and registry provenance remain required before
automated or stable promotion.
