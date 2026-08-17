# Changelog

All notable changes to the `gatriever` monorepo will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-08-17

### Added
- Monorepo architecture based on `pnpm workspaces`.
- `packages/ga-client`: Isolated Google Analytics 4 API client and metric aggregation.
- `packages/templates`: Standardized formatting modules with `./telegram` and `./json` sub-exports.
- `packages/database`: Storage adapters and AES-256 crypto engine.
- `apps/telegram-bot`: grammY-based bot client with inlined workspace dependencies for instant Serverless cold starts.
- `apps/api-server`: Core REST API server.
- `scripts/check-changelog.mjs`: CI release validator for version documentation.

[0.1.0]: https://github.com/gatriever/gatriever/releases/tag/v0.1.0
