# 🐕 gatriever

> Fetching your Google Analytics 4 reports straight to Telegram and REST API. Open-source, private, and lightning fast.

---

## 🏛️ Monorepo Architecture

The project is structured as a lightweight monorepo powered by **pnpm workspaces**:

```text
gatriever/
├── apps/
│   ├── telegram-bot/       # Telegram bot client powered by grammY
│   └── api-server/         # Core REST API backend server
├── packages/
│   ├── ga-client/          # Isolated GA4 Data API client & metrics aggregation
│   ├── templates/          # Formatting modules (@gatriever/templates/telegram, /json)
│   └── database/           # Storage adapters (Memory, File) & AES-256-GCM crypto
├── scripts/
│   ├── check-changelog.mjs # CI validator for release documentation
│   └── sync-version.mjs    # On-demand version synchronization for CI releases
├── CHANGELOG.md            # Single source of truth for release notes
└── pnpm-workspace.yaml     # Workspace configuration
```

---

## ✨ Key Features

* **⚡ Ultra-fast Cold Starts:** Bundled via `tsup` with inlined workspace dependencies (`noExternal`) for instant Serverless / Cloud Functions startup.
* **🔒 AES-256-GCM Encryption:** Credentials and service account keys are encrypted before storage.
* **📦 Modular Sub-exports:** Formats and clients are cleanly separated (`@gatriever/templates/telegram`, `@gatriever/templates/json`).
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

### Build & Typecheck
```bash
# Build all apps and packages
pnpm run build

# Typecheck the entire monorepo
pnpm run typecheck
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
