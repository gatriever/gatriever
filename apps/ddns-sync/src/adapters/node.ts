import { createDdnsSyncCoordinator, type DdnsSyncOptions } from "../core.js";

export async function startDdnsDaemon(
  options: DdnsSyncOptions & { pollIntervalMs?: number } = {}
) {
  const { syncOnce } = createDdnsSyncCoordinator(options);
  const pollIntervalMs =
    options.pollIntervalMs ||
    Number.parseInt(process.env.POLL_INTERVAL_MS || "60000", 10);

  let isRunning = true;

  async function runTick() {
    const now = new Date();
    console.log(`[DDNS Daemon] ⏱ Tick at ${now.toISOString()}`);

    try {
      const results = await syncOnce(now);
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

  console.log("🚀 Starting @gatriever/ddns-sync daemon (PM2/Docker)...");
  console.log(`- Interval: ${pollIntervalMs}ms`);

  await runTick();
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
}

if (process.env.NODE_ENV !== "test") {
  startDdnsDaemon().catch((err) => {
    console.error("❌ Failed to start ddns-sync daemon:", err);
    process.exit(1);
  });
}

export default startDdnsDaemon;
