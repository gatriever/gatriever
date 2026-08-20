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

  it("should assemble Firebase deployment package", async () => {
    const result = await prepareDeployment(tmpDir);

    expect(result.target).toBe("firebase");
    expect(result.copiedBundles).toContain("index.js");
    expect(result.generatedFiles).toContain("package.json");

    const pkgContent = await fs.readFile(path.join(tmpDir, "deploy", "package.json"), "utf-8");
    expect(pkgContent).toContain("gatriever-firebase-deploy");
  });

  it("should assemble Docker deployment package", async () => {
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
    expect(result.copiedBundles).toContain("server.js");
    expect(result.generatedFiles).toContain("Dockerfile");

    const dockerfile = await fs.readFile(path.join(tmpDir, "deploy", "Dockerfile"), "utf-8");
    expect(dockerfile).toContain("FROM node:24-alpine");
    expect(dockerfile).toContain('CMD ["node", "server.js"]');
  });
});
