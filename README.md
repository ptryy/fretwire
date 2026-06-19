# Fretwire — guitar shop demo

A standalone Next.js storefront selling guitars (electric, acoustic, classical,
bass) that takes **crypto payment** through the NextPayments gateway as a
third-party `api` merchant. Runs fully offline in **mock mode**; switches to the
real gateway with one env var. Designed in the "Signal Chain" visual system
(warm-dark + amber, Bricolage display + Geist, Lucide icons — no emoji).

## What it shows

- **Storefront** — catalog with category filter + search, product detail with a
  mono spec strip, cart, and checkout.
- **Crypto payment** — checkout creates an on-chain invoice (pay-to address,
  amount, expiry), renders a QR + countdown, and confirms via a signed **IPN**;
  the order is then tracked to a receipt.
- **Swappable integration** — `src/lib/payments/` exposes one `NextPaymentsClient`
  with `MockClient` (offline, self-delivered signed IPN) and `HttpClient` (real
  HMAC), chosen by `PAYMENTS_MODE`.
- **Serverless-ready storage** — catalog is a static module; orders / nonce /
  IPN-idempotency go through a `Store` interface: in-memory locally, **Upstash
  Redis (Vercel KV)** in production.

## Run (mock mode — default)

Requires **Node 22**.

```bash
pnpm install
pnpm dev          # http://localhost:3000
```

Add a guitar → checkout → on the payment page click **“Simulate payment
(mock)”**. The mock signs an `invoicePaid` IPN to `/api/ipn`; the page polls and
advances to the receipt. No database or external service needed locally.

## Deploy to Vercel

1. Push to GitHub and import the repo in Vercel (framework auto-detected).
2. Add **Vercel KV** (Upstash Redis) from the Storage tab — it injects
   `KV_REST_API_URL` / `KV_REST_API_TOKEN` (or `UPSTASH_REDIS_REST_URL` /
   `UPSTASH_REDIS_REST_TOKEN`). The app uses Redis automatically when present, so
   the order flow persists across serverless invocations.
3. To talk to the **real gateway**, set in Project → Settings → Environment
   Variables:

```
PAYMENTS_MODE=http
NEXTPAYMENTS_API_URL=https://<gateway-host>
NEXTPAYMENTS_PUBLIC_KEY=<ApiKey.publicKey>
NEXTPAYMENTS_PRIVATE_KEY=<ApiKey.privateKey>   # secret
NEXTPAYMENTS_IPN_SECRET=<integration.ipnSecret>
NEXT_PUBLIC_SITE_URL=https://<your-domain>     # canonical URL for SEO + IPN callback
```

For real IPN, the gateway must reach your public URL (Vercel provides one).

> **Security:** the private key is a secret — keep it only in env vars, never in
> git. Rotate it if it has ever been shared in plaintext.

## Integration contract

- **Order signing** (`src/lib/payments/sign.ts`):
  `message = ${timestamp}.${nonce}.${METHOD}.${path}.${rawBody}`,
  `X-Signature = HMAC_SHA512(privateKey, message)`, headers `X-API-Key`,
  `X-Nonce`, `X-Timestamp`, `X-Signature`. The exact signed `rawBody` is sent;
  `nonce` is strictly increasing per publicKey (Redis `INCR`).
- **IPN** (`src/lib/payments/ipn.ts`):
  `X-NP-Signature = HMAC_SHA512(ipnSecret, ${timestamp}.${deliveryId}.${rawBody})`;
  verification enforces a ±300s window, constant-time comparison, and
  idempotency by delivery id. This is the demo's designed scheme — adjust
  `signIpn` / `verifyIpnSignature` if the live gateway differs.

## SEO

Per-route `metadata` (titles, descriptions, canonical, OpenGraph/Twitter), a
generated `opengraph-image`, an SVG favicon (`app/icon.svg`), `sitemap.ts`, and
`robots.ts` (transactional routes are `noindex`). Product pages are statically
generated.

## Scripts

| Script           | Purpose                         |
| ---------------- | ------------------------------- |
| `pnpm dev`       | Dev server                      |
| `pnpm build`     | Production build                |
| `pnpm test`      | Unit tests (sign / IPN / store) |
| `pnpm typecheck` | `tsc --noEmit`                  |
| `pnpm lint`      | ESLint                          |

## Layout

```
src/app/          routes — storefront, payment page, order tracking, /api/*, SEO files
src/components/    UI system (ui/*), brand (logo, fret-rail, guitar-art), feature components
src/lib/catalog/   static guitar catalog
src/lib/payments/  NextPaymentsClient (mock|http), HMAC sign, IPN
src/lib/store/     Store interface — memory (local) | Upstash Redis (prod)
```
