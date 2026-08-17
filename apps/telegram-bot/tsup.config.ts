import { defineConfig } from "tsup";
import rootPkg from "../../package.json" with { type: "json" };

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  target: "node24",
  minify: true,
  clean: true,
  sourcemap: true,
  noExternal: [/^@gatriever\//],
  outDir: "dist",
  define: {
    "process.env.APP_VERSION": JSON.stringify(rootPkg.version),
  },
  banner: {
    js: `// @gatriever/telegram-bot v${rootPkg.version} standalone bundle`,
  },
});
