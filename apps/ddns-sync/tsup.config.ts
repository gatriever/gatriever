import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    daemon: "src/daemon.ts",
    firebase: "src/firebase.ts",
  },
  format: ["esm"],
  dts: false,
  clean: true,
  sourcemap: true,
  target: "node24",
  noExternal: [/.*/],
});
