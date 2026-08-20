import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    "api-server.firebase": "src/adapters/firebase.ts",
    "api-server.node": "src/adapters/node.ts",
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
