import { describe, expect, it } from 'vitest';

import { randomOrderId, uniqueOrderId } from '@/lib/store/order-id';

/** A deterministic `rand` that yields the given values in order, then repeats the last. */
function seqRand(values: number[]): () => number {
  let i = 0;
  return () => values[Math.min(i++, values.length - 1)] ?? 0;
}

describe('randomOrderId', () => {
  it('maps rand=0 to the lowest 6-digit id', () => {
    expect(randomOrderId(() => 0)).toBe('100000');
  });

  it('maps rand≈1 to the highest 6-digit id', () => {
    expect(randomOrderId(() => 0.9999999)).toBe('999999');
  });

  it('is always a 6-digit numeric string in range', () => {
    for (let i = 0; i < 1000; i++) {
      const id = randomOrderId();
      expect(id).toMatch(/^\d{6}$/);
      const n = Number(id);
      expect(n).toBeGreaterThanOrEqual(100000);
      expect(n).toBeLessThanOrEqual(999999);
    }
  });
});

describe('uniqueOrderId', () => {
  it('returns a fresh id when none are taken', async () => {
    const id = await uniqueOrderId(async () => false, () => 0);
    expect(id).toBe('100000');
  });

  it('retries past a taken id', async () => {
    const rand = seqRand([0, 0.5]); // → '100000' then '550000'
    const id = await uniqueOrderId(async (candidate) => candidate === '100000', rand);
    expect(id).toBe('550000');
  });

  it('throws when every attempt collides', async () => {
    await expect(uniqueOrderId(async () => true, () => 0, 3)).rejects.toThrow();
  });
});
