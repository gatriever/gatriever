import { defineConfig } from "tsup";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  entry: {
    cli: "src/cli.ts",
    index: "src/index.ts",
  },
  format: ["esm"],
  target: "node24",
  clean: true,
  dts: true,
  sourcemap: true,
  onSuccess: async () => {
    const dest = path.resolve(__dirname, "dist", "cartridges");
    fs.mkdirSync(dest, { recursive: true });
    
    const appsDir = path.resolve(__dirname, "..", "..", "apps");
    const apps = ["telegram-bot", "api-server", "ddns-sync"];
    
    for (const app of apps) {
      const appDist = path.join(appsDir, app, "dist");
      if (fs.existsSync(appDist)) {
        const files = fs.readdirSync(appDist);
        for (const file of files) {
          if (file.endsWith(".js") && !file.endsWith(".map")) {
            fs.copyFileSync(path.join(appDist, file), path.join(dest, file));
          }
        }
      }
    }
    console.log(`📦 Bundled app cartridges copied to dist/cartridges/`);
  },
  banner: {
    js: `#!/usr/bin/env node\nimport { createRequire } from 'module'; const require = createRequire(import.meta.url);`,
  },
});
