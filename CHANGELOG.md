# Changelog

All notable changes to the `gatriever` monorepo will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-08-20

### Added
- **Initial Build**: Modular monorepo core and multi-platform standalone application adapters.
- **Zero-Dependency GA4 Client**: Native JWT authentication using `node:crypto` and `fetch` (sub-1MB lightweight bundle).
- **Unified App Architecture**: Standardized `src/core.ts` and `src/adapters/` (Firebase Functions & Node.js/Docker) across `telegram-bot`, `api-server`, and `ddns-sync`.
- **Dynamic DNS & Internal Traffic Filtering**: Multi-router IP tracking and automated GA4 filter updates.
- **AES-256-GCM Encryption**: Secure local credential storage for Google Service Accounts.

[0.1.0]: https://github.com/gatriever/gatriever/releases/tag/v0.1.0
