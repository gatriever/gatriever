import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    firebase: "src/adapters/firebase.ts",
    node: "src/adapters/node.ts",
    cli: "src/cli.ts",
    index: "src/index.ts",
  },
  format: ["esm"],
  target: "node24",
  clean: true,
  dts: true,
  sourcemap: true,
  noExternal: [/^(?!firebase-functions|firebase-admin).*/],
  external: ["firebase-functions", "firebase-functions/v2/https", "firebase-functions/v2/scheduler", "firebase-admin"],
  banner: {
    js: `import { createRequire } from 'module'; const require = createRequire(import.meta.url);`,
  },
});
