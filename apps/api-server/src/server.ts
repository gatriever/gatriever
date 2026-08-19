import { createServer } from "node:http";
import { MicroRouter } from "@gatriever/http";
import { FileStorageAdapter, MemoryStorageAdapter } from "@gatriever/storage";
import { GA4DataClient } from "@gatriever/analytics";
import { DdnsSyncCoordinator } from "@gatriever/ddns";
import { formatJsonReport } from "@gatriever/templates";

export interface ApiServerOptions {
  port?: number;
  credentialsJson?: Record<string, unknown> | string;
  storageType?: string;
  storagePath?: string;
  secretKey?: string;
}

export function createApiServer(options: ApiServerOptions = {}) {
  const port = options.port || Number.parseInt(process.env.PORT || "3000", 10);
  const defaultCredentials = options.credentialsJson || process.env.GA_CREDENTIALS_JSON;
  const storageType = options.storageType || process.env.STORAGE_ADAPTER || "file";
  const storagePath = options.storagePath || process.env.STORAGE_FILE_PATH || "./data/storage.json";
  const secretKey = options.secretKey || process.env.ENCRYPTION_SECRET || "default_gatriever_super_secret_32_bytes";

  const storage =
    storageType === "memory"
      ? new MemoryStorageAdapter()
      : new FileStorageAdapter(storagePath);

  const ddnsCoordinator = new DdnsSyncCoordinator(storage, secretKey);
  const router = new MicroRouter();

  // Route: GET /health
  router.get("/health", (_req, res) => {
    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
    });
  });

  // Route: GET /api/v1/report
  router.get("/api/v1/report", async (req, res) => {
    const propertyId = req.query?.get("propertyId") || process.env.GA_PROPERTY_ID;
    const propertyName = req.query?.get("name") || "Default Property";
    const days = Number.parseInt(req.query?.get("days") || "7", 10);
    const limit = Number.parseInt(req.query?.get("limit") || "5", 10);

    if (!propertyId) {
      res.json({ error: "Missing required query parameter: propertyId" }, 400);
      return;
    }

    if (!defaultCredentials) {
      res.json({ error: "Server credentials not configured." }, 500);
      return;
    }

    try {
      const client = new GA4DataClient(defaultCredentials, propertyId);
      const report = await client.getFullReport(propertyName, propertyId, days, limit);
      res.json(JSON.parse(formatJsonReport(report)));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.json({ error: msg }, 500);
    }
  });

  // Route: POST /api/v1/jobs/ddns-sync
  router.post("/api/v1/jobs/ddns-sync", async (_req, res) => {
    try {
      const results = await ddnsCoordinator.syncAllDueUsers(new Date());
      res.json({
        success: true,
        processedUsers: results.length,
        results,
        timestamp: new Date().toISOString(),
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.json({ error: msg }, 500);
    }
  });

  const server = createServer((req, res) => router.handle(req, res));

  return {
    server,
    router,
    listen: () =>
      new Promise<void>((resolve) => {
        server.listen(port, () => {
          console.log(`🚀 @gatriever/api-server listening on port ${port}`);
        });
        resolve();
      }),
  };
}
