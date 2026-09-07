/**
 * Regenerate package-lock.json so it is complete for every platform.
 *
 * The problem this solves: a plain `npm install` on Windows writes a lock file
 * describing only what it actually installed. The wasm fallbacks used by
 * @tailwindcss/oxide and @unrs/resolver depend on @emnapi/core and
 * @emnapi/runtime, which are gated by os/cpu and therefore skipped on Windows.
 * `npm ci` on the Linux CI runner then refuses to install, because the lock
 * file and package.json disagree:
 *
 *   npm error `npm ci` can only install packages when your package.json and
 *   npm error package-lock.json are in sync.
 *   npm error Missing: @emnapi/runtime@1.11.3 from lock file
 *
 * `npm install --package-lock-only` resolves the dependency graph without
 * installing anything, so it records every platform's entries regardless of
 * the machine it runs on — Windows included. No container, no Linux VM.
 *
 * Run this after any `npm install`, then commit package-lock.json.
 */
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

// Present only on Linux/musl builds, so they are exactly what a Windows
// `npm install` drops. If these survive a regeneration, the lock file is whole.
const PLATFORM_GATED = ["@emnapi/core", "@emnapi/runtime"];

function readLock() {
  return JSON.parse(readFileSync("package-lock.json", "utf8"));
}

function countEntries(lock, name) {
  return Object.keys(lock.packages ?? {}).filter((key) =>
    key.endsWith(`node_modules/${name}`),
  ).length;
}

const before = (() => {
  try {
    return Object.keys(readLock().packages ?? {}).length;
  } catch {
    return 0;
  }
})();

console.log("Resolving the full dependency graph (no install)…");

const result = spawnSync(
  "npm",
  [
    "install",
    "--package-lock-only",
    "--ignore-scripts",
    "--no-audit",
    "--no-fund",
  ],
  // shell: true so this works on Windows, where npm is npm.cmd
  { stdio: "inherit", shell: process.platform === "win32" },
);

if (result.error || result.status !== 0) {
  console.error("\nnpm could not regenerate the lock file.");
  console.error("Check that npm is on PATH and that package.json is valid.");
  process.exit(1);
}

const lock = readLock();
const after = Object.keys(lock.packages ?? {}).length;
const missing = PLATFORM_GATED.filter((name) => countEntries(lock, name) === 0);

console.log(`\npackage-lock.json: ${before} entries -> ${after}`);

if (missing.length > 0) {
  console.error(
    `\nStill missing: ${missing.join(", ")}.\n` +
      "Your npm is too old to record cross-platform optional dependencies.\n" +
      `You are on npm ${spawnSync("npm", ["-v"], { encoding: "utf8", shell: process.platform === "win32" }).stdout?.trim() ?? "unknown"}; upgrade with:\n` +
      "  npm install -g npm@latest\n" +
      "then run this again.",
  );
  process.exit(1);
}

console.log(`Verified: ${PLATFORM_GATED.join(", ")} are present.`);
console.log("Commit package-lock.json — `npm ci` on Linux will now resolve.");
