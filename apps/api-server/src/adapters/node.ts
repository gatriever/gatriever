import { createApiServer, type ApiServerOptions } from "../core.js";

export async function startNodeServer(options: ApiServerOptions = {}) {
  const { listen } = createApiServer(options);
  await listen();
}

if (process.env.NODE_ENV !== "test") {
  startNodeServer().catch((err) => {
    console.error("❌ Failed to start api-server:", err);
    process.exit(1);
  });
}

export default startNodeServer;
