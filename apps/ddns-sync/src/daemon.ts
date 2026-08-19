import { DdnsSyncCoordinator } from "@gatriever/ddns";
import { FileStorageAdapter, MemoryStorageAdapter } from "@gatriever/storage";

const secretKey = process.env.ENCRYPTION_SECRET || "default-secret-key-32-chars-long!";
const storageType = process.env.STORAGE_ADAPTER || "file";
const storagePath = process.env.STORAGE_FILE_PATH || "./data/storage.json";
const pollIntervalMs = Number.parseInt(process.env.POLL_INTERVAL_MS || "60000", 10);

const storage =
  storageType === "memory"
    ? new MemoryStorageAdapter()
    : new FileStorageAdapter(storagePath);

const coordinator = new DdnsSyncCoordinator(storage, secretKey);

let isRunning = true;

async function runTick() {
  const now = new Date();
  console.log(`[DDNS Daemon] ⏱ Tick at ${now.toISOString()}`);

  try {
    const results = await coordinator.syncAllDueUsers(now);
    for (const res of results) {
      if (res.changedRouters.length > 0) {
        console.log(
          `[DDNS Daemon] 🌐 User ${res.userId}: ${res.changedRouters.length} router IP(s) changed, ${res.gaUpdates} GA4 site filters updated.`
        );
      }
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[DDNS Daemon] ❌ Error in tick: ${message}`);
  }
}

console.log("🚀 Starting gatriever DDNS Sync Daemon (PM2)...");
console.log(`- Storage: ${storageType}`);
console.log(`- Interval: ${pollIntervalMs}ms`);

// Initial run
runTick();

// Periodic tick loop
const intervalId = setInterval(runTick, pollIntervalMs);

function shutdown() {
  if (!isRunning) return;
  isRunning = false;
  console.log("\n🛑 Stopping DDNS Sync Daemon...");
  clearInterval(intervalId);
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
