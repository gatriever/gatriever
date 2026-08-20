import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    "ddns-sync.firebase": "src/adapters/firebase.ts",
    "ddns-sync.node": "src/adapters/node.ts",
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
