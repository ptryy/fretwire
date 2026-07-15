import { afterEach, describe, expect, it, vi } from 'vitest';

import { convertUsd, quoteConversions, resolveOrderAmount } from '@/lib/payments/convert';
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
