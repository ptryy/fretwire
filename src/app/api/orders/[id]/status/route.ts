import { NextResponse } from 'next/server';

import { getOrder, markStatus } from '@/lib/db/orders-repo';
import { env } from '@/lib/env';
import { getClient } from '@/lib/payments/client';

/** Order status for the payment page to poll. Auto-expires; reconciles in http mode. */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;
  let order = getOrder(id);
  if (!order) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  // Lazily expire a pending order past its window.
  if (order.status === 'pending' && order.expiresAt && Date.parse(order.expiresAt) < Date.now()) {
    markStatus(id, { status: 'expired' });
    order = getOrder(id) ?? order;
  }

  // In http mode, reconcile a still-pending order against the gateway.
  if (env.mode === 'http' && order.status === 'pending' && order.npOrderId) {
    try {
      const remote = await getClient().getOrder(order.npOrderId);
      if (remote.status !== order.status) {
        markStatus(id, {
          status: remote.status,
          transactionHash: remote.transactionHash ?? null,
          paidAt: remote.paidAt ?? null,
        });
        order = getOrder(id) ?? order;
      }
    } catch {
      // Reconcile failure is non-fatal — the local status stands.
    }
  }

  return NextResponse.json({
    status: order.status,
    coin: order.coin,
    network: order.network,
    amount: order.amount,
    address: order.address,
    memo: order.memo,
    expiresAt: order.expiresAt,
    transactionHash: order.transactionHash,
    paidAt: order.paidAt,
  });
}
