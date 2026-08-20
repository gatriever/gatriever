import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { GatrieverConfigSchema, type GatrieverConfig, v } from "@gatriever/schemas";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface PrepareResult {
  target: string;
  outDir: string;
  copiedBundles: string[];
  generatedFiles: string[];
}

export async function readProjectConfig(cwd = process.cwd()): Promise<GatrieverConfig> {
  const pkgPath = path.join(cwd, "package.json");
  try {
    const raw = await fs.readFile(pkgPath, "utf-8");
    const json = JSON.parse(raw);
    return v.parse(GatrieverConfigSchema, json.gatriever || {});
  } catch {
    console.warn("⚠️ Could not read valid 'gatriever' configuration from package.json, using defaults.");
    return v.parse(GatrieverConfigSchema, {});
  }
}

async function resolveAdapterFile(target: string, cwd: string): Promise<string> {
  const fileName = target === "firebase" ? "firebase.js" : "node.js";

  const possiblePaths = [
    // 1. Packaged inside installed gatriever npm package
    path.resolve(__dirname, fileName),
    path.resolve(__dirname, "..", fileName),
    path.resolve(__dirname, "..", "dist", fileName),
    // 2. Relative to monorepo root
    path.resolve(__dirname, "..", "..", "dist", fileName),
    path.resolve(cwd, "node_modules", "gatriever", "dist", fileName),
    path.resolve(cwd, "dist", fileName),
  ];

  for (const p of possiblePaths) {
    try {
      await fs.access(p);
      return p;
    } catch {
      // Continue search
    }
  }

  throw new Error(
    `Could not locate adapter bundle '${fileName}' for target '${target}'.\nSearched in:\n${possiblePaths.join("\n")}`
  );
}

export async function prepareDeployment(cwd = process.cwd(), optionsConfig?: Partial<GatrieverConfig>): Promise<PrepareResult> {
  const projectConfig = await readProjectConfig(cwd);
  const config: GatrieverConfig = { ...projectConfig, ...optionsConfig };

  const outDir = path.resolve(cwd, config.outDir || "deploy");
  await fs.mkdir(outDir, { recursive: true });

  const copiedBundles: string[] = [];
  const generatedFiles: string[] = [];

  const target = config.target || "firebase";

  if (target === "firebase") {
    const adapterPath = await resolveAdapterFile("firebase", cwd);
    const destPath = path.join(outDir, "index.js");
    await fs.copyFile(adapterPath, destPath);
    copiedBundles.push("index.js");

    // Copy package.json to deploy folder so Firebase knows it's a module
    const deployPkg = {
      name: "gatriever-firebase-deploy",
      private: true,
      type: "module",
      main: "index.js",
      dependencies: {
        "firebase-functions": "^6.3.2",
      },
    };
    await fs.writeFile(path.join(outDir, "package.json"), JSON.stringify(deployPkg, null, 2), "utf-8");
    generatedFiles.push("package.json");
  } else if (target === "docker" || target === "node") {
    const adapterPath = await resolveAdapterFile("node", cwd);
    const destPath = path.join(outDir, "server.js");
    await fs.copyFile(adapterPath, destPath);
    copiedBundles.push("server.js");

    const dockerfileContent = `FROM node:24-alpine
WORKDIR /app
COPY . .
ENV NODE_ENV=production
CMD ["node", "server.js"]
`;
    await fs.writeFile(path.join(outDir, "Dockerfile"), dockerfileContent, "utf-8");
    generatedFiles.push("Dockerfile");
  }

  return {
    target,
    outDir,
    copiedBundles,
    generatedFiles,
  };
}
