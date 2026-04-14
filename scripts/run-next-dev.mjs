#!/usr/bin/env node
/**
 * Spawn `next dev` with Turbopack-related env vars removed.
 * Prevents ENOENT on .next/postcss.js when the shell or IDE sets TURBOPACK=1 globally.
 *
 * Dev uses `NEXT_DEV_DIST_DIR` (see next.config.ts) so it does not share `.next` with
 * `next build` / `next start` — avoids missing manifest ENOENT when those clash.
 *
 * Optional: `NEXT_DEV_KEEP_NEXT=1` keeps the dev distDir on disk even if manifests look bad.
 * `NEXT_DEV_FULL_CLEAN=1` also clears `node_modules/.cache`.
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const env = { ...process.env };
delete env.TURBOPACK;
delete env.TURBOPACK_DEV;
delete env.IS_TURBOPACK_TEST;
env.NODE_ENV = "development";

const DEV_DIST_NAME = ".next-dev-mlm";
env.NEXT_DEV_DIST_DIR = DEV_DIST_NAME;

const nodeMajor = Number.parseInt(process.versions.node, 10);
if (nodeMajor > 22) {
  console.warn(
    `[mlm-saas] Node ${process.versions.node} is newer than this app's supported range (<23). Use Node 20 or 22 LTS if dev is unstable.`,
  );
}

/** Old projects used distDir `.next-dev`; remove leftovers so webpack does not stat missing packs. */
fs.rmSync(path.join(root, ".next-dev"), { recursive: true, force: true });

const devDistDir = path.join(root, DEV_DIST_NAME);

/** Dev server expects these; missing any → ENOENT + 500 on every route. */
function nextDevCacheIncomplete(dir) {
  if (!fs.existsSync(dir)) return false;
  const critical = [
    path.join(dir, "routes-manifest.json"),
    path.join(dir, "server", "app-paths-manifest.json"),
    path.join(dir, "server", "pages-manifest.json"),
  ];
  return critical.some((p) => !fs.existsSync(p));
}

if (
  nextDevCacheIncomplete(devDistDir) &&
  env.NEXT_DEV_KEEP_NEXT !== "1"
) {
  console.warn(
    `[mlm-saas] Removing incomplete ${DEV_DIST_NAME} (missing dev manifests).`,
  );
  fs.rmSync(devDistDir, { recursive: true, force: true });
}

if (env.NEXT_DEV_FULL_CLEAN === "1") {
  fs.rmSync(devDistDir, { recursive: true, force: true });
  fs.rmSync(path.join(root, ".next"), { recursive: true, force: true });
  fs.rmSync(path.join(root, "node_modules", ".cache"), {
    recursive: true,
    force: true,
  });
}

const nextCli = path.join(root, "node_modules", "next", "dist", "bin", "next");

const child = spawn(process.execPath, [nextCli, "dev", ...process.argv.slice(2)], {
  stdio: "inherit",
  env,
  cwd: root,
});

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});
