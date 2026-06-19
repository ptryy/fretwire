import { randomUUID } from 'node:crypto';

import { NextResponse } from 'next/server';

import { checkoutInputSchema, priceCart } from '@/lib/checkout';
import { getClient } from '@/lib/payments/client';
import { createLocalOrder, setGatewayFields } from '@/lib/store/orders';
import { networkForCoin } from '@/lib/payments/types';

/** Create an order: price the cart, create a gateway invoice, persist, return the pay URL. */
export async function POST(req: Request): Promise<Response> {
  const body: unknown = await req.json().catch(() => null);
  const parsed = checkoutInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }
  const { items, email, coin } = parsed.data;

  const priced = priceCart(items);
  if (!priced) {
    return NextResponse.json({ error: 'unknown_product' }, { status: 400 });
  }

  const externalOrderId = randomUUID();
  const network = networkForCoin(coin);
  await createLocalOrder({
    externalOrderId,
    email,
    coin,
    network,
    amount: priced.total,
    cartJson: JSON.stringify(items),
  });

  try {
    const order = await getClient().createOrder({
      amount: priced.total,
      coin,
      network,
      externalOrderId,
      description: `Shop order ${externalOrderId}`,
    });
    await setGatewayFields(externalOrderId, {
      npOrderId: order.orderId,
      address: order.address,
      memo: order.memo,
      amount: order.amount,
      coin: order.coin || coin,
      network: order.network ?? network,
      expiresAt: order.expiresAt,
      status: order.status,
    });
    return NextResponse.json({ orderId: externalOrderId, payUrl: `/pay/${externalOrderId}` });
  } catch (err) {
    return NextResponse.json({ error: 'gateway_error', message: String(err) }, { status: 502 });
  }
}
