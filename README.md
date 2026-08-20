# gatriever

> Fetching your Google Analytics 4 reports straight to Telegram and REST API, with automated multi-router DDNS internal traffic filtering. Zero-dependency, ultra-minimalist, and private.

---

## 🚀 How It Works (Zero-Code Deployment)

`gatriever` follows a **declarative, zero-code deployment paradigm**. You don't need to write any JavaScript or TypeScript in your project — just declare your targets and features in `package.json`.

```json
{
  "name": "my-analytics-bot",
  "scripts": {
    "prepare": "gatriever prepare",
    "deploy": "firebase deploy"
  },
  "dependencies": {
    "gatriever": "^0.1.0"
  },
  "gatriever": {
    "target": "firebase",
    "features": {
      "bot": true,
      "api": false,
      "ddns": {
        "enabled": true,
        "cron": "*/15 * * * *"
      }
    }
  }
}
```

When you run `npm run prepare` (or `gatriever prepare`), the CLI copies pre-compiled standalone cartridges (`*.firebase.js` or `*.node.js`) directly into the `deploy/` directory and generates the necessary entry points (`deploy/index.js` or `deploy/Dockerfile`).

---

## 🏗️ Monorepo Architecture

The project is structured as a modular monorepo powered by **pnpm workspaces**:

```text
gatriever/
├── apps/
│   ├── telegram-bot/       # Telegram bot (grammY multiplatform adapter)
│   ├── api-server/         # REST API server (node:http)
│   └── ddns-sync/          # Multi-router DDNS daemon (Cron/setInterval)
├── packages/
│   ├── cli/                # gatriever CLI assembler & webhook helper
│   ├── core/
│   │   ├── schemas/        # Schemas & types (@gatriever/schemas)
│   │   ├── ddns/           # DDNS sync engine (@gatriever/ddns)
│   │   ├── analytics/      # Zero-dependency GA4 Data & Admin API (@gatriever/analytics)
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

## ⚡ Key Highlights

* **Zero Vendor SDK Overhead:** GA4 authentication and reports use native `node:crypto` (JWT) and `fetch`, cutting bundle size from ~5.5 MB down to < 1 MB.
* **Unified App Standard (Cartridge Pattern):** Each app in `apps/*` compiles to standalone platform adapters (`*.firebase.js` and `*.node.js`).
* **Multi-Router Dynamic DNS:** Tracks multiple router hostnames and automatically keeps GA4 `INTERNAL_TRAFFIC` exclusion filters up-to-date.
* **AES-256-GCM Encryption:** Credentials and service account keys are encrypted before storage.
* **CLI Assembler (`gatriever`):** One-command assembly for Serverless (Firebase Functions) and Container (Docker/PM2) deployments.
* **Native Telegram Webhook Setup:** Instant `gatriever set-webhook --url <url>` without runtime overhead.

---

## 🛠️ CLI Reference

Install `gatriever` in your project or run via `npx`:

```bash
# Assemble deployment files into deploy/
npx gatriever prepare

# Register webhook with Telegram
npx gatriever set-webhook --token <YOUR_BOT_TOKEN> --url <WEBHOOK_URL> --secret <SECRET_TOKEN>
```

---

## 💻 Monorepo Development

### Prerequisites
* **Node.js:** `>= 24`
* **pnpm:** `>= 10`

### Commands
```bash
# Install workspace dependencies
pnpm install

# Run unit tests across all packages & CLI
pnpm run test

# Typecheck the entire monorepo
pnpm run typecheck

# Build all apps and packages into standalone cartridges
pnpm run build
```

---

## 📄 License

[MIT License](LICENSE) © Podhound Team
