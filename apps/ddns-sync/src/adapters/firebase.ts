import { createDdnsSyncCoordinator, type DdnsSyncOptions } from "../core.js";

export async function onScheduleTrigger(options: DdnsSyncOptions = {}) {
  const { syncOnce } = createDdnsSyncCoordinator(options);
  const now = new Date();

  console.log(`[Firebase onSchedule] ⏱ Executing DDNS Sync at ${now.toISOString()}`);
  const results = await syncOnce(now);

  return {
    success: true,
    processedUsers: results.length,
    timestamp: now.toISOString(),
  };
}

export default onScheduleTrigger;
