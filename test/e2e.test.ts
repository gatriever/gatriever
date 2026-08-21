import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { scaffoldProject } from "../packages/create-gatriever/src/index.js";
import { prepareDeployment } from "../packages/gatriever/src/assembler.js";
import { encryptCredentials, decryptCredentials } from "@gatriever/crypto";
import { formatTelegramReport, formatDdnsStatusMessage } from "@gatriever/templates";
import { DdnsResolverService, IpDiffEngine } from "@gatriever/ddns";
import type { SiteAnalyticsReport } from "@gatriever/analytics";
import type { RouterConfig } from "@gatriever/schemas";

describe("End-to-End Workflow: create-gatriever -> deploy assembly & live dogfooding", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "gatriever-e2e-"));
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  describe("1. Project Scaffolding & Preparation", () => {
    it("scaffolds and prepares a complete Firebase deployment for Podhound", async () => {
      const projectDir = path.join(tmpDir, "podhound-analytics");
      const files = await scaffoldProject({
        projectName: "podhound-analytics",
        target: "firebase",
        features: { bot: true, api: false, ddns: true },
        destDir: projectDir,
      });

      expect(files).toContain("package.json");
      expect(files).toContain("firebase.json");
      expect(files).toContain(".gitignore");

      const pkgRaw = await fs.readFile(path.join(projectDir, "package.json"), "utf-8");
      const pkg = JSON.parse(pkgRaw);
      expect(pkg.name).toBe("podhound-analytics");
      expect(pkg.gatriever.target).toBe("firebase");
      expect(pkg.gatriever.features.bot).toBe(true);
      expect(pkg.gatriever.features.ddns.enabled).toBe(true);

      const result = await prepareDeployment(projectDir);
      expect(result.target).toBe("firebase");
      expect(result.copiedBundles).toContain("index.js");

      const indexJs = await fs.readFile(path.join(projectDir, "deploy", "index.js"), "utf-8");
      expect(indexJs).toContain("telegramHook");
      expect(indexJs).toContain("ddnsSync");
    });

    it("scaffolds and prepares a complete Docker deployment", async () => {
      const projectDir = path.join(tmpDir, "docker-runner");
      const files = await scaffoldProject({
        projectName: "docker-runner",
        target: "docker",
        features: { bot: true, api: true, ddns: true },
        destDir: projectDir,
      });

      expect(files).toContain("package.json");
      expect(files).toContain("docker-compose.yml");
      expect(files).toContain(".env.example");

      const result = await prepareDeployment(projectDir);
      expect(result.target).toBe("docker");
      expect(result.copiedBundles).toContain("server.js");
      expect(result.generatedFiles).toContain("Dockerfile");

      const serverJs = await fs.readFile(path.join(projectDir, "deploy", "server.js"), "utf-8");
      expect(serverJs).toContain("Starting Gatriever Daemon");
    });
  });

  describe("2. Live Data Simulation: Podhound & kubakh.name", () => {
    const secretKey = "test-encryption-key-32-chars-long!";

    it("encrypts and decrypts GA4 service account credentials securely", () => {
      const mockServiceAccount = JSON.stringify({
        type: "service_account",
        project_id: "podhound-prod",
        client_email: "gatriever-sa@podhound-prod.iam.gserviceaccount.com",
        private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC3\n-----END PRIVATE KEY-----\n",
      });

      const encrypted = encryptCredentials(mockServiceAccount, secretKey);
      expect(encrypted).not.toContain("podhound-prod");

      const decrypted = decryptCredentials(encrypted, secretKey);
      expect(JSON.parse(decrypted).client_email).toBe("gatriever-sa@podhound-prod.iam.gserviceaccount.com");
    });

    it("formats rich Telegram reports for Podhound and kubakh.name", () => {
      const podhoundReport: SiteAnalyticsReport = {
        propertyName: "Podhound",
        propertyId: "348721902",
        days: 7,
        overview: {
          activeUsers: 1420,
          sessions: 1850,
          pageViews: 4920,
          conversions: 88,
        },
        topPages: [
          { path: "/", views: 2400, users: 950 },
          { path: "/search", views: 1200, users: 510 },
          { path: "/podcast/123", views: 820, users: 340 },
        ],
      };

      const routers: RouterConfig[] = [
        {
          id: "kyiv-office",
          name: "Kyiv Office",
          hostname: "office.podhound.link",
          lastKnownIp: "194.44.112.5",
          lastCheckedAt: new Date().toISOString(),
        },
      ];

      const reportMarkdown = formatTelegramReport(podhoundReport, routers);
      expect(reportMarkdown).toContain("📊 *Report for Podhound*");
      expect(reportMarkdown).toContain("👥 *Active Users:* 1,420");
      expect(reportMarkdown).toContain("👀 *Page Views:* 4,920");
      expect(reportMarkdown).toContain("`194.44.112.5`");

      const statusMarkdown = formatDdnsStatusMessage(routers);
      expect(statusMarkdown).toContain("Kyiv Office");
      expect(statusMarkdown).toContain("`194.44.112.5`");
    });

    it("detects IP changes for DDNS sync", () => {
      const engine = new IpDiffEngine();
      const router: RouterConfig = {
        id: "home-router",
        name: "Home Tenet",
        hostname: "myhome.tenet.ua",
        lastKnownIp: "188.115.42.10",
      };

      const diffNoChange = engine.detectChange(router, "188.115.42.10");
      expect(diffNoChange.hasChanged).toBe(false);

      const diffChanged = engine.detectChange(router, "188.115.88.99");
      expect(diffChanged.hasChanged).toBe(true);
      expect(diffChanged.oldIp).toBe("188.115.42.10");
      expect(diffChanged.newIp).toBe("188.115.88.99");
    });
  });
});
