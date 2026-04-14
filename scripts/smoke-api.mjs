#!/usr/bin/env node
/**
 * Smoke test public API routes (no auth). Run while dev server is up:
 *   npm run smoke
 *   BASE_URL=http://localhost:3000 npm run smoke
 */
const base = (process.env.BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");

const checks = [
  ["GET /api/health", `${base}/api/health`],
  ["GET /api/health/mongo", `${base}/api/health/mongo`],
  ["GET /api/v1/products/public", `${base}/api/v1/products/public`],
  ["GET /api/v1/marketing/hero", `${base}/api/v1/marketing/hero`],
];

let failed = 0;
for (const [label, url] of checks) {
  try {
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    const ok = res.ok;
    const snippet = ok
      ? "ok"
      : `${res.status} ${(await res.text()).slice(0, 120)}`;
    console.log(`${ok ? "✓" : "✗"} ${label} → ${snippet}`);
    if (!ok) failed++;
  } catch (e) {
    console.log(`✗ ${label} → ${e instanceof Error ? e.message : e}`);
    failed++;
  }
}

if (failed) {
  console.error(`\n${failed} check(s) failed. Is Mongo running and MONGODB_URI set?`);
  process.exit(1);
}
console.log("\nAll smoke checks passed.");
