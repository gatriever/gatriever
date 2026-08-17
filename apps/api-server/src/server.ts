import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { GA4Client } from "@gatriever/ga-client";
import { formatJsonReport, formatJsonError } from "@gatriever/templates/json";

export interface ApiServerOptions {
  port?: number;
  credentialsJson?: Record<string, unknown> | string;
}

export function createApiServer(options: ApiServerOptions = {}) {
  const port = options.port || Number.parseInt(process.env.PORT || "3000", 10);
  const defaultCredentials = options.credentialsJson || process.env.GA_CREDENTIALS_JSON;

  const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

    // Set JSON response header
    res.setHeader("Content-Type", "application/json; charset=utf-8");

    // Route: GET /health
    if (req.method === "GET" && url.pathname === "/health") {
      res.writeHead(200);
      res.end(JSON.stringify({ status: "healthy", timestamp: new Date().toISOString() }));
      return;
    }

    // Route: GET /api/report
    if (req.method === "GET" && url.pathname === "/api/report") {
      const propertyId = url.searchParams.get("propertyId") || process.env.GA_PROPERTY_ID;
      const propertyName = url.searchParams.get("name") || "Default Property";
      const days = Number.parseInt(url.searchParams.get("days") || "7", 10);
      const limit = Number.parseInt(url.searchParams.get("limit") || "5", 10);

      if (!propertyId) {
        res.writeHead(400);
        res.end(JSON.stringify(formatJsonError("Missing required parameter: propertyId")));
        return;
      }

      if (!defaultCredentials) {
        res.writeHead(500);
        res.end(JSON.stringify(formatJsonError("Server credentials not configured.")));
        return;
      }

      try {
        const client = new GA4Client(defaultCredentials, propertyId);
        const report = await client.getFullReport(propertyName, propertyId, days, limit);
        res.writeHead(200);
        res.end(JSON.stringify(formatJsonReport(report)));
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        res.writeHead(500);
        res.end(JSON.stringify(formatJsonError(msg)));
      }
      return;
    }

    // 404 Fallback
    res.writeHead(404);
    res.end(JSON.stringify(formatJsonError(`Route ${req.method} ${url.pathname} not found`)));
  });

  return {
    server,
    listen: () =>
      new Promise<void>((resolve) => {
        server.listen(port, () => {
          console.log(`🚀 @gatriever/api-server listening on port ${port}`);
          resolve();
        });
      }),
  };
}
