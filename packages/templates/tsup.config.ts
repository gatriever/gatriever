import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    telegram: "src/telegram.ts",
    json: "src/json.ts",
  },
  format: ["esm"],
  dts: true,
  clean: true,
  sourcemap: true,
  target: "node24",
});
