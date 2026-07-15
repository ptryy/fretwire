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
      email: 'a@b.co',
      coin: 'XLM',
    });
    expect(parsed.success).toBe(true);
  });

  it('rejects an unknown coin', () => {
    const parsed = checkoutInputSchema.safeParse({
      items: [{ slug: 'x', qty: 1 }],
      email: 'a@b.co',
      coin: 'DOGE',
    });
    expect(parsed.success).toBe(false);
  });

  it('cartItemsSchema validates the items array', () => {
    expect(cartItemsSchema.safeParse({ items: [{ slug: 'x', qty: 2 }] }).success).toBe(true);
    expect(cartItemsSchema.safeParse({ items: [] }).success).toBe(false);
  });
});
