import http from "node:http";
import { createTelegramBot } from "../bot/index.js";
import { DdnsSyncCoordinator } from "../ddns/index.js";
import { MicroRouter } from "@gatriever/http";
import { FileStorageAdapter, MemoryStorageAdapter } from "@gatriever/storage";
import { GatrieverConfigSchema, type GatrieverConfig, v } from "@gatriever/schemas";
import fs from "node:fs";
import path from "node:path";

function loadConfig(): GatrieverConfig {
  try {
    const pkgPath = path.resolve(process.cwd(), "package.json");
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
      return v.parse(GatrieverConfigSchema, pkg.gatriever || {});
    }
  } catch {
    // Fallback to default config
  }
  return v.parse(GatrieverConfigSchema, {});
}

export async function main() {
  const config = loadConfig();
  const secretKey = process.env.ENCRYPTION_SECRET || "default-secret-key-32-chars-long!";
  const storage =
    config.storage === "memory"
      ? new MemoryStorageAdapter()
      : new FileStorageAdapter(process.env.STORAGE_FILE_PATH || "./data/storage.json");

  console.log(`🐾 Starting Gatriever Daemon (Node/Docker)...`);
  console.log(`- Storage: ${config.storage || 'stateless'}`);

  // 1. Telegram Bot (Long Polling)
  if (config.features?.bot && process.env.TELEGRAM_BOT_TOKEN) {
    const bot = createTelegramBot({ storage, secretKey });
    console.log(`- Telegram Bot: Long Polling enabled`);
    bot.start().catch((err) => console.error("❌ Bot start error:", err));
  }

  // 2. REST API Server
  if (config.features?.api) {
    const port = Number.parseInt(process.env.PORT || "3000", 10);
    const router = new MicroRouter();
    router.get("/health", (_req, res) => res.json({ status: "healthy", timestamp: new Date().toISOString() }));
    http.createServer((req, res) => router.handle(req, res)).listen(port, () => {
      console.log(`- REST API: listening on port ${port}`);
    });
  }

  // 3. DDNS Scheduler Loop
  if (config.features?.ddns?.enabled) {
    const coordinator = new DdnsSyncCoordinator(storage, secretKey);
    const intervalMs = 15 * 60 * 1000; // 15 min
    console.log(`- DDNS Scheduler: active`);

    const runSync = async () => {
      try {
        await coordinator.syncAllDueUsers(new Date());
      } catch (err: unknown) {
        console.error("❌ DDNS sync error:", err);
      }
    };

    runSync();
    setInterval(runSync, intervalMs);
  }
}

if (process.env.NODE_ENV !== "test") {
  main().catch((err) => {
    console.error("Fatal Gatriever error:", err);
    process.exit(1);
  });
}
