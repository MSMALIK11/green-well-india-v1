# Green Well — full stack (Next.js)

This project is a **full copy** of the MLM SaaS web app: **same UI pages**, **same `/api/v1/*` routes**, and **same server code** under `src/server/` (services + Mongoose models + `next-api/v1/dispatch.ts`).

## How the API is exposed

- **App Router:** `app/api/v1/<resource>/[[...path]]/route.ts` for each top-level API group (`auth`, `team`, `wallet`, …), plus `app/api/v1/[[...path]]/route.ts` as a fallback. All re-export the shared handler in `src/server/next-api/v1/handle-request.ts` (Mongo connect, CORS, `routeV1`).
- **No Express and no second backend process** — run only `npm run dev` or `npm run start`.

Other Next routes: `app/api/health/*`, `app/api/file/*`.

## Setup

```bash
cp ../mlm-saas/backend/.env.example .env.local   # or create from scratch
# Required: MONGODB_URI, JWT_SECRET (see src/server/config/env.ts)
npm install
npm run seed
npm run dev
```

Use **Node 20 or 22** (see `engines` in `package.json`).

## Scripts

| Script        | Purpose                          |
|---------------|----------------------------------|
| `npm run dev` | Next dev (uses `.next-dev-mlm` when `NEXT_DEV_DIST_DIR` is set by the runner) |
| `npm run dev:clean` | Clean caches then dev        |
| `npm run build` / `start` | Production                |
| `npm run seed` | Seed MongoDB                  |
| `npm run smoke` | Hit health + sample APIs     |

## Syncing from MLM again

To refresh this folder from the canonical app:

```bash
rsync -a --delete \
  --exclude '.git' --exclude 'node_modules' --exclude '.next' --exclude '.next-dev' --exclude '.next-dev-mlm' \
  --exclude '.env' --exclude '.env.local' --exclude '.env.*' --exclude 'tsconfig.tsbuildinfo' \
  ../mlm-saas/frontend/ ./
```

Then `npm install` and fix `package.json` name if needed.
