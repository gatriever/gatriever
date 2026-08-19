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
      "apps/**/test/**/*.test.ts",
    ],
  },
  resolve: {
    alias: {
      "@core/schemas": path.resolve(__dirname, "./packages/core/schemas/src"),
      "@core/ddns": path.resolve(__dirname, "./packages/core/ddns/src"),
      "@core/analytics": path.resolve(__dirname, "./packages/core/analytics/src"),
      "@core/templates": path.resolve(__dirname, "./packages/core/templates/src"),
      "@infra/storage": path.resolve(__dirname, "./packages/infrastructure/storage/src"),
      "@infra/crypto": path.resolve(__dirname, "./packages/infrastructure/crypto/src"),
      "@infra/http": path.resolve(__dirname, "./packages/infrastructure/http/src"),
    },
  },
});
