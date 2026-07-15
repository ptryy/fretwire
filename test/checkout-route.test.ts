import { afterEach, describe, expect, it, vi } from 'vitest';

import { POST as quote } from '@/app/api/checkout/quote/route';
import { POST as checkout } from '@/app/api/checkout/route';
import { getStore } from '@/lib/store';

const SLUG = 'vesper-nova-s'; // a real catalog slug — verify in src/lib/catalog/data.ts

function post(body: unknown): Request {
  return new Request('http://test/api/checkout/quote', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function checkoutPost(body: unknown): Request {
  return new Request('http://test/api/checkout', {
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

describe('POST /api/checkout', () => {
  it('creates an order in mock mode and returns a pay URL', async () => {
    const res = await checkout(
      checkoutPost({ items: [{ slug: SLUG, qty: 1 }], email: 'a@b.co', coin: 'USDT' }),
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as { payUrl?: string };
    expect(json.payUrl).toMatch(/^\/pay\//);
  });

  it('400s on an unknown product', async () => {
    const res = await checkout(
      checkoutPost({ items: [{ slug: 'not-a-real-slug', qty: 1 }], email: 'a@b.co', coin: 'USDT' }),
    );
    expect(res.status).toBe(400);
  });
});
