#!/usr/bin/env node
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT_DIR = resolve(".");
const PKG_PATH = join(ROOT_DIR, "package.json");

// 1. Source of truth: root package.json
const rootPkg = JSON.parse(readFileSync(PKG_PATH, "utf-8"));
const targetVersion = rootPkg.version;

if (!targetVersion) {
  console.error("❌ Error: No version found in root package.json");
  process.exit(1);
}

console.log(`🔄 Syncing monorepo version to: ${targetVersion}`);

function updatePackageJson(pkgPath) {
  try {
    const content = readFileSync(pkgPath, "utf-8");
    const json = JSON.parse(content);
    if (json.version !== targetVersion) {
      json.version = targetVersion;
      writeFileSync(pkgPath, JSON.stringify(json, null, 2) + "\n");
      console.log(`  ✓ Updated ${pkgPath}`);
    } else {
      console.log(`  - Up to date: ${pkgPath}`);
    }
  } catch (err) {
    console.warn(`  ⚠️ Could not update ${pkgPath}: ${err.message}`);
  }
}

// Update apps and packages in CI
for (const dir of ["apps", "packages"]) {
  const fullDir = join(ROOT_DIR, dir);
  try {
    const entries = readdirSync(fullDir);
    for (const entry of entries) {
      const entryPath = join(fullDir, entry);
      if (statSync(entryPath).isDirectory()) {
        const subPkgPath = join(entryPath, "package.json");
        try {
          if (statSync(subPkgPath).isFile()) {
            updatePackageJson(subPkgPath);
          }
        } catch {
          // No package.json
        }
      }
    }
  } catch {
    // Directory might not exist
  }
}

console.log("✅ Version synchronization complete.");
