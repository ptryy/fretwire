# Cloudflare Workers deploy target — design

Status: approved · Branch: `cloudflare-workers-deploy` (local only, not pushed/merged)

## Goal

Make Fretwire deployable to Cloudflare Workers, as an **additional** target
alongside the existing Vercel deployment (see [deployment.md](../../deployment.md)).
Vercel stays the documented production deployment; Cloudflare support is new,
parallel tooling. No actual `wrangler deploy` / Cloudflare account interaction
is performed — this is codebase prep only, committed to a local branch.

## Why OpenNext, not `@cloudflare/next-on-pages`

The payment core (`src/lib/payments/sign.ts`, `ipn.ts`, `mock-client.ts`) uses
`node:crypto` (`createHmac`, `createHash`, `randomUUID`, `timingSafeEqual`) and
the API routes (`src/app/api/**/route.ts`) are standard Node-runtime App Router
handlers — none declare `export const runtime = 'edge'`.

- `@cloudflare/next-on-pages` forces `edge` runtime on every route and exposes
  only a thin Node shim — using it would require rewriting the HMAC
  signing/verification code to the Web Crypto API (`crypto.subtle`).
- `@opennextjs/cloudflare` (OpenNext) runs the built Next.js server under
  workerd's `nodejs_compat` layer, which supports all four `node:crypto`
  functions above natively. **Zero changes to `src/lib/payments/*`.** It's
  also Cloudflare's current recommended path for full Next.js App Router
  support (API routes, ISR); `next-on-pages` is in maintenance mode.

## Confirmed compatible as-is (audited, no code changes needed)

- `src/components/qr.tsx` is a `'use client'` component calling the browser
  `qrcode` API (`QRCode.toDataURL`) — no server-side canvas rendering.
- No `next/image` usage anywhere (avoids the Workers image-loader question).
- No `middleware.ts`, no `export const runtime` overrides in `src/app`.
- `src/lib/store/redis-store.ts` (`@upstash/redis`) is REST/fetch-based, not a
  TCP client — runs unchanged on Workers.
- `src/app/products/[slug]/page.tsx`'s `generateStaticParams` is plain SSG,
  compatible with OpenNext's prerendering.
- No `better-sqlite3` dependency actually present in `package.json` despite
  the `serverExternalPackages: ['better-sqlite3']` entry in `next.config.ts`
  (vestigial from the starting template) — left untouched, out of scope.

## Decisions from clarifying questions

1. **Deploy scope**: additive. Cloudflare Workers becomes a second deploy
   target; `docs/deployment.md` (Vercel) is untouched.
2. **Store backend on Workers**: keep `RedisStore` over Upstash's REST API
   unchanged — it's already fetch-based so it works identically on Workers.
   No Cloudflare KV/D1 binding-based store is added (would require
   `getStore()` to become binding-aware via `getCloudflareContext()`, a much
   bigger change not justified when Upstash already works on both platforms).

## Files to add

- **`wrangler.jsonc`**
  - `name: "fretwire"`
  - `compatibility_date: "2024-09-23"`, `compatibility_flags: ["nodejs_compat"]`
  - `main: ".open-next/worker.js"`
  - static assets: directory `.open-next/assets`, binding `ASSETS`
- **`open-next.config.ts`** — minimal default OpenNext config; no custom
  overrides (no KV/D1/R2 bindings to wire up).
- **`.dev.vars.example`** — vars `wrangler dev` needs locally, mirroring
  `.env.example`: `PAYMENTS_MODE`, `NEXTPAYMENTS_API_URL`,
  `NEXTPAYMENTS_PUBLIC_KEY`, `NEXTPAYMENTS_PRIVATE_KEY`,
  `NEXTPAYMENTS_IPN_SECRET`, `UPSTASH_REDIS_REST_URL`,
  `UPSTASH_REDIS_REST_TOKEN`, `NEXT_PUBLIC_SITE_URL`. Real `.dev.vars` stays
  gitignored, same treatment as `.env.local`.
- **`docs/cloudflare.md`** — new doc parallel to `docs/deployment.md`:
  prerequisites, required Worker vars/secrets, build/preview/deploy commands,
  and the Workers-specific IPN self-callback gotcha: unlike Vercel's
  `VERCEL_URL` auto-injection, Workers has no equivalent, so
  `NEXT_PUBLIC_SITE_URL`/`APP_URL` must be set explicitly or mock-mode IPN
  self-callback silently targets `localhost` and orders stay `pending`
  forever (same failure mode already documented for Vercel, different cause).

## Files to change

- **`package.json`**
  - add devDependencies: `wrangler`, `@opennextjs/cloudflare`
  - add scripts: `cf:preview` (OpenNext build + local `wrangler dev`,
    no Cloudflare login required), `cf:deploy` (OpenNext build +
    `wrangler deploy` — documented but not run by us)
  - existing `dev`/`build`/`start`/`test`/`lint`/`typecheck` scripts unchanged
- **`.gitignore`** — add `.open-next/` and `.dev.vars`
- **`CLAUDE.md`** — add a one-line pointer from the Deploy section to
  `docs/cloudflare.md`; existing Vercel content untouched

## Explicitly out of scope

- No Cloudflare KV/D1/R2 store implementation.
- No changes to `docs/deployment.md` or the Vercel pipeline.
- No real `wrangler deploy`, no Cloudflare account/login interaction.
- No cleanup of the vestigial `better-sqlite3` entry in `next.config.ts` or
  the `DB_PATH`/SQLite comment in `.env.example` — unrelated to this task.

## Verification plan

1. `pnpm typecheck && pnpm lint && pnpm test && pnpm build` stays green —
   proves the Cloudflare additions don't regress the existing Vercel/Node
   path.
2. Locally run the OpenNext build + `wrangler dev` (fully local, no
   Cloudflare account/login needed) and drive the real order flow through
   it — `POST /api/checkout` → `POST /api/orders/{id}/simulate` →
   `GET /api/orders/{id}/status` → confirm `paid` — to prove `node:crypto`
   HMAC signing/verification actually works under workerd's `nodejs_compat`,
   not just that the build succeeds.
