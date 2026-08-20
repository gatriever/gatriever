import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { scaffoldProject } from "../packages/create-gatriever/src/index.js";
import { prepareDeployment } from "../packages/gatriever/src/assembler.js";

describe("End-to-End Workflow: create-gatriever -> gatriever prepare", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "gatriever-e2e-"));
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it("completes full Firebase lifecycle", async () => {
    const projectDir = path.join(tmpDir, "podhound-bot");
    await scaffoldProject({
      projectName: "podhound-bot",
      target: "firebase",
      features: { bot: true, api: false, ddns: true },
      destDir: projectDir,
    });

    const result = await prepareDeployment(projectDir);
    expect(result.target).toBe("firebase");
    expect(result.copiedBundles).toContain("index.js");

    const indexJs = await fs.readFile(path.join(projectDir, "deploy", "index.js"), "utf-8");
    expect(indexJs).toContain("telegramHook");
    expect(indexJs).toContain("ddnsSync");
  });

  it("completes full Docker lifecycle", async () => {
    const projectDir = path.join(tmpDir, "docker-runner");
    await scaffoldProject({
      projectName: "docker-runner",
      target: "docker",
      features: { bot: true, api: true, ddns: true },
      destDir: projectDir,
    });

    const result = await prepareDeployment(projectDir);
    expect(result.target).toBe("docker");
    expect(result.copiedBundles).toContain("server.js");

    const serverJs = await fs.readFile(path.join(projectDir, "deploy", "server.js"), "utf-8");
    expect(serverJs).toContain("Starting Gatriever Daemon");
  });
});
