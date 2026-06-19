# NextPayments integration

How this shop talks to the NextPayments gateway (`crypto-payment-be`). All of it
lives behind `src/lib/payments/` so the storefront never knows the wire details.

## Roles

- **Gateway** — NextPayments backend; creates invoices, watches the chain, sends
  IPNs.
- **Merchant server** — this app's route handlers (`src/app/api/*`); the only
  place that signs/holds the API keys.
- **Customer** — pays on-chain to the invoice address.

## Onboarding (one-time, in the gateway dashboard)

1. Create an integration with an `ipnUrl` → returns `ipnSecret` (shown once).
2. Mint an API key → returns `publicKey` + `privateKey` (shown once).
3. Put them in env (never commit):
   `NEXTPAYMENTS_PUBLIC_KEY`, `NEXTPAYMENTS_PRIVATE_KEY`, `NEXTPAYMENTS_IPN_SECRET`,
   `NEXTPAYMENTS_API_URL`, plus `PAYMENTS_MODE=http`.

## Order creation — `POST /api/orders` (HMAC, server-to-server)

Implemented in `HttpClient.createOrder` via `signRequest` (`src/lib/payments/sign.ts`).

```
rawBody   = body ? JSON.stringify(body) : ''        # send this EXACT string
timestamp = floor(Date.now()/1000)                  # UNIX seconds, ±300s window
nonce     = strictly increasing per publicKey        # Redis INCR (store)
path      = '/api/orders'                             # req.originalUrl, no query
message   = `${timestamp}.${nonce}.${METHOD}.${path}.${rawBody}`
signature = HMAC_SHA512(privateKey, message)          # hex
headers   = X-API-Key, X-Nonce, X-Timestamp, X-Signature, Content-Type: application/json
```

Body: `{ amount (>0, required), coin (required), network?, externalOrderId?,
description?, metadata?, expiresIn? (≤86400) }`.

Response (normalized by `parseGatewayOrder`): `{ orderId, address, memo?, amount,
coin, network, status, expiresAt }`. Errors: `ORER001` invalid amount ·
`ORER002` invalid coin · `ORER003` not found.

`HttpClient.getOrder(orderId)` uses the same signing with `GET /api/orders/<id>`
and an empty body, for reconciliation from the status route.

## IPN — gateway → `POST /api/ipn`

This shop's designed contract (`src/lib/payments/ipn.ts`). Adjust `signIpn` /
`verifyIpnSignature` here if the live gateway uses a different scheme.

```
Headers:
  X-NP-Event      invoicePaid | invoicePending | invoiceExpired | invoiceCancelled | ...
  X-NP-Timestamp  UNIX seconds (±300s freshness)
  X-NP-Id         unique delivery id (idempotency key)
  X-NP-Signature  HMAC_SHA512(ipnSecret, `${timestamp}.${deliveryId}.${rawBody}`) hex
Body: { event, orderId, externalOrderId, status, amount, coin, network,
        address, transactionHash?, paidAt?, expiresAt, createdAt }
```

`verifyIpnSignature` enforces: required headers → freshness window →
constant-time signature compare. The route then dedupes by `X-NP-Id`
(`store/ipn-delivery`), validates the body (`ipnPayloadSchema`), and advances the
order via `markStatus`. Bad/missing signature → `401`.

## Order lifecycle

`pending → paid | expired | cancelled`. The status route
(`/api/orders/[id]/status`) auto-expires past-deadline pending orders and, in
`http` mode, reconciles a pending order against `getOrder`.

## Mock vs real

- **mock** (default): `MockClient` returns a deterministic invoice and
  `emitMockPaidIpn` signs + POSTs an `invoicePaid` IPN to our own `/api/ipn`
  (target = `env.appUrl`, which uses `VERCEL_URL` on Vercel). The
  `/api/orders/[id]/simulate` route triggers it (mock only).
- **http**: real gateway calls. Needs the env above, and on serverless a shared
  store (Vercel KV) so the IPN and the status poll see the same order.

## Code map

| Concern                          | File                                                                          |
| -------------------------------- | ----------------------------------------------------------------------------- |
| HMAC signing                     | `src/lib/payments/sign.ts`                                                    |
| IPN sign/verify + payload schema | `src/lib/payments/ipn.ts`                                                     |
| Client interface + types         | `src/lib/payments/types.ts`                                                   |
| Mock / real clients + factory    | `src/lib/payments/{mock-client,http-client,client}.ts`                        |
| Store (orders/nonce/idempotency) | `src/lib/store/*`                                                             |
| Routes                           | `src/app/api/{checkout,ipn,orders/[id]/status,orders/[id]/simulate}/route.ts` |
