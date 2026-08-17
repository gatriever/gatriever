#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT_DIR = resolve(".");
const PKG_PATH = join(ROOT_DIR, "package.json");
const CHANGELOG_PATH = join(ROOT_DIR, "CHANGELOG.md");

// 1. Read authoritative version from root package.json
const pkg = JSON.parse(readFileSync(PKG_PATH, "utf-8"));
const version = pkg.version;

if (!version) {
  console.error("❌ Error: 'version' field is missing in root package.json");
  process.exit(1);
}

// 2. Verify CHANGELOG.md exists and contains the version header
const changelog = readFileSync(CHANGELOG_PATH, "utf-8");
const versionRegex = new RegExp(`##\\s*\\[?${version.replace(/\./g, "\\.")}\\]?`, "m");

if (!versionRegex.test(changelog)) {
  console.error(
    `❌ CI Check Failed: Version "${version}" from package.json has no matching entry in CHANGELOG.md!\n` +
    `👉 Please add a "## [${version}]" section to CHANGELOG.md before releasing.`
  );
  process.exit(1);
}

console.log(`✅ CI Check Passed: Version ${version} is properly documented in CHANGELOG.md.`);
