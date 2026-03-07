import { execSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

function run(command, cwd = process.cwd()) {
  execSync(command, { stdio: "inherit", cwd });
}

function get(command) {
  return execSync(command, { stdio: ["ignore", "pipe", "inherit"] }).toString().trim();
}

const distPath = join(process.cwd(), "dist");
if (!existsSync(distPath)) {
  console.log("[deploy-gh-pages] dist not found, building first...");
}

run("node scripts/build-pages.mjs");

const origin = get("git config --get remote.origin.url");
if (!origin) {
  throw new Error("No git remote origin found. Add a GitHub remote first.");
}

if (!existsSync(distPath)) {
  throw new Error("Build finished but dist directory is missing.");
}

const tempRoot = mkdtempSync(join(tmpdir(), "node-wars-gh-pages-"));
const publishDir = join(tempRoot, "publish");
mkdirSync(publishDir, { recursive: true });

cpSync(distPath, publishDir, { recursive: true });
writeFileSync(join(publishDir, ".nojekyll"), "");

run("git init", publishDir);
run("git checkout -b gh-pages", publishDir);
run("git add .", publishDir);
run('git commit -m "Deploy to GitHub Pages"', publishDir);
run(`git remote add origin "${origin}"`, publishDir);
run("git push --force origin gh-pages", publishDir);

rmSync(tempRoot, { recursive: true, force: true });
console.log("[deploy-gh-pages] Deployed dist to origin/gh-pages.");
