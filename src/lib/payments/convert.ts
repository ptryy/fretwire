import { z } from 'zod';

import { getPaymentsConfig } from './config';
import type { PaymentsMode } from './types';

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
