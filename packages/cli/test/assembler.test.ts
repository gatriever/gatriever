import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { prepareDeployment } from "../src/assembler.js";

describe("CLI Assembler (gatriever prepare)", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "gatriever-test-"));
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it("should assemble default Firebase configuration", async () => {
    const result = await prepareDeployment(tmpDir);

    expect(result.target).toBe("firebase");
    expect(result.copiedBundles).toContain("telegram-bot.firebase.js");
    expect(result.generatedFiles).toContain("index.js");

    const indexContent = await fs.readFile(path.join(tmpDir, "deploy", "index.js"), "utf-8");
    expect(indexContent).toContain("import botHandler from \"./telegram-bot.firebase.js\"");
    expect(indexContent).toContain("export const telegramHook = onRequest(botHandler());");
  });

  it("should assemble Docker configuration with multiple features", async () => {
    const pkg = {
      name: "custom-gatriever-app",
      gatriever: {
        target: "docker",
        features: {
          bot: true,
          api: true,
          ddns: {
            enabled: true,
            cron: "*/30 * * * *",
          },
        },
      },
    };

    await fs.writeFile(path.join(tmpDir, "package.json"), JSON.stringify(pkg), "utf-8");
    const result = await prepareDeployment(tmpDir);

    expect(result.target).toBe("docker");
    expect(result.copiedBundles).toEqual([
      "telegram-bot.node.js",
      "api-server.node.js",
      "ddns-sync.node.js",
    ]);
    expect(result.generatedFiles).toContain("Dockerfile");

    const dockerfile = await fs.readFile(path.join(tmpDir, "deploy", "Dockerfile"), "utf-8");
    expect(dockerfile).toContain("FROM node:24-alpine");
    expect(dockerfile).toContain('CMD ["node", "telegram-bot.node.js"]');
  });
});
