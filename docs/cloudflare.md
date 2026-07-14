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
| `DEV_CONFIG_TOKEN`                                  | Unlocks `/dev/config`; unset → the route 404s (see below) |

### `/dev/config` — changing the gateway on a running deploy

`/dev/config` is the host-agnostic way to repoint the gateway or inject a key
without a rebuild — the same thing a Cloudflare dashboard edit does, but it also
works on Vercel, a VPS, or a client's own box. It writes a partial override into
the Store, which `getPaymentsConfig` layers on top of env (override wins per
field).

It is **fail-closed**: on a deployed build (`NODE_ENV=production`) the page and
its API 404 unless `DEV_CONFIG_TOKEN` is set, and then only serve a caller that
has traded the token for the unlock cookie. Because that token is the entire
boundary and unlock attempts aren't rate-limited, use a random 32+ char value,
set as a **Secret**.

Two invariants worth knowing before you rely on it:

- **Credentials are write-only.** The editor never reads a private key or IPN
  secret back — just a `••••1a2b` hint. A blank secret field therefore means
  "keep what's stored", not "clear it", so saving an unrelated field can't wipe
  a key you injected. **Reset to env** is the only way to clear one.
- **It needs a shared store.** On `MemoryStore` the override lives in one
  isolate's memory and the next request may not see it. The editor shows a
  warning when that's the case; set the Upstash vars to make it stick.

For local `wrangler dev`, copy `.dev.vars.example` to `.dev.vars` (gitignored)
and fill in.

### The Worker's own settings are the source of truth

For a real deployment, set **every** var and secret on the Worker itself —
dashboard (**Settings → Variables and secrets**) or `wrangler secret put <NAME>`
— and keep `wrangler.jsonc` free of a `vars` block. The app only ever reads
`process.env` (`src/lib/env.ts`); OpenNext copies the Worker's env onto
`process.env` on the first request, so a dashboard value lands with no code
change and no rebuild.

This is why `wrangler.jsonc` sets **`"keep_vars": true`**. By default Wrangler
treats its config file as authoritative — *"if you change your vars in the
dashboard, wrangler will override/delete them on its next deploy"* — so a
`vars` block would silently wipe the dashboard config on every deploy, and
would also commit gateway config to git. `keep_vars` turns that off.

Consequence worth knowing: **editing a var or secret in the dashboard takes
effect immediately.** It rolls out a new version of the already-built Worker —
no `cf:build`, no redeploy. That's the supported way to repoint the gateway or
swap a key on a live deploy.

Secrets (`NEXTPAYMENTS_PRIVATE_KEY`, `NEXTPAYMENTS_IPN_SECRET`,
`UPSTASH_REDIS_REST_TOKEN`) must be **Secret**-type, not Plaintext — Plaintext
values are readable in the dashboard and in `wrangler` output.

## Gotcha — Workers Builds needs an explicit `PNPM_VERSION`

`pnpm-workspace.yaml` approves native build scripts (`esbuild`, `sharp`,
`unrs-resolver`, `workerd`) via the `allowBuilds` key, which only pnpm **v11+**
understands (see `package.json`'s `packageManager: pnpm@11.8.0`, which pins
this for local/corepack-aware tooling). Cloudflare Workers Builds does **not**
read `packageManager`/corepack — it only respects an explicit `PNPM_VERSION`
build variable, and defaults to an older pnpm 10.x otherwise. pnpm 10 doesn't
recognize `allowBuilds`, and older pnpm 10.x releases additionally have an
upstream bug ([pnpm/pnpm#9361](https://github.com/pnpm/pnpm/issues/9361))
where a `pnpm-workspace.yaml` with build-approval settings but no `packages`
field throws `ERROR packages field missing or empty` on `pnpm install
--frozen-lockfile` in a fresh clone. **Set `PNPM_VERSION=11.8.0`** (or the
version pinned in `package.json`) under the Worker's **Settings → Build →
Variables and secrets** so the build image matches what the repo is written
for.

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
