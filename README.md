# NextPayments Shop Demo

A standalone Next.js e-commerce demo that takes **crypto payment** through the
NextPayments gateway, integrating as a third-party merchant (the `api`
integration type). It runs fully offline in **mock mode**, and switches to the
real gateway by flipping one env var.

## What it shows

- **Storefront** — catalog with categories + search, product pages, a cart, and
  checkout.
- **Crypto payment** — checkout creates an order (an on-chain invoice with a
  pay-to address, amount, and expiry), shows a QR + countdown, and confirms via
  an **IPN** callback. Order status is then tracked to a receipt page.
- **Isolated integration** — all gateway logic lives behind one
  `NextPaymentsClient` (`src/lib/payments/`) with two implementations:
  - `MockClient` — deterministic invoice + a self-delivered, signed IPN so the
    whole flow works with no backend and no public URL.
  - `HttpClient` — the real gateway: HMAC-signed `POST /api/orders` /
    `GET /api/orders/:id`.

## Run (mock mode — default)

Requires **Node 22**.

```bash
pnpm install
pnpm db:seed     # seed the SQLite catalog (creates shop.db)
pnpm dev         # http://localhost:3000
```

Add something to the cart → checkout → on the payment page click **“Simulate
payment (mock)”**. The mock signs an `invoicePaid` IPN and POSTs it to
`/api/ipn`; the page polls status and advances to the receipt.

## Switch to the real gateway

Create `.env.local` (gitignored — **never commit it**):

```
PAYMENTS_MODE=http
NEXTPAYMENTS_API_URL=https://<gateway-host>
NEXTPAYMENTS_PUBLIC_KEY=<ApiKey.publicKey>
NEXTPAYMENTS_PRIVATE_KEY=<ApiKey.privateKey>   # server-only secret
NEXTPAYMENTS_IPN_SECRET=<integration.ipnSecret>
APP_URL=https://<this-shop-public-url>
```

The gateway must be able to **POST the IPN to your `APP_URL`/api/ipn**, so for
local testing expose the shop with a tunnel (e.g. `ngrok http 3000`) and set
`APP_URL` to the public tunnel URL.

> **Security:** the private key is a secret — keep it only in `.env.local`. If a
> key was ever shared in plaintext, rotate it.

## Integration contract

- **Order signing** (`src/lib/payments/sign.ts`):
  `message = ${timestamp}.${nonce}.${METHOD}.${path}.${rawBody}`,
  `X-Signature = HMAC_SHA512(privateKey, message)`, headers `X-API-Key`,
  `X-Nonce`, `X-Timestamp`, `X-Signature`. The exact signed `rawBody` is sent on
  the wire; `nonce` is strictly increasing per publicKey (SQLite-backed).
- **IPN** (`src/lib/payments/ipn.ts`): `X-NP-Signature = HMAC_SHA512(ipnSecret,
${timestamp}.${deliveryId}.${rawBody})`; verification enforces a ±300s
  freshness window, constant-time comparison, and idempotency by delivery id.
  This is the demo's designed scheme — adjust `signIpn`/`verifyIpnSignature` if
  the live gateway differs.

## Scripts

| Script           | Purpose                         |
| ---------------- | ------------------------------- |
| `pnpm dev`       | Dev server                      |
| `pnpm build`     | Production build                |
| `pnpm db:seed`   | Seed the catalog into SQLite    |
| `pnpm test`      | Unit tests (sign / IPN / repos) |
| `pnpm typecheck` | `tsc --noEmit`                  |
| `pnpm lint`      | ESLint                          |

## Layout

```
src/app/         routes — storefront, payment page, order tracking, /api/*
src/components/  storefront + payment UI (cart context, QR, countdown, …)
src/lib/payments/ NextPaymentsClient (mock|http), HMAC sign, IPN
src/lib/db/      SQLite (catalog, orders, nonce, IPN idempotency)
```

> Out of scope (it's an integration demo): accounts/auth, real inventory, admin,
> shipping, fiat conversion, a real wallet.
