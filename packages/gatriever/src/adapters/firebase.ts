// @ts-ignore - Provided by Firebase Functions runtime environment
import { onRequest } from "firebase-functions/v2/https";
// @ts-ignore - Provided by Firebase Functions runtime environment
import { onSchedule } from "firebase-functions/v2/scheduler";
import { webhookCallback } from "grammy";
import { createTelegramBot } from "@gatriever/bot";
import { DdnsSyncCoordinator } from "@gatriever/ddns";
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

const config = loadConfig();
const secretKey = process.env.ENCRYPTION_SECRET || "default-secret-key-32-chars-long!";
const storage =
  config.storage === "memory"
    ? new MemoryStorageAdapter()
    : new FileStorageAdapter(process.env.STORAGE_FILE_PATH || "./data/storage.json");

// 1. Telegram Bot Webhook
export const telegramHook = config.features?.bot
  ? onRequest(webhookCallback(createTelegramBot({ storage, secretKey }), "express"))
  : undefined;

// 2. REST API Server
export const api = config.features?.api
  ? onRequest((req: any, res: any) => {
      const router = new MicroRouter();
      router.get("/health", (_req, res) => res.json({ status: "healthy", timestamp: new Date().toISOString() }));
      return router.handle(req, res);
    })
  : undefined;

// 3. DDNS Scheduler
export const ddnsSync = config.features?.ddns?.enabled
  ? onSchedule(config.features.ddns.cron || "*/15 * * * *", async () => {
      const coordinator = new DdnsSyncCoordinator(storage, secretKey);
      await coordinator.syncAllDueUsers(new Date());
    })
  : undefined;
