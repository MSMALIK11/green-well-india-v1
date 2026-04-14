import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

/** Next apps that share this env loader (monorepo frontend + standalone Green Well copy). */
const APP_PACKAGE_NAMES = new Set(["mlm-saas-web", "greenwell-fullstack"]);

/**
 * Walk parents from `start` until `package.json` matches an app in `APP_PACKAGE_NAMES`.
 */
function findPackageRoot(start: string): string | null {
  let dir = path.resolve(start);
  for (let i = 0; i < 28; i++) {
    const pkgPath = path.join(dir, "package.json");
    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8")) as {
          name?: string;
        };
        if (pkg.name && APP_PACKAGE_NAMES.has(pkg.name)) return dir;
      } catch {
        /* ignore */
      }
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

/** Ordered, deduped candidate paths for monorepo `backend/.env`. */
function backendEnvPathsToTry(): string[] {
  const ordered: string[] = [];
  const seen = new Set<string>();

  const add = (p: string) => {
    const abs = path.normalize(path.resolve(p));
    if (seen.has(abs)) return;
    seen.add(abs);
    ordered.push(abs);
  };

  const walkRoots: string[] = [];
  let d = path.resolve(process.cwd());
  for (let i = 0; i < 22; i++) {
    walkRoots.push(d);
    const parent = path.dirname(d);
    if (parent === d) break;
    d = parent;
  }

  try {
    let m = path.dirname(fileURLToPath(import.meta.url));
    for (let i = 0; i < 32; i++) {
      walkRoots.push(m);
      const parent = path.dirname(m);
      if (parent === m) break;
      m = parent;
    }
  } catch {
    /* import.meta.url unavailable */
  }

  const pkgRoot =
    findPackageRoot(process.cwd()) ??
    (() => {
      try {
        return findPackageRoot(path.dirname(fileURLToPath(import.meta.url)));
      } catch {
        return null;
      }
    })();

  if (pkgRoot) {
    add(path.join(pkgRoot, "..", "backend", ".env"));
    add(path.join(pkgRoot, "backend", ".env"));
  }

  add(path.join(process.cwd(), "..", "backend", ".env"));
  add(path.join(process.cwd(), "backend", ".env"));
  add(path.join(process.cwd(), "frontend", "..", "backend", ".env"));

  for (const dir of walkRoots) {
    add(path.join(dir, "backend", ".env"));
    add(path.join(dir, "..", "backend", ".env"));
  }

  return ordered;
}

function resolveProjectRoot(): string {
  const cwd = path.resolve(process.cwd());
  return (
    findPackageRoot(cwd) ??
    (() => {
      try {
        return findPackageRoot(path.dirname(fileURLToPath(import.meta.url)));
      } catch {
        return null;
      }
    })() ??
    findPackageRoot(path.join(cwd, "frontend")) ??
    cwd
  );
}

const projectRoot = resolveProjectRoot();

/** Do not use `@next/env` `loadEnvConfig` here — it can drop vars that only exist in `../backend/.env`. */
for (const p of backendEnvPathsToTry()) {
  if (fs.existsSync(p)) {
    dotenv.config({ path: p });
    break;
  }
}

const feEnv = path.join(projectRoot, ".env");
if (fs.existsSync(feEnv)) dotenv.config({ path: feEnv });

for (const name of [".env.local", ".env.development.local"] as const) {
  const p = path.join(projectRoot, name);
  if (fs.existsSync(p)) dotenv.config({ path: p, override: true });
}

function required(name: string): string {
  const v = process.env[name];
  if (!v) {
    const tried = backendEnvPathsToTry().filter((p) => fs.existsSync(p));
    throw new Error(
      `Missing env: ${name}. Set it in .env.local at the app root or in a sibling backend/.env ` +
        `(app root: ${projectRoot}; found backend env files: ${
          tried.length ? tried.join(", ") : "none"
        }).`,
    );
  }
  return v;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT) || 4000,
  get mongoUri() {
    return required("MONGODB_URI");
  },
  get jwtSecret() {
    return required("JWT_SECRET");
  },
  jwtAccessExpires: process.env.JWT_ACCESS_EXPIRES ?? "15m",
  jwtRefreshExpires: process.env.JWT_REFRESH_EXPIRES ?? "7d",
  get clientOrigin() {
    return process.env.CLIENT_ORIGIN ?? "http://localhost:3000";
  },
  /** Vercel: ephemeral /tmp. For durable KYC files use Blob/S3 later. */
  get uploadDir() {
    if (process.env.VERCEL === "1") {
      return "/tmp/mlm-uploads";
    }
    return process.env.UPLOAD_DIR ?? "./uploads";
  },
};
