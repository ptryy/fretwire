import { createHash, randomUUID } from 'node:crypto';

import { getOrder } from '../store/orders';
import type { StoredOrder } from '../store/types';

import { signIpn } from './ipn';
import type { CreateOrderInput, GatewayOrder, NextPaymentsClient } from './types';

const DEFAULT_EXPIRES_IN_SEC = 900;

/** Deterministic, valid-looking EVM address from a seed (demo only). */
function mockAddress(seed: string): string {
  return `0x${createHash('sha256').update(`addr:${seed}`).digest('hex').slice(0, 40)}`;
}

function mockTxHash(seed: string): string {
  return `0x${createHash('sha256').update(`tx:${seed}`).digest('hex')}`;
}

function storedToGateway(o: StoredOrder): GatewayOrder {
  return {
    orderId: o.npOrderId ?? `mock_${o.externalOrderId}`,
    address: o.address ?? '',
    memo: o.memo ?? undefined,
    amount: o.amount,
    coin: o.coin,
    network: o.network ?? undefined,
    status: o.status,
    expiresAt: o.expiresAt ?? '',
    transactionHash: o.transactionHash ?? undefined,
    paidAt: o.paidAt ?? undefined,
  };
}

/**
 * Offline gateway stand-in. `createOrder` returns a deterministic invoice;
 * `getOrder` reflects the locally-stored status (which the self-IPN advances).
 * Payment is simulated out-of-band via {@link emitMockPaidIpn}.
 */
export class MockClient implements NextPaymentsClient {
  async createOrder(input: CreateOrderInput): Promise<GatewayOrder> {
    const ext = String(input.externalOrderId ?? randomUUID());
    const expiresIn = input.expiresIn ?? DEFAULT_EXPIRES_IN_SEC;
    return {
      orderId: `mock_${ext}`,
      address: mockAddress(ext),
      amount: input.amount,
      coin: input.coin,
      network: input.network,
      status: 'pending',
      expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
    };
  }

  async getOrder(orderId: string): Promise<GatewayOrder> {
    const ext = orderId.startsWith('mock_') ? orderId.slice('mock_'.length) : orderId;
    const stored = await getOrder(ext);
    if (!stored) throw new Error(`Unknown mock order ${orderId}`);
    return storedToGateway(stored);
  }
}

/**
 * Simulate the gateway delivering an `invoicePaid` IPN: sign with the demo's
 * `ipnSecret` and POST to our own `/api/ipn`, exactly as the real gateway would.
 * Called by the mock-only `/simulate` route.
 */
export async function emitMockPaidIpn(
  order: StoredOrder,
  opts: { appUrl: string; ipnSecret: string },
): Promise<Response> {
  const payload = {
    event: 'invoicePaid',
    orderId: order.npOrderId ?? `mock_${order.externalOrderId}`,
    externalOrderId: order.externalOrderId,
    status: 'paid',
    amount: order.amount,
    coin: order.coin,
    network: order.network ?? undefined,
    address: order.address ?? undefined,
    transactionHash: mockTxHash(order.externalOrderId),
    paidAt: new Date().toISOString(),
    expiresAt: order.expiresAt ?? undefined,
    createdAt: order.createdAt,
  };
  const rawBody = JSON.stringify(payload);
  const timestamp = Math.floor(Date.now() / 1000);
  const deliveryId = randomUUID();
  const signature = signIpn({ ipnSecret: opts.ipnSecret, timestamp, deliveryId, rawBody });

  return fetch(`${opts.appUrl}/api/ipn`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-np-event': 'invoicePaid',
      'x-np-timestamp': String(timestamp),
      'x-np-id': deliveryId,
      'x-np-signature': signature,
    },
    body: rawBody,
  });
}
