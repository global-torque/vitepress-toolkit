# Changelog

## Unreleased

- Quarantined the unsupported pre-0.2 default-branch bridge, removed mutable
  install guidance, disabled publication, and pinned its build-only content
  dependency to an exact historical commit.

## 0.1.0

- Restored the VitePress adapter as a thin layer over `content-toolkit`.
- Added generic legacy-loader fixtures and host-provided URL policy coverage.
- Consolidated the former VitePress content adapter and VitePress config
  helpers into `@global-torque/vitepress-toolkit`.
