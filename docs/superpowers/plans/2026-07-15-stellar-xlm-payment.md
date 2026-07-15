# Stellar (XLM) Payment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Stellar (XLM) as a checkout coin and make the gateway order `amount` the real USD→coin conversion (from the backend's public `convert-usd` API), with a live coin selector.

**Architecture:** A new server module `convert.ts` wraps the public `GET /api/fund/convert-usd` endpoint and exposes two mode-aware helpers. A new `/api/checkout/quote` route feeds the live selector; the existing `/api/checkout` route converts server-side before signing the HMAC order. All conversion is **http-mode only** — mock mode keeps its legacy 1:1 behavior and does not offer XLM.

**Tech Stack:** Next.js 15 (App Router, TS strict), zod, vitest (node env, `@`→`src` alias). pnpm, Node 22.

## Global Constraints

- TS strict, no `any`. Validation via `zod`.
- Server-only modules import `'server-only'`.
- Conversion runs **only** when `PAYMENTS_MODE=http` (resolved via `getPaymentsConfig()`, which layers the `/dev/config` Store override over env). Mock mode: unchanged, 1:1, no XLM.
- Cart is always priced server-side (`priceCart`); the client never supplies the USD total or the coin's network. Server derives `network` from `ACCEPTED_COINS` via `networkForCoin`.
- No silent rate fallback — a convert failure is surfaced as an error.
- `convert-usd` is **public — no HMAC / auth header**.
- The order `amount` is the convert-usd `amount` verbatim; round only for display.
- Tests live in `test/**/*.test.ts`. Run all: `pnpm test`. Run one file: `pnpm exec vitest run test/<file>.test.ts`.
- Final gate before "done": `pnpm typecheck && pnpm lint && pnpm test && pnpm build`.
- Commit message trailer on every commit:
  `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`
- Work on branch `feat/stellar-xlm-payment` (already created).

---

## File Structure

- **Create** `src/lib/payments/convert.ts` — convert-usd client + mode-aware helpers. One responsibility: turn a USD amount into coin conversions / an order amount.
- **Create** `src/app/api/checkout/quote/route.ts` — POST cart → priced USD → conversions list for the selector.
- **Create** `test/convert.test.ts` — unit tests for `convert.ts`.
- **Create** `test/checkout-route.test.ts` — unit tests for the quote + checkout routes.
- **Modify** `src/lib/payments/types.ts` — add XLM to `ACCEPTED_COINS`.
- **Modify** `src/lib/checkout.ts` — extract `cartItemsSchema`; add `'XLM'` to the coin enum.
- **Modify** `src/app/api/checkout/route.ts` — convert server-side (http mode) before `createOrder`; derive/validate network.
- **Modify** `src/app/checkout/page.tsx` — remove hardcoded coin list; fetch the live quote; render live options.

---

## Task 1: `convert.ts` — `convertUsd` (convert-usd client)

**Files:**
- Create: `src/lib/payments/convert.ts`
- Test: `test/convert.test.ts`

**Interfaces:**
- Consumes: `getPaymentsConfig()` from `src/lib/payments/config.ts` (returns `{ mode, apiUrl, ... }`); `getStore()` from `src/lib/store` (tests set `apiUrl` via `setConfig`).
- Produces:
  - `type Conversion = { coin: string; network: string; name: string; priceUsd: number; amount: number }`
  - `async function convertUsd(usd: number, coin?: string, network?: string): Promise<Conversion[]>` — returns all conversions when `coin` omitted; a single-element array (the matched coin) when `coin` given. Throws on HTTP error, `success:false`, empty list, or missing requested coin.

- [ ] **Step 1: Write the failing test**

Create `test/convert.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from 'vitest';

import { convertUsd } from '@/lib/payments/convert';
import { getStore } from '@/lib/store';

function mockFetchOnce(body: unknown, ok = true, status = 200) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({ ok, status, json: async () => body }),
  );
}

afterEach(async () => {
  vi.unstubAllGlobals();
  await getStore().clearConfig();
});

describe('convertUsd', () => {
  it('returns all conversions when no coin is given', async () => {
    await getStore().setConfig({ apiUrl: 'https://gw.test' });
    mockFetchOnce({
      success: true,
      data: {
        usd: 25,
        conversions: [
          { coin: 'USDT', network: 'ERC20', name: 'Tether', priceUsd: 1, amount: 25 },
          { coin: 'XLM', network: 'XLM', name: 'Stellar', priceUsd: 0.1833, amount: 136.4 },
        ],
      },
    });
    const out = await convertUsd(25);
    expect(out).toHaveLength(2);
    expect(out[1].coin).toBe('XLM');
  });

  it('returns only the requested coin when coin is given', async () => {
    await getStore().setConfig({ apiUrl: 'https://gw.test' });
    mockFetchOnce({
      success: true,
      data: {
        usd: 100,
        conversions: [
          { coin: 'XLM', network: 'XLM', name: 'Stellar', priceUsd: 0.1835, amount: 544.96 },
        ],
      },
    });
    const out = await convertUsd(100, 'XLM', 'XLM');
    expect(out).toHaveLength(1);
    expect(out[0].amount).toBeCloseTo(544.96);
  });

  it('throws on a non-2xx response', async () => {
    await getStore().setConfig({ apiUrl: 'https://gw.test' });
    mockFetchOnce({ success: false }, false, 500);
    await expect(convertUsd(10)).rejects.toThrow();
  });

  it('throws when success is false', async () => {
    await getStore().setConfig({ apiUrl: 'https://gw.test' });
    mockFetchOnce({ success: false });
    await expect(convertUsd(10)).rejects.toThrow();
  });

  it('throws when the requested coin is absent', async () => {
    await getStore().setConfig({ apiUrl: 'https://gw.test' });
    mockFetchOnce({
      success: true,
      data: { usd: 10, conversions: [{ coin: 'ETH', network: 'ETH', name: 'Ethereum', priceUsd: 1877, amount: 0.005 }] },
    });
    await expect(convertUsd(10, 'XLM', 'XLM')).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm exec vitest run test/convert.test.ts`
Expected: FAIL — `Cannot find module '@/lib/payments/convert'`.

- [ ] **Step 3: Write the minimal implementation**

Create `src/lib/payments/convert.ts`:

```ts
import 'server-only';

import { z } from 'zod';

import { getPaymentsConfig } from './config';

export type Conversion = {
  coin: string;
  network: string;
  name: string;
  priceUsd: number;
  amount: number;
};

const conversionSchema = z.object({
  coin: z.string(),
  network: z.string(),
  name: z.string(),
  priceUsd: z.number(),
  amount: z.number(),
});

const payloadSchema = z.object({
  success: z.boolean(),
  data: z.object({ usd: z.number(), conversions: z.array(conversionSchema) }).optional(),
});

/**
 * Call the gateway's public `GET /api/fund/convert-usd` (no auth). With `coin`
 * omitted, returns every supported coin's conversion; with `coin` given, returns
 * a single-element array for that coin. Throws on transport/HTTP error, a
 * `success:false` envelope, an empty list, or a missing requested coin.
 */
export async function convertUsd(
  usd: number,
  coin?: string,
  network?: string,
): Promise<Conversion[]> {
  const { apiUrl } = await getPaymentsConfig();
  const params = new URLSearchParams({ amount: String(usd) });
  if (coin) params.set('coin', coin);
  if (network) params.set('network', network);

  const res = await fetch(`${apiUrl}/api/fund/convert-usd?${params.toString()}`, {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });
  const json: unknown = await res.json().catch(() => ({}));
  const parsed = payloadSchema.safeParse(json);
  if (!res.ok || !parsed.success || !parsed.data.success || !parsed.data.data) {
    throw new Error(`convert-usd failed [${res.status}]`);
  }

  const { conversions } = parsed.data.data;
  if (conversions.length === 0) {
    throw new Error('convert-usd returned no conversions');
  }
  if (coin) {
    const match = conversions.find((c) => c.coin === coin);
    if (!match) throw new Error(`convert-usd missing coin ${coin}`);
    return [match];
  }
  return conversions;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm exec vitest run test/convert.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/payments/convert.ts test/convert.test.ts
git commit -m "feat(payments): convertUsd client for the public convert-usd API

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: `convert.ts` — `quoteConversions` + `resolveOrderAmount` (mode-aware helpers)

**Files:**
- Modify: `src/lib/payments/convert.ts`
- Test: `test/convert.test.ts` (append)

**Interfaces:**
- Consumes: `convertUsd` (Task 1); `getPaymentsConfig()` (`{ mode }`); `PaymentsMode` from `src/lib/payments/types.ts`.
- Produces:
  - `async function quoteConversions(usd: number): Promise<{ mode: PaymentsMode; conversions: Conversion[] }>` — http: `convertUsd(usd)`; mock: legacy static list `[USDT·ERC20, ETH·ETH]` at 1:1, no XLM.
  - `async function resolveOrderAmount(usd: number, coin: string, network: string): Promise<number>` — http: `convertUsd(usd, coin, network)[0].amount`; mock: `usd`.

- [ ] **Step 1: Write the failing test**

Append to `test/convert.test.ts`:

```ts
import { quoteConversions, resolveOrderAmount } from '@/lib/payments/convert';

describe('quoteConversions', () => {
  it('returns the legacy 1:1 list (no XLM) in mock mode', async () => {
    const { mode, conversions } = await quoteConversions(50);
    expect(mode).toBe('mock');
    expect(conversions.map((c) => c.coin)).toEqual(['USDT', 'ETH']);
    expect(conversions.every((c) => c.amount === 50)).toBe(true);
  });

  it('returns live conversions in http mode', async () => {
    await getStore().setConfig({ mode: 'http', apiUrl: 'https://gw.test' });
    mockFetchOnce({
      success: true,
      data: {
        usd: 50,
        conversions: [{ coin: 'XLM', network: 'XLM', name: 'Stellar', priceUsd: 0.18, amount: 277.7 }],
      },
    });
    const { mode, conversions } = await quoteConversions(50);
    expect(mode).toBe('http');
    expect(conversions[0].coin).toBe('XLM');
  });
});

describe('resolveOrderAmount', () => {
  it('returns the USD amount unchanged in mock mode', async () => {
    expect(await resolveOrderAmount(100, 'USDT', 'ERC20')).toBe(100);
  });

  it('returns the converted coin amount in http mode', async () => {
    await getStore().setConfig({ mode: 'http', apiUrl: 'https://gw.test' });
    mockFetchOnce({
      success: true,
      data: {
        usd: 100,
        conversions: [{ coin: 'XLM', network: 'XLM', name: 'Stellar', priceUsd: 0.1835, amount: 544.96 }],
      },
    });
    expect(await resolveOrderAmount(100, 'XLM', 'XLM')).toBeCloseTo(544.96);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm exec vitest run test/convert.test.ts`
Expected: FAIL — `quoteConversions`/`resolveOrderAmount` are not exported.

- [ ] **Step 3: Write the minimal implementation**

Append to `src/lib/payments/convert.ts` (and add `PaymentsMode` to the existing type import from `./types` — there is currently no such import, so add `import type { PaymentsMode } from './types';` near the top):

```ts
/** Legacy mock list: 1:1 USD, no live rate, no XLM (mock mode is a simplification). */
function mockConversions(usd: number): Conversion[] {
  return [
    { coin: 'USDT', network: 'ERC20', name: 'Tether', priceUsd: 1, amount: usd },
    { coin: 'ETH', network: 'ETH', name: 'Ethereum', priceUsd: 1, amount: usd },
  ];
}

/** Conversions for the checkout selector. http: live; mock: legacy static list. */
export async function quoteConversions(
  usd: number,
): Promise<{ mode: PaymentsMode; conversions: Conversion[] }> {
  const { mode } = await getPaymentsConfig();
  if (mode === 'http') return { mode, conversions: await convertUsd(usd) };
  return { mode, conversions: mockConversions(usd) };
}

/** The order amount to send the gateway. http: converted coin amount; mock: USD 1:1. */
export async function resolveOrderAmount(
  usd: number,
  coin: string,
  network: string,
): Promise<number> {
  const { mode } = await getPaymentsConfig();
  if (mode === 'http') return (await convertUsd(usd, coin, network))[0].amount;
  return usd;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm exec vitest run test/convert.test.ts`
Expected: PASS (9 tests total).

- [ ] **Step 5: Commit**

```bash
git add src/lib/payments/convert.ts test/convert.test.ts
git commit -m "feat(payments): mode-aware quoteConversions and resolveOrderAmount

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Add XLM coin config + extract cart-items schema

**Files:**
- Modify: `src/lib/payments/types.ts:65` (`ACCEPTED_COINS`)
- Modify: `src/lib/checkout.ts` (`checkoutInputSchema`, add `cartItemsSchema`)
- Test: `test/convert.test.ts` (append a small config assertion) — or a new `test/coins.test.ts`. Use `test/coins.test.ts`.

**Interfaces:**
- Produces:
  - `networkForCoin('XLM') === 'XLM'`
  - `checkoutInputSchema` accepts `coin: 'XLM'`
  - `cartItemsSchema` — `z.object({ items: z.array({ slug, qty }).min(1) })`, reused by `checkoutInputSchema` and the quote route.

- [ ] **Step 1: Write the failing test**

Create `test/coins.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

import { cartItemsSchema, checkoutInputSchema } from '@/lib/checkout';
import { networkForCoin } from '@/lib/payments/types';

describe('coin config', () => {
  it('maps XLM to the XLM network', () => {
    expect(networkForCoin('XLM')).toBe('XLM');
  });

  it('accepts XLM as a checkout coin', () => {
    const parsed = checkoutInputSchema.safeParse({
      items: [{ slug: 'x', qty: 1 }],
      email: 'a@b.c',
      coin: 'XLM',
    });
    expect(parsed.success).toBe(true);
  });

  it('rejects an unknown coin', () => {
    const parsed = checkoutInputSchema.safeParse({
      items: [{ slug: 'x', qty: 1 }],
      email: 'a@b.c',
      coin: 'DOGE',
    });
    expect(parsed.success).toBe(false);
  });

  it('cartItemsSchema validates the items array', () => {
    expect(cartItemsSchema.safeParse({ items: [{ slug: 'x', qty: 2 }] }).success).toBe(true);
    expect(cartItemsSchema.safeParse({ items: [] }).success).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm exec vitest run test/coins.test.ts`
Expected: FAIL — `networkForCoin('XLM')` is `undefined` and `cartItemsSchema` is not exported.

- [ ] **Step 3: Write the minimal implementation**

In `src/lib/payments/types.ts`, extend `ACCEPTED_COINS`:

```ts
export const ACCEPTED_COINS = [
  { coin: 'ETH', network: 'ETH', label: 'Ethereum (ETH)' },
  { coin: 'USDT', network: 'ERC20', label: 'Tether (USDT · ERC20)' },
  { coin: 'XLM', network: 'XLM', label: 'Stellar (XLM)' },
] as const;
```

In `src/lib/checkout.ts`, replace the schema block:

```ts
/** Cart lines only — reused by the quote route and the full checkout schema. */
export const cartItemsSchema = z.object({
  items: z.array(z.object({ slug: z.string().min(1), qty: z.number().int().positive() })).min(1),
});

/** Checkout request body (cart lines + buyer email + chosen coin). */
export const checkoutInputSchema = cartItemsSchema.extend({
  email: z.string().email(),
  coin: z.enum(['ETH', 'USDT', 'XLM']),
});
```

(`priceCart` and `CheckoutInput` stay as-is; `CheckoutInput['items']` still resolves through the extended schema.)

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm exec vitest run test/coins.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/payments/types.ts src/lib/checkout.ts test/coins.test.ts
git commit -m "feat(payments): accept XLM coin and extract cartItemsSchema

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: `/api/checkout/quote` route (live selector source)

**Files:**
- Create: `src/app/api/checkout/quote/route.ts`
- Test: `test/checkout-route.test.ts`

**Interfaces:**
- Consumes: `cartItemsSchema`, `priceCart` (`src/lib/checkout.ts`); `quoteConversions` (Task 2).
- Produces: `POST` handler returning `{ mode, usd, conversions }` on success; `400 {error:'invalid_request'|'unknown_product'}`; `502 {error:'quote_failed'}`.
- Test note: use a **real catalog slug**. Get one with `grep -n "slug: '" src/lib/catalog/data.ts | head`. This plan uses `vesper-nova-s` (verify it still exists before writing the test).

- [ ] **Step 1: Write the failing test**

Create `test/checkout-route.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from 'vitest';

import { POST as quote } from '@/app/api/checkout/quote/route';
import { getStore } from '@/lib/store';

const SLUG = 'vesper-nova-s'; // a real catalog slug — verify in src/lib/catalog/data.ts

function post(body: unknown): Request {
  return new Request('http://test/api/checkout/quote', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

afterEach(async () => {
  vi.unstubAllGlobals();
  await getStore().clearConfig();
});

describe('POST /api/checkout/quote', () => {
  it('400s on an invalid body', async () => {
    const res = await quote(post({ items: [] }));
    expect(res.status).toBe(400);
  });

  it('returns the legacy list in mock mode', async () => {
    const res = await quote(post({ items: [{ slug: SLUG, qty: 1 }] }));
    expect(res.status).toBe(200);
    const json = (await res.json()) as { mode: string; conversions: { coin: string }[] };
    expect(json.mode).toBe('mock');
    expect(json.conversions.map((c) => c.coin)).toEqual(['USDT', 'ETH']);
  });

  it('returns live conversions in http mode', async () => {
    await getStore().setConfig({ mode: 'http', apiUrl: 'https://gw.test' });
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: {
            usd: 1,
            conversions: [{ coin: 'XLM', network: 'XLM', name: 'Stellar', priceUsd: 0.18, amount: 5.5 }],
          },
        }),
      }),
    );
    const res = await quote(post({ items: [{ slug: SLUG, qty: 1 }] }));
    const json = (await res.json()) as { mode: string; conversions: { coin: string }[] };
    expect(json.mode).toBe('http');
    expect(json.conversions[0].coin).toBe('XLM');
  });

  it('502s when the convert call fails in http mode', async () => {
    await getStore().setConfig({ mode: 'http', apiUrl: 'https://gw.test' });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500, json: async () => ({}) }));
    const res = await quote(post({ items: [{ slug: SLUG, qty: 1 }] }));
    expect(res.status).toBe(502);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm exec vitest run test/checkout-route.test.ts`
Expected: FAIL — `Cannot find module '@/app/api/checkout/quote/route'`.

- [ ] **Step 3: Write the minimal implementation**

Create `src/app/api/checkout/quote/route.ts`:

```ts
import { NextResponse } from 'next/server';

import { cartItemsSchema, priceCart } from '@/lib/checkout';
import { quoteConversions } from '@/lib/payments/convert';

/** Price the cart and return per-coin conversions for the checkout selector. */
export async function POST(req: Request): Promise<Response> {
  const body: unknown = await req.json().catch(() => null);
  const parsed = cartItemsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }
  const priced = priceCart(parsed.data.items);
  if (!priced) {
    return NextResponse.json({ error: 'unknown_product' }, { status: 400 });
  }
  try {
    const { mode, conversions } = await quoteConversions(priced.total);
    return NextResponse.json({ mode, usd: priced.total, conversions });
  } catch {
    return NextResponse.json({ error: 'quote_failed' }, { status: 502 });
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm exec vitest run test/checkout-route.test.ts`
Expected: PASS (4 tests). If the `SLUG` constant is not a real slug, the mock-mode test 400s — fix `SLUG` to a value from `src/lib/catalog/data.ts`.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/checkout/quote/route.ts test/checkout-route.test.ts
git commit -m "feat(checkout): quote route feeding the live coin selector

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: Convert server-side in `/api/checkout`

**Files:**
- Modify: `src/app/api/checkout/route.ts`
- Test: `test/checkout-route.test.ts` (append)

**Interfaces:**
- Consumes: `networkForCoin` (`src/lib/payments/types.ts`); `resolveOrderAmount` (Task 2); existing `checkoutInputSchema`, `priceCart`, `getClient`, `createLocalOrder`, `setGatewayFields`.
- Produces: `POST /api/checkout` now derives `network` server-side, converts the amount in http mode, and returns `{ orderId, payUrl }`. New failure: `502 {error:'conversion_failed'}` when the http conversion throws.
- Behavior: mock mode is unchanged (amount = USD, MockClient).

- [ ] **Step 1: Write the failing test**

Append to `test/checkout-route.test.ts`:

```ts
import { POST as checkout } from '@/app/api/checkout/route';

function checkoutPost(body: unknown): Request {
  return new Request('http://test/api/checkout', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/checkout', () => {
  it('creates an order in mock mode and returns a pay URL', async () => {
    const res = await checkout(
      checkoutPost({ items: [{ slug: SLUG, qty: 1 }], email: 'a@b.c', coin: 'USDT' }),
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as { payUrl?: string };
    expect(json.payUrl).toMatch(/^\/pay\//);
  });

  it('400s on an unknown product', async () => {
    const res = await checkout(
      checkoutPost({ items: [{ slug: 'not-a-real-slug', qty: 1 }], email: 'a@b.c', coin: 'USDT' }),
    );
    expect(res.status).toBe(400);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm exec vitest run test/checkout-route.test.ts`
Expected: FAIL on the first new test — the current route already returns a pay URL in mock mode, so this may PASS as-is; the second test also likely PASSES. If **both** pass before editing, that is expected (they are regression guards). Proceed to Step 3 to add conversion; the tests must still pass afterward. (If either fails, it flags a regression to fix.)

- [ ] **Step 3: Write the implementation**

Replace the body of `POST` in `src/app/api/checkout/route.ts`. Full new file:

```ts
import { NextResponse } from 'next/server';

import { checkoutInputSchema, priceCart } from '@/lib/checkout';
import { getClient } from '@/lib/payments/client';
import { resolveOrderAmount } from '@/lib/payments/convert';
import { networkForCoin } from '@/lib/payments/types';
import { createLocalOrder, setGatewayFields } from '@/lib/store/orders';

/**
 * The gateway requires `externalOrderId` as a positive **integer**. We key the
 * local store by its string form and send the numeric form to the gateway.
 */
function newExternalOrderId(): string {
  return String(Math.floor(Math.random() * 2_000_000_000) + 1);
}

/** Create an order: price the cart, convert to the coin, create the gateway invoice. */
export async function POST(req: Request): Promise<Response> {
  const body: unknown = await req.json().catch(() => null);
  const parsed = checkoutInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }
  const { items, email, coin } = parsed.data;

  // Server-derived network (never trust the client). Also rejects any coin not
  // in ACCEPTED_COINS.
  const network = networkForCoin(coin);
  if (!network) {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }

  const priced = priceCart(items);
  if (!priced) {
    return NextResponse.json({ error: 'unknown_product' }, { status: 400 });
  }

  // http mode: convert USD → coin amount; mock mode: 1:1.
  let amount: number;
  try {
    amount = await resolveOrderAmount(priced.total, coin, network);
  } catch {
    return NextResponse.json({ error: 'conversion_failed' }, { status: 502 });
  }

  const externalOrderId = newExternalOrderId();
  await createLocalOrder({
    externalOrderId,
    email,
    coin,
    network,
    amount: priced.total,
    cartJson: JSON.stringify(items),
  });

  try {
    const client = await getClient();
    const order = await client.createOrder({
      amount,
      coin,
      network,
      externalOrderId: Number(externalOrderId),
      description: `Shop order ${externalOrderId}`,
    });
    await setGatewayFields(externalOrderId, {
      npOrderId: order.orderId,
      address: order.address,
      memo: order.memo,
      amount: order.amount,
      coin: order.coin || coin,
      network: order.network ?? network,
      expiresAt: order.expiresAt,
      status: order.status,
    });
    return NextResponse.json({ orderId: externalOrderId, payUrl: `/pay/${externalOrderId}` });
  } catch (err) {
    return NextResponse.json({ error: 'gateway_error', message: String(err) }, { status: 502 });
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm exec vitest run test/checkout-route.test.ts`
Expected: PASS (all quote + checkout tests).

- [ ] **Step 5: Commit**

```bash
git add src/app/api/checkout/route.ts test/checkout-route.test.ts
git commit -m "feat(checkout): convert USD to coin amount server-side (http mode)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: Live coin selector on the checkout page

**Files:**
- Modify: `src/app/checkout/page.tsx`

**Interfaces:**
- Consumes: `POST /api/checkout/quote` → `{ mode, usd, conversions }`.
- Produces: selector rendered from the fetched `conversions`; submit sends `{ items, email, coin }` (no network). No unit test — this is a client component and the repo has no jsdom/testing-library setup. Verified by typecheck + build + manual check.

- [ ] **Step 1: Rewrite the page**

Replace `src/app/checkout/page.tsx` with:

```tsx
'use client';

import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { useCart } from '@/components/cart-provider';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { formatUsd } from '@/lib/format';

type Conversion = {
  coin: string;
  network: string;
  name: string;
  priceUsd: number;
  amount: number;
};

function formatCoinAmount(n: number): string {
  return n >= 1 ? n.toFixed(2) : n.toFixed(6);
}

export default function CheckoutPage() {
  const { items, total, clear } = useCart();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [conversions, setConversions] = useState<Conversion[]>([]);
  const [coin, setCoin] = useState('');
  const [quoteError, setQuoteError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [error, setError] = useState('');

  // Stable dependency: refetch only when the cart contents actually change.
  const cartKey = items.map((i) => `${i.slug}:${i.qty}`).join(',');

  useEffect(() => {
    if (items.length === 0) return;
    let cancelled = false;
    setQuoteError(false);
    fetch('/api/checkout/quote', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ items: items.map((i) => ({ slug: i.slug, qty: i.qty })) }),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('quote failed'))))
      .then((d: { conversions: Conversion[] }) => {
        if (cancelled) return;
        setConversions(d.conversions);
        setCoin((prev) => prev || d.conversions[0]?.coin || '');
      })
      .catch(() => {
        if (!cancelled) setQuoteError(true);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartKey]);

  if (items.length === 0 && !redirecting) {
    return (
      <main className="mx-auto flex max-w-2xl flex-col items-center gap-4 px-6 py-24 text-center">
        <h1 className="font-display text-2xl font-semibold">Nothing to check out</h1>
        <Link href="/products" className="text-[var(--color-amber)] hover:underline">
          Browse guitars
        </Link>
      </main>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          items: items.map((i) => ({ slug: i.slug, qty: i.qty })),
          email,
          coin,
        }),
      });
      const data = (await res.json()) as { payUrl?: string; error?: string };
      if (!res.ok || !data.payUrl) {
        setError(data.error ?? 'Checkout failed. Please try again.');
        return;
      }
      setRedirecting(true);
      clear();
      router.push(data.payUrl);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const noRates = conversions.length === 0;

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-12">
      <h1 className="font-display text-3xl font-semibold">Checkout</h1>

      <Card className="p-5">
        <h2 className="mb-3 text-sm font-semibold text-[var(--color-muted)]">Order summary</h2>
        <ul className="flex flex-col gap-2">
          {items.map((i) => (
            <li key={i.slug} className="flex justify-between text-sm">
              <span>
                {i.name} <span className="text-[var(--color-subtle)]">× {i.qty}</span>
              </span>
              <span className="font-mono">{formatUsd(i.price * i.qty)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex justify-between border-t border-[var(--color-border)] pt-3 font-semibold">
          <span>Total</span>
          <span className="font-display">{formatUsd(total)}</span>
        </div>
      </Card>

      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email for your receipt</Label>
          <Input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="coin">Pay with</Label>
          <Select
            id="coin"
            value={coin}
            onChange={(e) => setCoin(e.target.value)}
            disabled={noRates}
          >
            {conversions.map((c) => (
              <option key={c.coin} value={c.coin}>
                {c.name} ({c.coin}·{c.network}) — ≈ {formatCoinAmount(c.amount)} {c.coin}
              </option>
            ))}
          </Select>
          {quoteError && (
            <p className="text-sm text-[color-mix(in_oklab,var(--color-ember)_75%,white)]">
              Không tải được tỷ giá — thử lại.
            </p>
          )}
        </div>

        {error && (
          <p className="text-sm text-[color-mix(in_oklab,var(--color-ember)_75%,white)]">{error}</p>
        )}

        <Button
          type="submit"
          disabled={submitting || redirecting || noRates || !coin}
          rightIcon={<ArrowRight className="h-4 w-4" />}
        >
          {submitting || redirecting ? 'Creating order…' : `Pay ${formatUsd(total)}`}
        </Button>
      </form>
    </main>
  );
}
```

- [ ] **Step 2: Typecheck + lint the change**

Run: `pnpm typecheck && pnpm lint`
Expected: no errors.

- [ ] **Step 3: Manual verification (mock mode)**

Ensure `PAYMENTS_MODE=mock` in `.env`, restart dev (`pnpm dev` on the chosen port), open the checkout page with an item in the cart. Expected: the "Pay with" dropdown lists **USDT** and **ETH** (no XLM in mock), each showing "≈ <total> USDT/ETH"; submitting creates an order and reaches the pay page.

- [ ] **Step 4: Commit**

```bash
git add src/app/checkout/page.tsx
git commit -m "feat(checkout): live coin selector sourced from the quote route

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 7: Full verification gate + http-mode E2E

**Files:** none (verification only).

- [ ] **Step 1: Run the full gate**

Run: `pnpm typecheck && pnpm lint && pnpm test && pnpm build`
Expected: all pass, build clean.

- [ ] **Step 2: E2E in http mode (real gateway)**

Set in `.env`: `PAYMENTS_MODE=http` (keys `NEXTPAYMENTS_PUBLIC_KEY` / `NEXTPAYMENTS_PRIVATE_KEY` / `NEXTPAYMENTS_IPN_SECRET` already present). Restart dev. Then:

```bash
# Replace <PORT> and <SLUG> with the running port and a real catalog slug.
# 1) Quote — expect USDT, ETH, and XLM with live amounts:
curl -s -X POST http://localhost:<PORT>/api/checkout/quote \
  -H 'content-type: application/json' \
  -d '{"items":[{"slug":"<SLUG>","qty":1}]}' | python3 -m json.tool

# 2) Independently confirm the XLM amount matches the gateway for the same USD total:
curl -s "https://api.omnipayx.io/api/fund/convert-usd?amount=<USD_TOTAL>&coin=XLM&network=XLM"
```

Expected: the quote's XLM `amount` ≈ the direct convert-usd `amount` (small drift from rate ticks is fine). Then complete a checkout with XLM in the browser and confirm the pay page shows the XLM amount and address.

- [ ] **Step 3: Restore local default**

Set `.env` back to `PAYMENTS_MODE=mock` for normal local dev (unless staying in http mode intentionally). Restart dev.

- [ ] **Step 4: Finish the branch**

Use the `superpowers:finishing-a-development-branch` skill to decide how to integrate `feat/stellar-xlm-payment` (PR vs merge). Note: pushing to `ptryy/fretwire` requires write access — the current SSH identity (`tonydisco`) was denied earlier, so a fork or granted access may be needed.

---

## Self-Review

**Spec coverage:**
- Convert-all-coins (http), fix ETH 1:1 → Tasks 2 & 5 (`resolveOrderAmount`). ✓
- Live selector from convert list → Tasks 4 & 6. ✓
- http-mode-only; mock unchanged/no XLM → `mockConversions` + `resolveOrderAmount` mock branch (Task 2); mock regression test (Task 5). ✓
- Server-trusted pricing + server-derived network → quote & checkout routes price server-side; `networkForCoin` (Tasks 4, 5). ✓
- convert-usd public/no HMAC → `convertUsd` sends no auth header (Task 1). ✓
- Error handling (`quote_failed`, `conversion_failed`, `invalid_request`, `unknown_product`) → Tasks 4, 5. ✓
- Precision verbatim, round on display only → `resolveOrderAmount` returns raw amount; `formatCoinAmount` display-only (Tasks 2, 6). ✓
- XLM in ACCEPTED_COINS + coin enum → Task 3. ✓
- Tests per component + regression + E2E → Tasks 1–5, 7. ✓

**Placeholder scan:** No TBD/TODO; all steps contain real code and commands. `SLUG` is flagged to verify against the catalog before use. ✓

**Type consistency:** `Conversion` (5 fields) is defined once in Task 1 and reused verbatim in Tasks 2, 4, 6. `convertUsd`/`quoteConversions`/`resolveOrderAmount` signatures match across definition (Tasks 1–2) and call sites (Tasks 4–5). `cartItemsSchema` defined in Task 3, consumed in Task 4. ✓
