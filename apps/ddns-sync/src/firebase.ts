import { DdnsSyncCoordinator } from "@gatriever/ddns";
import { FileStorageAdapter, MemoryStorageAdapter } from "@gatriever/storage";

export async function onScheduleTrigger(event?: unknown) {
  const secretKey = process.env.ENCRYPTION_SECRET || "default-secret-key-32-chars-long!";
  const storageType = process.env.STORAGE_ADAPTER || "file";
  const storagePath = process.env.STORAGE_FILE_PATH || "./data/storage.json";

  const storage =
    storageType === "memory"
      ? new MemoryStorageAdapter()
      : new FileStorageAdapter(storagePath);

  const coordinator = new DdnsSyncCoordinator(storage, secretKey);
  const now = new Date();

  console.log(`[Firebase onSchedule] ⏱ Executing DDNS Sync at ${now.toISOString()}`);
  const results = await coordinator.syncAllDueUsers(now);

  return {
    success: true,
    processedUsers: results.length,
    timestamp: now.toISOString(),
  };
}

export default onScheduleTrigger;
