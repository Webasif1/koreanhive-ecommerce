/**
 * Regenerate package-lock.json inside Linux.
 *
 * sharp pulls in platform-gated optional dependencies (@emnapi/core,
 * @emnapi/runtime, @napi-rs/wasm-runtime). npm only records what it resolves
 * for the current platform, so a lock file written on Windows omits the Linux
 * entries — and `npm ci` inside the Alpine image then refuses to install,
 * because the lock and package.json disagree.
 *
 * Declaring them as dependencies does not help: npm still skips them on
 * Windows because of their os/cpu constraints. Generating the lock in the
 * target platform is the fix.
 *
 * Run this after any `npm install` on Windows, before building the image.
 * `npm run docker:build` and `npm run docker:up` already chain it, so prefer
 * those over calling `docker compose` directly.
 */
import { spawnSync } from "node:child_process";

const cwd = process.cwd();

console.log("Regenerating package-lock.json inside node:24-alpine…");

const result = spawnSync(
  "docker",
  [
    "run",
    "--rm",
    "-v",
    `${cwd}:/app`,
    "-w",
    "/app",
    "node:24-alpine",
    "npm",
    "install",
    "--package-lock-only",
    "--ignore-scripts",
    "--no-audit",
    "--no-fund",
  ],
  { stdio: "inherit", shell: false },
);

if (result.error) {
  console.error("Could not run docker — is Docker Desktop running?");
  process.exit(1);
}

process.exit(result.status ?? 1);
