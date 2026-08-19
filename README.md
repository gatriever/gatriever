# 🐕 gatriever

> Fetching your Google Analytics 4 reports straight to Telegram and REST API, with automated multi-router DDNS internal traffic filtering. Open-source, private, and lightning fast.

---

## 🏛️ Monorepo Architecture

The project is structured as a modular monorepo powered by **pnpm workspaces**:

```text
gatriever/
├── apps/
│   ├── telegram-bot/       # Telegram bot (grammY)
│   ├── api-server/         # REST API server (node:http)
│   └── ddns-sync/          # Multi-router DDNS daemon (PM2/Firebase)
├── packages/
│   ├── core/
│   │   ├── schemas/        # Schemas & types (@gatriever/schemas)
│   │   ├── ddns/           # DDNS sync engine (@gatriever/ddns)
│   │   ├── analytics/      # GA4 Data & Admin API (@gatriever/analytics)
│   │   └── templates/      # Report formatters (@gatriever/templates)
│   └── infrastructure/
│       ├── storage/        # Storage adapters (@gatriever/storage)
│       ├── crypto/         # AES-256-GCM crypto (@gatriever/crypto)
│       └── http/           # Native MicroRouter (@gatriever/http)
├── .github/
│   └── scripts/            # CI release automation
├── CHANGELOG.md            # Release notes
└── pnpm-workspace.yaml     # Workspace configuration
```

---

## ✨ Key Features

* **⚡ Ultra-fast Cold Starts & Zero `node_modules` in Prod:** Bundled via `tsup`/`esbuild` with inlined workspace dependencies (`noExternal`) for instant Serverless / Cloud Functions startup and minimal PM2 Docker containers.
* **🔒 AES-256-GCM Encryption:** Credentials and service account keys are encrypted before storage.
* **🛰 Multi-Router DDNS Sync:** Automatically tracks dynamic public IPs across multiple routers and updates GA4 `INTERNAL_TRAFFIC` rules to keep internal traffic out of analytics.
* **📐 Type-Safe Valibot Schemas:** Lightweight schema validation across all DTOs and configs with `@gatriever/schemas`.
* **📦 Single-Responsibility Packages:** Each module is independently testable and publishable to npm.
* **🎯 Single Source of Truth:** Centralized versioning declared in root `package.json` and verified against `CHANGELOG.md`.

---

## 🚀 Quick Start

### Prerequisites
* **Node.js:** `>= 24`
* **pnpm:** `>= 10`

### Installation
```bash
# Install workspace dependencies
pnpm install
```

### Build & Typecheck & Test
```bash
# Run unit tests across all packages
pnpm run test

# Typecheck the entire monorepo
pnpm run typecheck

# Build all apps and packages into standalone bundles
pnpm run build
```

### Development
```bash
# Run Telegram bot in watch mode
pnpm run dev:bot

# Run REST API server in watch mode
pnpm run dev:api
```

---

## 📄 Configuration

Copy `.env.example` to `.env` and fill in your variables:

```bash
cp .env.example .env
```

| Variable | Description |
| :--- | :--- |
| `TELEGRAM_BOT_TOKEN` | Your Telegram Bot API token from [@BotFather](https://t.me/botfather) |
| `ENCRYPTION_SECRET` | 32-byte secret key for AES-256-GCM encryption |
| `STORAGE_ADAPTER` | Storage type (`file` or `memory`) |
| `PORT` | API server port (default: `3000`) |

---

## 📜 License

[MIT License](LICENSE) © Podhound Team
