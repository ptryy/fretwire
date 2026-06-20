# Deployment

Live record of how Fretwire is shipped, what's done, and what's left. For the
gateway wire contract see [integration.md](integration.md); for architecture see
[../CLAUDE.md](../CLAUDE.md).

## Where it lives

| Thing            | Value                                                              |
| ---------------- | ----------------------------------------------------------------- |
| GitHub repo      | `novtony3/fretwire` (public), default branch `main`               |
| Vercel team      | `nov-tonys-projects` (the novtony3 account)                       |
| Vercel project   | `fretwire`                                                         |
| Production URL    | https://fretwire.vercel.app                                       |
| Git auto-deploy  | Connected — every push to `main` builds a production deploy        |
| Store (KV)       | Upstash for Redis — integration `upstash/upstash-kv`, resource `upstash-kv-cyclamen-crystal` |
| Payments mode    | `mock` (default — no `PAYMENTS_MODE` set yet)                      |

## Production env vars

Set on the Vercel project (Production). Pull locally with
`vercel env pull --scope nov-tonys-projects`.

| Var                                                   | Source                | Why                                                        |
| ----------------------------------------------------- | --------------------- | ---------------------------------------------------------- |
| `KV_REST_API_URL` / `KV_REST_API_TOKEN` (+ `KV_URL`, `REDIS_URL`, `KV_REST_API_READ_ONLY_TOKEN`) | Upstash integration   | `getStore()` switches to `RedisStore` when these exist     |
| `NEXT_PUBLIC_SITE_URL = https://fretwire.vercel.app`  | set manually          | Canonical URL **and** the IPN self-callback host (see gotcha) |

Not set yet (only needed to talk to the **real** gateway): `PAYMENTS_MODE=http`,
`NEXTPAYMENTS_API_URL`, `NEXTPAYMENTS_PUBLIC_KEY`, `NEXTPAYMENTS_PRIVATE_KEY`,
`NEXTPAYMENTS_IPN_SECRET`.

## Done

- [x] Local verification green: `pnpm typecheck && pnpm lint && pnpm test && pnpm build`.
- [x] Repo synced to `novtony3/fretwire`; `.vercel/` gitignored.
- [x] Vercel project `fretwire` created under team `nov-tonys-projects` and linked
      to the GitHub repo (auto-deploy on push to `main`).
- [x] Production deployed and aliased to https://fretwire.vercel.app.
- [x] Upstash for Redis (Vercel KV) provisioned and connected → KV env injected.
- [x] `NEXT_PUBLIC_SITE_URL` set so the mock IPN callback hits a public host.
- [x] End-to-end order flow verified on production: `POST /api/checkout` →
      `POST /api/orders/{id}/simulate` → `GET /api/orders/{id}/status` reaches
      `paid` (with `transactionHash` + `paidAt`).

## Gotcha — IPN callback vs Deployment Protection

**Deployment Protection is ON** for the team, so the per-deployment host
(`VERCEL_URL`, e.g. `fretwire-<hash>-nov-tonys-projects.vercel.app`) returns
**401**. The mock IPN delivers to `env.appUrl`, which prefers
`NEXT_PUBLIC_SITE_URL` over `VERCEL_URL` (`src/lib/env.ts`). Without
`NEXT_PUBLIC_SITE_URL`, the self-callback targets the protected host, the IPN
never lands, and orders stay `pending` **even with KV present**. Keep
`NEXT_PUBLIC_SITE_URL` set to a public alias. The same applies to a real gateway:
its `ipnUrl` must be a public host, not the protected deployment URL.

## Operating notes

- **Pushing** to `novtony3/fretwire` needs the novtony3 gh account active:
  `gh auth switch --user novtony3` (the `tonydisco` account gets a 403).
- **Manual deploy:** `vercel deploy --prod --yes --scope nov-tonys-projects`.
  `NEXT_PUBLIC_*` vars are inlined at build time, so **redeploy after changing them**.
- **Inspect env:** `vercel env ls production --scope nov-tonys-projects`.

## Live gateway (http mode) — status & blockers

Attempted 2026-06-20 against **vnpayment.xyz** (account `novtony3@gmail.com`).

**Done & verified working (from a normal/residential IP):**

- Created an `api`-type integration **`fretwire`** in the dashboard, ipnUrl
  `https://fretwire.vercel.app/api/ipn`. Captured Client ID (publicKey) + Client
  Secret (privateKey). The completed view does **not** surface the `ipnSecret`.
- Gateway origin is **`https://api.vnpayment.xyz`** (the UI's `api.nextpayments.io`
  is a placeholder). HMAC signing (`sign.ts`) is correct — `GET /api/orders`
  returns `{success:true}` and `POST /api/orders` returns a real pay-to address.
- **Order contract correction:** `externalOrderId` is **required and must be a
  positive int32 integer** (a UUID string → `VALIDATION`; an oversized value like
  `Date.now()` ms → `500`). Fixed in `checkout/route.ts` (numeric id, keyed as a
  string locally). Accepted pairs: **USDT/ERC20**, **ETH/ETH** (ETH/ERC20 →
  `ORER002`). Error codes seen: `ORER001` amount, `ORER002` coin, `APER003` nonce.
- `NEXTPAYMENTS_{API_URL,PUBLIC_KEY,PRIVATE_KEY}` set on Vercel (Production).

**Blockers preventing http mode on Vercel (production currently reverted to `mock`):**

1. **Cloudflare blocks Vercel egress.** `api.vnpayment.xyz` sits behind Cloudflare.
   The identical signed request succeeds from a residential IP (200) but returns
   **`403` (empty body)** from Vercel's serverless (datacenter) IPs. The gateway
   must allow Vercel's egress IPs (or disable bot/datacenter blocking for `/api/*`),
   or the merchant must run from an allowed IP / via a proxy.
2. **Nonce watermark.** Live probing pushed the per-publicKey nonce to ~1.78e12;
   the app's Redis `INCR` starts low → `APER003`. Before going live, seed the
   Redis nonce key for this publicKey above the last-used value.
3. **No `ipnSecret`** captured → inbound IPNs won't verify (the doc also flags the
   IPN scheme may differ). Status still advances via **reconciliation** (the
   status route calls `GET /api/orders/:id` in http mode), so IPN is non-blocking.

**To enable http once #1 is resolved:** set `PAYMENTS_MODE=http` (env is staged),
seed the nonce (#2), redeploy, and re-test checkout on `fretwire.vercel.app`.

## TODO / next steps

- [ ] **Unblock http:** gateway-side — allow Vercel egress IPs through Cloudflare
      for `/api/*`; then flip `PAYMENTS_MODE=http`, seed the nonce, redeploy.
- [ ] Obtain the integration **`ipnSecret`** (recreate via the API to capture it)
      and set `NEXTPAYMENTS_IPN_SECRET` if inbound IPN verification is wanted.
- [ ] **Custom domain:** add it in Vercel and point `NEXT_PUBLIC_SITE_URL` at it
      (updates canonical SEO + IPN host).
- [ ] Optionally extend `NEXT_PUBLIC_SITE_URL` to Preview/Development, or relax
      Deployment Protection if preview deployments need to self-call the IPN.
