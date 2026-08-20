import * as p from "@clack/prompts";
import pc from "picocolors";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface ScaffoldOptions {
  projectName: string;
  target: "firebase" | "docker";
  features: {
    bot: boolean;
    api: boolean;
    ddns: boolean;
  };
  destDir?: string;
}

export async function scaffoldProject(options: ScaffoldOptions): Promise<string[]> {
  const destDir = options.destDir || path.resolve(process.cwd(), options.projectName);
  await fs.mkdir(destDir, { recursive: true });

  const templatesDir = path.resolve(__dirname, "..", "templates", options.target);
  const createdFiles: string[] = [];

  async function copyTemplateFiles(src: string, dest: string) {
    const entries = await fs.readdir(src, { withFileTypes: true });
    await fs.mkdir(dest, { recursive: true });

    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);

      if (entry.isDirectory()) {
        await copyTemplateFiles(srcPath, destPath);
      } else {
        let content = await fs.readFile(srcPath, "utf-8");
        content = content
          .replaceAll("{{PROJECT_NAME}}", options.projectName)
          .replaceAll("{{FEATURE_BOT}}", String(options.features.bot))
          .replaceAll("{{FEATURE_API}}", String(options.features.api))
          .replaceAll("{{FEATURE_DDNS}}", String(options.features.ddns));

        await fs.writeFile(destPath, content, "utf-8");
        createdFiles.push(path.relative(destDir, destPath));
      }
    }
  }

  await copyTemplateFiles(templatesDir, destDir);
  return createdFiles;
}

async function runCli() {
  p.intro(pc.bgCyan(pc.black(" 🐾 create-gatriever ")));

  const defaultName = process.argv[2] || "my-gatriever-bot";

  const projectName = (await p.text({
    message: "Project name / directory:",
    placeholder: defaultName,
    defaultValue: defaultName,
    validate(val) {
      if (!val || val.trim().length === 0) return "Please enter a valid project name";
    },
  })) as string;

  if (p.isCancel(projectName)) {
    p.cancel("Operation cancelled.");
    process.exit(0);
  }

  const target = (await p.select({
    message: "Choose deployment target:",
    options: [
      { value: "firebase", label: "🔥 Firebase Cloud Functions (Serverless, Free Tier)" },
      { value: "docker", label: "🐳 Docker / VPS (Self-hosted Container)" },
    ],
  })) as "firebase" | "docker";

  if (p.isCancel(target)) {
    p.cancel("Operation cancelled.");
    process.exit(0);
  }

  const features = (await p.multiselect({
    message: "Select features to enable:",
    options: [
      { value: "bot", label: "🤖 Telegram Analytics Bot", hint: "recommended" },
      { value: "ddns", label: "🌐 DDNS & GA4 Internal Traffic Sync", hint: "recommended" },
      { value: "api", label: "⚡ REST API Server" },
    ],
    initialValues: ["bot", "ddns"],
  })) as string[];

  if (p.isCancel(features)) {
    p.cancel("Operation cancelled.");
    process.exit(0);
  }

  const s = p.spinner();
  s.start("Scaffolding project files...");

  const createdFiles = await scaffoldProject({
    projectName,
    target,
    features: {
      bot: features.includes("bot"),
      api: features.includes("api"),
      ddns: features.includes("ddns"),
    },
  });

  s.stop(`Project ${pc.green(projectName)} created successfully!`);

  p.note(
    [
      `Created files:`,
      ...createdFiles.map((f) => `  - ${f}`),
      "",
      pc.bold("Next steps:"),
      `  1. cd ${projectName}`,
      `  2. npm install`,
      target === "firebase"
        ? `  3. Add secrets to GitHub Secrets and push to deploy!`
        : `  3. Fill in .env and run: docker compose up -d`,
    ].join("\n"),
    "Ready to roll 🚀"
  );

  p.outro("Happy retrieving! 🐕");
}

if (process.env.NODE_ENV !== "test" && !process.argv.includes("--test")) {
  runCli().catch((err) => {
    console.error("Fatal create-gatriever error:", err);
    process.exit(1);
  });
}
