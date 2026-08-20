import type { IStorageAdapter } from "@gatriever/storage";
import { FileStorageAdapter, MemoryStorageAdapter } from "@gatriever/storage";
import { createBot } from "./bot.js";

export interface TelegramBotOptions {
  token?: string;
  secretKey?: string;
  storageType?: string;
  storagePath?: string;
  storage?: IStorageAdapter;
}

export function createTelegramBot(options: TelegramBotOptions = {}) {
  const token = options.token || process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    throw new Error("TELEGRAM_BOT_TOKEN environment variable or option is required");
  }

  const secretKey =
    options.secretKey ||
    process.env.ENCRYPTION_SECRET ||
    "default-secret-key-32-chars-long!";
  const storageType = options.storageType || process.env.STORAGE_ADAPTER || "file";
  const storagePath = options.storagePath || process.env.STORAGE_FILE_PATH || "./data/storage.json";

  const storage =
    options.storage ||
    (storageType === "memory"
      ? new MemoryStorageAdapter()
      : new FileStorageAdapter(storagePath));

  return createBot(token, storage, secretKey);
}

export * from "./bot.js";
