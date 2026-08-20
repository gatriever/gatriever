import { defineConfig } from "vitest/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: [
      "packages/**/test/**/*.test.ts",
      "test/**/*.test.ts",
    ],
  },
  resolve: {
    alias: {
      "@gatriever/schemas": path.resolve(__dirname, "./packages/core/schemas/src"),
      "@gatriever/analytics": path.resolve(__dirname, "./packages/core/analytics/src"),
      "@gatriever/crypto": path.resolve(__dirname, "./packages/core/crypto/src"),
      "@gatriever/http": path.resolve(__dirname, "./packages/core/http/src"),
      "@gatriever/storage": path.resolve(__dirname, "./packages/core/storage/src"),
      "@gatriever/templates": path.resolve(__dirname, "./packages/core/templates/src"),
      "@gatriever/ddns": path.resolve(__dirname, "./packages/core/ddns/src"),
      "@gatriever/bot": path.resolve(__dirname, "./packages/core/bot/src"),
      "gatriever": path.resolve(__dirname, "./packages/gatriever/src"),
    },
  },
});
