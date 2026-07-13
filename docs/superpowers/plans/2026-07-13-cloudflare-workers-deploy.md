# Cloudflare Workers Deploy Target Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Fretwire buildable and locally runnable on Cloudflare Workers via OpenNext, as an additive deploy target alongside the existing Vercel deployment, with zero changes to the payment-signing/store logic.

**Architecture:** Add `@opennextjs/cloudflare` + `wrangler` as devDependencies with a `wrangler.jsonc`/`open-next.config.ts` pair that builds the existing Next.js app into a Worker (`nodejs_compat` flag covers the `node:crypto` calls in `src/lib/payments/*`). `RedisStore` (Upstash, REST-based) and `MemoryStore` are reused unchanged — Workers just needs their env vars supplied as Worker vars/secrets instead of Vercel env vars.

**Tech Stack:** Next.js 15 (App Router), `@opennextjs/cloudflare`, `wrangler`, pnpm, Node 22 (local tooling only — the deployed runtime is workerd).

## Global Constraints

- Additive only: do not modify `docs/deployment.md` or anything in the existing Vercel pipeline.
- Do not run `wrangler login`, `wrangler deploy`, or any command that touches a real Cloudflare account — this plan is local codebase prep only.
- Do not add a Cloudflare KV/D1/R2-backed store. `RedisStore` (Upstash REST) stays the only production store, unchanged, used on both Vercel and Workers.
- `compatibility_date: "2024-09-23"` and `compatibility_flags: ["nodejs_compat"]` are required in `wrangler.jsonc` (this is the flag that makes `node:crypto`'s `createHmac`/`createHash`/`randomUUID`/`timingSafeEqual` work under workerd).
- `pnpm typecheck && pnpm lint && pnpm test && pnpm build` must stay green after every task — this is the existing Vercel/Node path and must not regress.
- All work happens on the already-checked-out branch `cloudflare-workers-deploy`; commit locally, do not push.
- Do not touch the vestigial `better-sqlite3` entry in `next.config.ts` or the `DB_PATH` comment in `.env.example` — out of scope, unrelated to this task.

---

### Task 1: Cloudflare build tooling — dependencies, scripts, gitignore

**Files:**
- Modify: `package.json`
- Modify: `.gitignore`

**Interfaces:**
- Produces: devDependencies `wrangler` and `@opennextjs/cloudflare` available for Task 2's build; three new scripts — `cf:build`, `cf:preview`, `cf:deploy` — that Task 2 and Task 4 invoke by name.

- [ ] **Step 1: Install the Cloudflare/OpenNext devDependencies**

Run: `pnpm add -D wrangler @opennextjs/cloudflare`

Expected: `package.json`'s `devDependencies` gains `wrangler` and `@opennextjs/cloudflare` entries (pnpm resolves current versions itself — do not hand-write version numbers); `pnpm-lock.yaml` updates. Command exits 0.

- [ ] **Step 2: Add Cloudflare scripts to package.json**

Edit the `"scripts"` block in `package.json` to add three entries after `"test": "vitest run"`:

```json
    "test": "vitest run",
    "cf:build": "opennextjs-cloudflare build",
    "cf:preview": "opennextjs-cloudflare build && wrangler dev",
    "cf:deploy": "opennextjs-cloudflare build && wrangler deploy"
```

- [ ] **Step 3: Gitignore the Cloudflare build/dev-secrets artifacts**

Edit `.gitignore`, adding these two lines right after the existing `.vercel` line:

```
.open-next
.dev.vars
```

- [ ] **Step 4: Verify the existing Vercel/Node path is unaffected**

Run: `pnpm typecheck && pnpm lint && pnpm test`

Expected: all three pass (same as before this task — adding unused devDependencies and scripts doesn't touch any source file).

- [ ] **Step 5: Commit**

```bash
git add package.json pnpm-lock.yaml .gitignore
git commit -m "chore: add Cloudflare Workers build tooling (wrangler, OpenNext)"
```

---

### Task 2: Wrangler + OpenNext config, verified build

**Files:**
- Create: `wrangler.jsonc`
- Create: `open-next.config.ts`

**Interfaces:**
- Consumes: `cf:build` script from Task 1.
- Produces: a working `.open-next/worker.js` + `.open-next/assets` build output that Task 4's `cf:preview` run depends on.

- [ ] **Step 1: Create `wrangler.jsonc`**

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "fretwire",
  "main": ".open-next/worker.js",
  "compatibility_date": "2024-09-23",
  "compatibility_flags": ["nodejs_compat"],
  "assets": {
    "directory": ".open-next/assets",
    "binding": "ASSETS"
  }
}
```

- [ ] **Step 2: Create `open-next.config.ts`**

```typescript
import { defineCloudflareConfig } from '@opennextjs/cloudflare';

export default defineCloudflareConfig();
```

- [ ] **Step 3: Run the Cloudflare build and verify output**

Run: `pnpm run cf:build`

Expected: exits 0; ends with OpenNext reporting a successful build (no unresolved Node built-in warnings for `crypto`).

- [ ] **Step 4: Verify the build artifacts exist**

Run: `ls .open-next/worker.js && ls -d .open-next/assets`

Expected: both paths print without "No such file or directory".

- [ ] **Step 5: Commit**

```bash
git add wrangler.jsonc open-next.config.ts
git commit -m "feat(cloudflare): add wrangler + OpenNext config"
```

---

### Task 3: Local dev-vars template, Cloudflare docs, CLAUDE.md pointer

**Files:**
- Create: `.dev.vars.example`
- Create: `docs/cloudflare.md`
- Modify: `CLAUDE.md`

**Interfaces:**
- Consumes: the env var names already defined in `src/lib/env.ts` (`PAYMENTS_MODE`, `NEXTPAYMENTS_API_URL`, `NEXTPAYMENTS_PUBLIC_KEY`, `NEXTPAYMENTS_PRIVATE_KEY`, `NEXTPAYMENTS_IPN_SECRET`, `NEXT_PUBLIC_SITE_URL`) and `src/lib/store/redis-store.ts` (`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`).
- Produces: `.dev.vars.example`, the template Task 4 copies to the (gitignored) `.dev.vars` for its local `wrangler dev` run.

- [ ] **Step 1: Create `.dev.vars.example`**

```
# Cloudflare Workers local-dev vars (wrangler dev). Copy to .dev.vars (gitignored)
# and fill in — mirrors .env.example but read by the Worker runtime, not Next's
# own dotenv loading.

PAYMENTS_MODE=mock

# NextPayments gateway. Required only when PAYMENTS_MODE=http.
NEXTPAYMENTS_API_URL=https://your-gateway.example
NEXTPAYMENTS_PUBLIC_KEY=
NEXTPAYMENTS_PRIVATE_KEY=
NEXTPAYMENTS_IPN_SECRET=dev-ipn-secret

# Upstash Redis (REST API). Omit both to fall back to the in-memory store.
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Public origin of THIS worker (used to build the IPN self-callback URL in
# mock mode). Defaults to wrangler dev's local port.
NEXT_PUBLIC_SITE_URL=http://localhost:8787
```

- [ ] **Step 2: Create `docs/cloudflare.md`**

```markdown
# Cloudflare Workers (additive deploy target)

Fretwire also builds and runs on Cloudflare Workers via
[OpenNext](https://opennext.js.org/cloudflare). This is **additive** to the
Vercel deployment described in [deployment.md](deployment.md), which stays the
documented production target. Nothing here has been deployed to a live
Cloudflare account yet — this doc covers local build/preview and what's needed
to actually deploy when that's wanted.

## Why OpenNext, not `@cloudflare/next-on-pages`

The payment core (`src/lib/payments/sign.ts`, `ipn.ts`, `mock-client.ts`) uses
`node:crypto` (`createHmac`, `createHash`, `randomUUID`, `timingSafeEqual`) in
standard Node-runtime route handlers. OpenNext runs the built app under
workerd's `nodejs_compat` layer, which supports all four functions natively —
no rewrite to Web Crypto needed. `next-on-pages` would force `edge` runtime
and a much thinner Node shim.

## Store

Unchanged: `getStore()` still picks `RedisStore` (Upstash, REST API — plain
`fetch` under the hood, so it runs the same on Workers as on Vercel) when
`UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` are set, else
`MemoryStore`. No Cloudflare KV/D1 binding is used.

## Commands

```bash
pnpm run cf:build     # opennextjs-cloudflare build -> .open-next/
pnpm run cf:preview   # build, then `wrangler dev` (fully local, no Cloudflare login)
pnpm run cf:deploy    # build, then `wrangler deploy` (needs `wrangler login` first)
```

## Required vars/secrets

Same names as the Vercel setup (see [deployment.md](deployment.md)'s env
table), set as Worker vars/secrets instead of Vercel env vars:

| Var                                                | Why                                                    |
| --------------------------------------------------- | ------------------------------------------------------- |
| `PAYMENTS_MODE`                                     | `mock` or `http`                                         |
| `NEXTPAYMENTS_API_URL` / `_PUBLIC_KEY` / `_PRIVATE_KEY` / `_IPN_SECRET` | Only for `PAYMENTS_MODE=http`         |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Selects `RedisStore`; omit both for `MemoryStore`      |
| `NEXT_PUBLIC_SITE_URL`                              | Canonical URL **and** the IPN self-callback host (see gotcha below) |

For local `wrangler dev`, copy `.dev.vars.example` to `.dev.vars` (gitignored)
and fill in. For a real deployment, use `wrangler secret put <NAME>` for
secrets and the `vars` block in `wrangler.jsonc` for non-secret values.

## Gotcha — IPN self-callback needs an explicit public URL

Vercel auto-injects `VERCEL_URL`, which `src/lib/env.ts` falls back to when
`NEXT_PUBLIC_SITE_URL` is unset. **Cloudflare Workers has no equivalent
auto-injected URL var.** Without `NEXT_PUBLIC_SITE_URL` set, `env.appUrl` falls
all the way back to `http://localhost:3000`, so in mock mode the self-signed
IPN never reaches the running Worker and orders stay `pending` forever. Always
set `NEXT_PUBLIC_SITE_URL` explicitly — to `http://localhost:8787` for
`wrangler dev`, or to the Worker's public URL (`https://fretwire.<subdomain>.workers.dev`
or a custom domain) once actually deployed.

## Not done yet (would be needed before a real deploy)

- [ ] `wrangler login` against a real Cloudflare account.
- [ ] Provision the vars/secrets above on the Worker (dashboard or `wrangler secret put`).
- [ ] `pnpm run cf:deploy`, then verify the same checkout → simulate → status
      flow documented in [deployment.md](deployment.md) against the deployed
      Worker.
- [ ] Custom domain, if wanted, in place of the `workers.dev` subdomain.
```

- [ ] **Step 3: Add a pointer from CLAUDE.md's Deploy section**

In `CLAUDE.md`, find this paragraph under `## Deploy (Vercel)`:

```markdown
See [docs/deployment.md](docs/deployment.md) for the live deployment record
(GitHub/Vercel targets, env vars, the IPN-callback gotcha, and the TODO list).
```

Replace it with (adds one line, keeps the rest identical):

```markdown
See [docs/deployment.md](docs/deployment.md) for the live deployment record
(GitHub/Vercel targets, env vars, the IPN-callback gotcha, and the TODO list).
Cloudflare Workers is also supported as an additive deploy target — see
[docs/cloudflare.md](docs/cloudflare.md) for setup, required vars, and
commands (not yet deployed to a live account).
```

- [ ] **Step 4: Full verification gate**

Run: `pnpm typecheck && pnpm lint && pnpm test && pnpm build`

Expected: all four pass (docs/config-only changes; this re-confirms the
baseline Vercel/Node path is still green end to end).

- [ ] **Step 5: Commit**

```bash
git add .dev.vars.example docs/cloudflare.md CLAUDE.md
git commit -m "docs(cloudflare): add local dev-vars template and Cloudflare Workers guide"
```

---

### Task 4: Verify the payment flow under `wrangler dev` (workerd)

**Files:**
- None tracked (creates a local, gitignored `.dev.vars` only — no commit in this task).

**Interfaces:**
- Consumes: `cf:preview` script (Task 1), `wrangler.jsonc`/`open-next.config.ts` (Task 2), `.dev.vars.example` (Task 3).
- Produces: confirmation that `node:crypto` HMAC signing (`sign.ts`) and IPN verification (`ipn.ts`) actually work under workerd's `nodejs_compat`, not just that the build compiles.

- [ ] **Step 1: Create the local `.dev.vars`**

```bash
cp .dev.vars.example .dev.vars
```

Then edit `.dev.vars` so it reads exactly:

```
PAYMENTS_MODE=mock
NEXTPAYMENTS_API_URL=https://your-gateway.example
NEXTPAYMENTS_PUBLIC_KEY=
NEXTPAYMENTS_PRIVATE_KEY=
NEXTPAYMENTS_IPN_SECRET=dev-ipn-secret
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
NEXT_PUBLIC_SITE_URL=http://localhost:8787
```

(Leaving `UPSTASH_REDIS_REST_URL`/`_TOKEN` blank is intentional — `getStore()`
falls back to `MemoryStore`, which is fine for this local, single-process
`wrangler dev` session.)

- [ ] **Step 2: Start `wrangler dev` in the background**

Run:

```bash
pnpm run cf:preview > /tmp/wrangler-dev.log 2>&1 &
echo $! > /tmp/wrangler-dev.pid
sleep 8
cat /tmp/wrangler-dev.log
```

Expected: log shows the OpenNext build completing, then wrangler reporting it's
ready and listening on `http://localhost:8787` (workerd's default `wrangler dev`
port). If the log shows a different port, use that port in the following
steps instead of 8787.

- [ ] **Step 3: Drive checkout**

```bash
curl -s -X POST http://localhost:8787/api/checkout \
  -H 'Content-Type: application/json' \
  -d '{"items":[{"slug":"ironwood-solaris-t","qty":1}],"email":"test@example.com","coin":"ETH"}'
```

Expected: HTTP 200 with a JSON body shaped `{"orderId":"<digits>","payUrl":"/pay/<digits>"}`.
Note the `orderId` value.

- [ ] **Step 4: Simulate payment (exercises signed IPN emit + verify under workerd)**

```bash
ORDER_ID=$(curl -s -X POST http://localhost:8787/api/checkout \
  -H 'Content-Type: application/json' \
  -d '{"items":[{"slug":"ironwood-solaris-t","qty":1}],"email":"test@example.com","coin":"ETH"}' \
  | node -e "process.stdin.on('data',d=>process.stdout.write(JSON.parse(d).orderId))")
echo "order id: $ORDER_ID"
curl -s -X POST "http://localhost:8787/api/orders/$ORDER_ID/simulate"
```

Expected: the simulate call returns `{"ok":true}`. This exercises
`emitMockPaidIpn` (`node:crypto` `createHmac`/`createHash`/`randomUUID` in
`mock-client.ts`) POSTing a signed IPN to this same running Worker's
`/api/ipn`, which verifies it (`timingSafeEqual` in `ipn.ts`) — if any of
those `node:crypto` calls were unsupported under workerd, this step would
throw and return a 500, not `{"ok":true}`.

- [ ] **Step 5: Confirm the order reached `paid`**

```bash
curl -s "http://localhost:8787/api/orders/$ORDER_ID/status"
```

Expected: JSON with `"status":"paid"`, a non-null `transactionHash`, and a
non-null `paidAt`.

- [ ] **Step 6: Stop the dev server**

```bash
kill "$(cat /tmp/wrangler-dev.pid)"
```

- [ ] **Step 7: Clean up the local secrets file**

```bash
rm .dev.vars
git status
```

Expected: `git status` shows a clean working tree (no untracked/modified
files) — `.dev.vars` was gitignored and is now removed, and nothing else in
this task touched tracked files, so there is nothing to commit.

---

## Final check

After Task 4, confirm the branch's full history is the four commits from
Tasks 1–3 (Task 4 produces no commit) and that `pnpm typecheck && pnpm lint
&& pnpm test && pnpm build` is still green:

```bash
git log --oneline main..cloudflare-workers-deploy
pnpm typecheck && pnpm lint && pnpm test && pnpm build
```
