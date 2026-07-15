# Add Stellar (XLM) payment with live USD→coin conversion

**Date:** 2026-07-15
**Repo:** fretwire
**Status:** Approved (design)

## Summary

Add **Stellar (XLM)** as a checkout payment coin, and wire the backend's public
`GET /api/fund/convert-usd` endpoint so the order `amount` sent to the gateway is
the **real converted coin amount** (not the current 1:1 USD placeholder). The
checkout coin selector becomes **live** — it shows the estimated coin amount per
option, sourced from the same convert API.

This is **Approach A**: a server-side quote route feeds the selector, and the
order-creation route converts server-side before signing the HMAC order.

## Context / current state

- `priceCart` (`src/lib/checkout.ts`) returns the USD cart total; today the
  gateway `amount` is that USD total **verbatim** (demo simplification, comment:
  "1 unit ≈ $1"). Correct for USDT, **wrong for ETH** (1 ETH ≠ $1).
- Two hardcoded coin lists exist:
  - `COINS` in `src/app/checkout/page.tsx:16` (client selector: USDT, ETH).
  - `ACCEPTED_COINS` in `src/lib/payments/types.ts:65` (server: USDT·ERC20,
    ETH·ETH), consumed by `networkForCoin`.
- `checkoutInputSchema.coin` is `z.enum(['ETH','USDT'])`.
- Gateway order creation is HMAC-signed (`HttpClient.createOrder`); the amount is
  taken from `priced.total` in `POST /api/checkout`.
- `PAYMENTS_MODE` selects `MockClient` (offline, default local) vs `HttpClient`
  (real gateway). Order `transactionHash` and status come from the gateway.

### Verified facts

- `GET /api/fund/convert-usd` is **public — no HMAC required** (confirmed: 200 on
  a bare query). Two modes:
  - `?amount=<usd>` → `conversions[]` for all coins (USDT, ETH, XLM) with
    `priceUsd` and `amount`.
  - `?amount=<usd>&coin=<coin>&network=<network>` → single conversion.
- Response envelope:
  ```json
  { "success": true,
    "data": { "usd": 100,
      "conversions": [
        { "coin":"XLM","network":"XLM","name":"Stellar","priceUsd":0.1835,"amount":544.959... }
      ] } }
  ```
- Backend already refreshes prices (~Binance every 15s), so calling convert-usd
  frequently from the selector is acceptable.

## Scope decisions

1. **Convert all coins** (USDT, ETH, XLM) via convert-usd — fixes the ETH 1:1 bug
   as part of this work. XLM is just one entry in the returned list.
2. **Live selector** — the checkout page shows the estimated coin amount per
   option, rendered from the convert API list (no hardcoded client list).
3. **http mode only** — the convert flow and XLM are active only when
   `PAYMENTS_MODE=http`. **Mock mode is unchanged**: legacy static list
   (USDT, ETH), 1:1 amount, no XLM. This preserves existing mock tests and keeps
   local dev working without gateway keys.
4. **Server-trusted** — the cart is always priced server-side from the catalog;
   the client never supplies the USD total or the coin's network. The server
   derives `network` from `ACCEPTED_COINS`.
5. **No silent fallback** — a convert failure surfaces as an error, never a
   guessed rate.

## Architecture / data flow

### A. Live quote (selector)

1. Checkout page `POST /api/checkout/quote` with `{ items }` on load and whenever
   the cart changes.
2. Server prices the cart (`priceCart`) → `usd`.
   - **http:** `convertUsd(usd)` → `GET convert-usd?amount=<usd>` →
     `{ mode:'http', usd, conversions: [...] }` (includes XLM).
   - **mock:** returns `{ mode:'mock', usd, conversions:
     [ {coin:'USDT',network:'ERC20',name:'Tether',priceUsd:1,amount:usd},
       {coin:'ETH', network:'ETH', name:'Ethereum',priceUsd:null,amount:usd} ] }`
     (legacy 1:1, no XLM, no live rate).
3. Client renders `<Select>` from `conversions`. Option label:
   `"{name} ({coin}·{network}) — ≈ {roundedAmount} {coin}"`. Selected value =
   `coin`.

### B. Order creation

4. `POST /api/checkout` `{ items, email, coin }`.
5. Validate `coin ∈ ACCEPTED_COINS`; derive `network = networkForCoin(coin)`.
6. Price cart → `usd`.
   - **http:** `convertUsd(usd, coin, network)` → authoritative `amount` =
     `conversions[0].amount`. `createOrder({ amount, coin, network, externalOrderId })`.
   - **mock:** `amount = usd` (1:1), as today.
7. Return `{ orderId, payUrl }`.

Downstream (`pay-panel`, order/success pages) already render `{amount} {coin}` —
XLM displays correctly with no change.

## Components

### `src/lib/payments/convert.ts` (new)

Single source for both routes.

```
convertUsd(usd: number, coin?: string, network?: string): Promise<Conversion[]>
```

- Reads `apiUrl` from `getPaymentsConfig()` (so a `/dev/config` override applies).
- `GET ${apiUrl}/api/fund/convert-usd?amount=<usd>[&coin&network]`, no auth header.
- Zod-validate the envelope; throw on `success:false`, HTTP error, empty
  `conversions`, or (when `coin` given) a missing/mismatched coin.
- Returns the `conversions` array.

Types:
```
type Conversion = { coin: string; network: string; name: string;
                    priceUsd: number; amount: number };
```

### `src/app/api/checkout/quote/route.ts` (new)

- `POST { items }` → validate with the cart-items schema → `priceCart`.
- If `priceCart` is null → `400 {error:'unknown_product'}`.
- Branch on `getPaymentsConfig().mode`:
  - http → `convertUsd(usd)`.
  - mock → legacy static list (above).
- Success → `{ mode, usd, conversions }`.
- Convert error → `502 {error:'quote_failed'}`.

### `src/lib/payments/types.ts` (edit)

Add to `ACCEPTED_COINS`:
```
{ coin: 'XLM', network: 'XLM', label: 'Stellar (XLM)' }
```
`networkForCoin('XLM')` then returns `'XLM'`.

### `src/lib/checkout.ts` (edit)

`coin` enum → `z.enum(['ETH','USDT','XLM'])`.

### `src/app/api/checkout/route.ts` (edit)

- Validate `coin ∈ ACCEPTED_COINS`; derive `network` server-side.
- http mode: `convertUsd(usd, coin, network)` → converted amount → `createOrder`.
- mock mode: unchanged (1:1).
- Convert error → `502 {error:'conversion_failed'}`.

### `src/app/checkout/page.tsx` (edit)

- Remove the hardcoded `COINS` array.
- On mount / cart change, `POST /api/checkout/quote`; hold `conversions` in state.
- Render the selector from `conversions` with the estimated amount label.
- On failure: show "Không tải được tỷ giá — thử lại" and disable the pay button.
- Submit sends `{ items, email, coin }` (no network).

## Error handling

| Case | Response | UI |
|------|----------|-----|
| Quote convert fails / no network | `502 quote_failed` | message + pay disabled |
| Order convert fails / coin missing in response | `502 conversion_failed` | toast |
| Coin not in `ACCEPTED_COINS` | `400 invalid_request` | toast |
| Unknown product slug | `400 unknown_product` | toast |

No silent rate fallback anywhere.

## Precision & rate freshness

- The order `amount` is the convert-usd `amount` **verbatim** (authoritative
  float the gateway accepts). Round only for display (XLM: a few decimals).
- Selector estimate vs order-time amount may differ slightly as prices move; the
  order-time conversion is authoritative and the gateway locks the rate at
  invoice creation. This is expected and not an error.

## Testing

- **Unit `convert.ts`:** parse a valid envelope; throw on `success:false`, HTTP
  error, empty conversions, missing requested coin. (mock `fetch`.)
- **Unit quote route:** mock branch returns legacy list (no XLM); http branch
  returns `convertUsd` result; convert error → 502.
- **Unit checkout route (http):** stub `convertUsd` → assert `createOrder`
  receives the converted amount, coin, and server-derived network.
- **Regression:** existing mock-path tests unchanged (mock branch untouched).
- **Manual E2E:** set `PAYMENTS_MODE=http` with real keys, checkout XLM, confirm
  order amount ≈ `convert-usd?amount=<usd>&coin=XLM&network=XLM`.
- Gate: `pnpm typecheck && pnpm lint && pnpm test && pnpm build`.

## Out of scope

- Real on-chain `transactionHash` display / explorer links (separate task).
- XLM support in mock mode.
- Changing the IPN scheme.
- Multi-network coins (each coin here maps to exactly one network).
