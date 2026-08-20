import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { scaffoldProject } from "../src/index.js";

describe("create-gatriever scaffolder", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "create-gatriever-test-"));
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it("should scaffold Firebase project", async () => {
    const destDir = path.join(tmpDir, "my-firebase-bot");
    const createdFiles = await scaffoldProject({
      projectName: "my-firebase-bot",
      target: "firebase",
      features: { bot: true, api: false, ddns: true },
      destDir,
    });

    expect(createdFiles).toContain("package.json");
    expect(createdFiles).toContain(path.join(".github", "workflows", "deploy.yml"));

    const pkgRaw = await fs.readFile(path.join(destDir, "package.json"), "utf-8");
    const pkg = JSON.parse(pkgRaw);

    expect(pkg.name).toBe("my-firebase-bot");
    expect(pkg.gatriever.target).toBe("firebase");
    expect(pkg.gatriever.features.bot).toBe(true);
    expect(pkg.gatriever.features.api).toBe(false);
    expect(pkg.gatriever.features.ddns.enabled).toBe(true);
  });

  it("should scaffold Docker project", async () => {
    const destDir = path.join(tmpDir, "my-docker-bot");
    const createdFiles = await scaffoldProject({
      projectName: "my-docker-bot",
      target: "docker",
      features: { bot: true, api: true, ddns: false },
      destDir,
    });

    expect(createdFiles).toContain("package.json");
    expect(createdFiles).toContain("docker-compose.yml");
    expect(createdFiles).toContain(".env.example");

    const pkgRaw = await fs.readFile(path.join(destDir, "package.json"), "utf-8");
    const pkg = JSON.parse(pkgRaw);

    expect(pkg.name).toBe("my-docker-bot");
    expect(pkg.gatriever.target).toBe("docker");
    expect(pkg.gatriever.features.api).toBe(true);
    expect(pkg.gatriever.features.ddns.enabled).toBe(false);
  });
});
