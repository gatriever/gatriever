import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    "telegram-bot.firebase": "src/adapters/firebase.ts",
    "telegram-bot.node": "src/adapters/node.ts",
  },
  format: ["esm"],
  target: "node24",
  clean: true,
  sourcemap: true,
  noExternal: [/(.*)/],
  banner: {
    js: `import { createRequire } from 'module'; const require = createRequire(import.meta.url);`,
  },
});
