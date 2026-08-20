import { DdnsSyncCoordinator } from "@gatriever/ddns";
import { FileStorageAdapter, MemoryStorageAdapter, type StorageAdapter } from "@gatriever/storage";

export interface DdnsSyncOptions {
  secretKey?: string;
  storageType?: string;
  storagePath?: string;
  storage?: StorageAdapter;
}

export function createDdnsSyncCoordinator(options: DdnsSyncOptions = {}) {
  const secretKey = options.secretKey || process.env.ENCRYPTION_SECRET || "default-secret-key-32-chars-long!";
  const storageType = options.storageType || process.env.STORAGE_ADAPTER || "file";
  const storagePath = options.storagePath || process.env.STORAGE_FILE_PATH || "./data/storage.json";

  const storage =
    options.storage ||
    (storageType === "memory"
      ? new MemoryStorageAdapter()
      : new FileStorageAdapter(storagePath));

  const coordinator = new DdnsSyncCoordinator(storage, secretKey);

  return {
    coordinator,
    syncOnce: (now = new Date()) => coordinator.syncAllDueUsers(now),
  };
}
