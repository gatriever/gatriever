// Load local .env natively if present
if (typeof process.loadEnvFile === "function") {
  try {
    process.loadEnvFile();
  } catch {
    // .env is optional
  }
}

import { createApiServer } from "./server.js";

async function main() {
  const api = createApiServer();
  await api.listen();
}

main().catch((err) => {
  console.error("API Server Fatal Error:", err);
  process.exit(1);
});
