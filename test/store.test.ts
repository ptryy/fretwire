import { describe, expect, it } from 'vitest';

import { markDelivered } from '@/lib/store/ipn-delivery';
import { nextNonce } from '@/lib/store/nonce';
import { createLocalOrder, getOrder, markStatus, setGatewayFields } from '@/lib/store/orders';

// No KV env in tests → getStore() uses the in-memory MemoryStore.

describe('store/orders', () => {
  it('creates a pending order, sets gateway fields, then marks it paid', async () => {
    await createLocalOrder({
      externalOrderId: 'e1',
      email: 'a@b.c',
      coin: 'USDT',
      network: 'ERC20',
      amount: 12.5,
      cartJson: '[]',
    });
    expect((await getOrder('e1'))?.status).toBe('pending');

    await setGatewayFields('e1', {
      npOrderId: 'np_1',
      address: '0xabc',
      amount: 12.5,
      coin: 'USDT',
      network: 'ERC20',
      expiresAt: '2026-06-19T00:00:00.000Z',
      status: 'pending',
    });
    expect((await getOrder('e1'))?.address).toBe('0xabc');

    await markStatus('e1', { status: 'paid', transactionHash: '0xdead' });
    expect((await getOrder('e1'))?.status).toBe('paid');
  });

  it('returns null for an unknown order', async () => {
    expect(await getOrder('nope')).toBeNull();
  });
});

describe('store/nonce', () => {
  it('is strictly increasing per publicKey', async () => {
    const a = await nextNonce('pk');
    const b = await nextNonce('pk');
    expect(a < b).toBe(true);
  });
});

describe('store/ipn-delivery', () => {
  it('is idempotent', async () => {
    expect(await markDelivered('d1')).toBe(true);
    expect(await markDelivered('d1')).toBe(false);
    expect(await markDelivered('d2')).toBe(true);
  });
});
