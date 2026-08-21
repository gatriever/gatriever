# gatriever

> Fetching your Google Analytics 4 reports straight to Telegram and REST API, with automated multi-router DDNS internal traffic filtering. Zero-dependency, ultra-minimalist, and private.

---

## 🚀 How It Works (Zero-Code Deployment)

`gatriever` follows a **declarative, zero-code GitOps deployment paradigm**. You don't need to write any JavaScript or TypeScript in your project — just scaffold with `npm create gatriever` or declare your targets and features in `package.json`:

```json
{
  "name": "my-analytics-bot",
  "scripts": {
    "prepare": "gatriever prepare",
    "deploy": "firebase deploy --only functions"
  },
  "dependencies": {
    "gatriever": "^0.1.0"
  },
  "gatriever": {
    "target": "firebase",
    "storage": "stateless",
    "features": {
      "bot": true,
      "api": false,
      "ddns": {
        "enabled": true,
        "cron": "*/15 * * * *"
      }
    },
    "sites": [
      {
        "name": "My Site",
        "propertyId": "123456789"
      }
    ],
    "routers": [
      {
        "id": "home-router",
        "name": "Home",
        "hostname": "home.example.com"
      }
    ]
  }
}
```

When you run `npm run prepare` (or `gatriever prepare`), the CLI copies pre-compiled standalone runtime bundles (`dist/firebase.js` or `dist/node.js`) directly into the `deploy/` directory and generates the necessary deployment configurations (`deploy/index.js` or `deploy/Dockerfile`).

---

## 🏗️ Monorepo Architecture

The project is structured as a nested modular monorepo powered by **pnpm workspaces**:

```text
gatriever/
├── packages/
│   ├── gatriever/                   # Main runtime wrapper, Telegram bot, DDNS coordinator & CLI
│   ├── create-gatriever/            # Interactive wizard for `npm create gatriever`
│   │
│   └── core/                        # Standalone, publishable primitives (@gatriever/*)
│       ├── analytics/               # Zero-dependency GA4 Data & Admin REST API (@gatriever/analytics)
│       ├── http/                    # Zero-dependency native MicroRouter (@gatriever/http)
│       ├── crypto/                  # AES-256-GCM encryption helpers (@gatriever/crypto)
│       ├── schemas/                 # Valibot schemas & DTOs (@gatriever/schemas)
│       ├── storage/                 # Storage adapters: File & Memory (@gatriever/storage)
│       └── templates/               # Telegram Markdown & JSON formatters (@gatriever/templates)
├── .github/
│   └── scripts/                     # CI release automation
├── CHANGELOG.md                     # Release notes
├── pnpm-workspace.yaml              # Workspace configuration
└── tsconfig.base.json               # Root TypeScript configuration
```

---

## ⚡ Key Highlights

* **Zero Vendor SDK Overhead:** GA4 authentication and reports use native `node:crypto` (RSA-SHA256 JWT) and `fetch`, cutting bundle size from ~5.5 MB down to < 1 MB.
* **Pure Stateless GitOps:** Zero database required for MVP — configuration is stored declaratively in `package.json` with secure environment variable macro substitution for secrets.
* **Multi-Router Dynamic DNS:** Tracks multiple router hostnames and automatically keeps GA4 `INTERNAL_TRAFFIC` exclusion filters up-to-date.
* **AES-256-GCM Encryption:** Credentials and service account keys are encrypted before storage.
* **CLI Assembler (`gatriever`):** One-command assembly for Serverless (Firebase Functions) and Container (Docker/PM2) deployments.
* **Interactive Scaffolder:** One-command project starter via `npm create gatriever`.
* **Native Telegram Webhook Setup:** Instant `gatriever set-webhook --url <url>` without runtime overhead.

---

## 🛠️ CLI Quickstart

### Create a new project
```bash
npm create gatriever
```

### Prepare deployment bundle
```bash
npx gatriever prepare
```

### Register Telegram Webhook
```bash
npx gatriever set-webhook --token <YOUR_BOT_TOKEN> --url <WEBHOOK_URL>
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

# Run unit & E2E tests across all packages
pnpm run test

# Typecheck the entire monorepo
pnpm run typecheck

# Build all packages and platform runtime bundles
pnpm run build
```

---

## 📄 License

[MIT License](LICENSE) © Podhound Team
