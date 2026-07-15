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
