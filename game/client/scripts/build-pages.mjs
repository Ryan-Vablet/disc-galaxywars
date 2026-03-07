import { execSync } from "node:child_process";

function run(command, env = process.env) {
  execSync(command, { stdio: "inherit", env });
}

function tryGet(command) {
  try {
    return execSync(command, { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
  } catch {
    return "";
  }
}

function parseRepoName(remoteUrl) {
  if (!remoteUrl) {
    return "";
  }
  const normalized = remoteUrl.replace(/\\/g, "/");
  const match = normalized.match(/\/([^/]+?)(?:\.git)?$/);
  return match?.[1] ?? "";
}

const remoteUrl = tryGet("git config --get remote.origin.url");
const repoFromRemote = parseRepoName(remoteUrl);
const repoName = process.env.GHP_REPO || repoFromRemote;
const basePath = process.env.VITE_BASE_PATH || (repoName ? `/${repoName}/` : "/");

console.log(`[build-pages] Using base path: ${basePath}`);
run("npm run build", { ...process.env, VITE_BASE_PATH: basePath });
