// Load local .env natively if present (zero external dependencies)
if (typeof process.loadEnvFile === "function") {
  try {
    process.loadEnvFile();
  } catch {
    // .env is optional in production/CI
  }
}

import {
  FileStorageAdapter,
  MemoryStorageAdapter,
} from "@gatriever/storage";
import { createBot } from "./bot.js";

async function main() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const secretKey =
    process.env.ENCRYPTION_SECRET || "default_gatriever_super_secret_32_bytes";
  const storageType = process.env.STORAGE_ADAPTER || "file";
  const storagePath = process.env.FILE_STORAGE_PATH || "./data/users.json";

  if (!token) {
    console.error("❌ Error: TELEGRAM_BOT_TOKEN is not set in environment or .env!");
    console.log("ℹ️  Copy .env.example to .env and fill in TELEGRAM_BOT_TOKEN.");
    process.exit(1);
  }

  const storage =
    storageType === "memory"
      ? new MemoryStorageAdapter()
      : new FileStorageAdapter(storagePath);

  const bot = createBot(token, storage, secretKey);

  console.log("🚀 Starting @gatriever/telegram-bot...");
  bot.start({
    onStart(info) {
      console.log(`✅ Bot @${info.username} is up and running!`);
    },
  });
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
