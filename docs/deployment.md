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

## TODO / next steps

- [ ] **Real gateway:** onboard in the NextPayments dashboard, set the five
      `NEXTPAYMENTS_*` vars + `PAYMENTS_MODE=http`, register
      `ipnUrl = https://fretwire.vercel.app/api/ipn`, then redeploy.
- [ ] **Custom domain:** add it in Vercel and point `NEXT_PUBLIC_SITE_URL` at it
      (updates canonical SEO + IPN host).
- [ ] Optionally extend `NEXT_PUBLIC_SITE_URL` to Preview/Development, or relax
      Deployment Protection if preview deployments need to self-call the IPN.
