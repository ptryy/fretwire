import { describe, expect, it } from 'vitest';

import { markDelivered } from '@/lib/db/ipn-repo';
import { nextNonce } from '@/lib/db/nonce-repo';
import { createLocalOrder, getOrder, markStatus, setGatewayFields } from '@/lib/db/orders-repo';

describe('orders-repo', () => {
  it('persists a pending order and updates gateway fields + status', () => {
    createLocalOrder({
      externalOrderId: 'e1',
      email: 'a@b.c',
      coin: 'USDT',
      network: 'ERC20',
      amount: 12.5,
      cartJson: '[]',
    });
    expect(getOrder('e1')?.status).toBe('pending');

    setGatewayFields('e1', {
      npOrderId: 'np_1',
      address: '0xabc',
      amount: 12.5,
      coin: 'USDT',
      network: 'ERC20',
      expiresAt: '2026-06-19T00:00:00.000Z',
      status: 'pending',
    });
    expect(getOrder('e1')?.npOrderId).toBe('np_1');
    expect(getOrder('e1')?.address).toBe('0xabc');

    markStatus('e1', { status: 'paid', transactionHash: '0xdead', paidAt: '2026-06-19T01:00:00.000Z' });
    const o = getOrder('e1');
    expect(o?.status).toBe('paid');
    expect(o?.transactionHash).toBe('0xdead');
  });

  it('returns null for an unknown order', () => {
    expect(getOrder('nope')).toBeNull();
  });
});

describe('nonce-repo', () => {
  it('produces strictly increasing nonces per publicKey', () => {
    const a = nextNonce('pk');
    const b = nextNonce('pk');
    const c = nextNonce('pk');
    expect(a < b).toBe(true);
    expect(b < c).toBe(true);
  });
});

describe('ipn-repo', () => {
  it('is idempotent — first delivery true, repeats false', () => {
    expect(markDelivered('d1')).toBe(true);
    expect(markDelivered('d1')).toBe(false);
    expect(markDelivered('d2')).toBe(true);
  });
});
