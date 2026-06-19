import { describe, expect, it } from 'vitest';

import { MockClient } from '@/lib/payments/mock-client';

describe('MockClient.createOrder', () => {
  const client = new MockClient();

  it('returns a pending order with a 0x+40hex address and a future expiry', async () => {
    const order = await client.createOrder({
      amount: 12.5,
      coin: 'USDT',
      network: 'ERC20',
      externalOrderId: 'e1',
      expiresIn: 900,
    });
    expect(order.status).toBe('pending');
    expect(order.address).toMatch(/^0x[0-9a-f]{40}$/);
    expect(order.coin).toBe('USDT');
    expect(order.orderId).toBe('mock_e1');
    expect(new Date(order.expiresAt).getTime()).toBeGreaterThan(Date.now());
  });

  it('derives a deterministic address from externalOrderId', async () => {
    const a = await client.createOrder({ amount: 1, coin: 'ETH', externalOrderId: 'same' });
    const b = await client.createOrder({ amount: 2, coin: 'ETH', externalOrderId: 'same' });
    expect(a.address).toBe(b.address);
  });
});
