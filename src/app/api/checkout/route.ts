import { NextResponse } from 'next/server';

import { checkoutInputSchema, priceCart } from '@/lib/checkout';
import { getClient } from '@/lib/payments/client';
import { resolveOrderAmount } from '@/lib/payments/convert';
import { networkForCoin } from '@/lib/payments/types';
import { createLocalOrder, setGatewayFields } from '@/lib/store/orders';

/**
 * The gateway requires `externalOrderId` as a positive **integer**. We key the
 * local store by its string form and send the numeric form to the gateway.
 */
function newExternalOrderId(): string {
  return String(Math.floor(Math.random() * 2_000_000_000) + 1);
}

/** Create an order: price the cart, convert to the coin, create the gateway invoice. */
export async function POST(req: Request): Promise<Response> {
  const body: unknown = await req.json().catch(() => null);
  const parsed = checkoutInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }
  const { items, email, coin } = parsed.data;

  // Server-derived network (never trust the client). Also rejects any coin not
  // in ACCEPTED_COINS.
  const network = networkForCoin(coin);
  if (!network) {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }

  const priced = priceCart(items);
  if (!priced) {
    return NextResponse.json({ error: 'unknown_product' }, { status: 400 });
  }

  // http mode: convert USD → coin amount; mock mode: 1:1.
  let amount: number;
  try {
    amount = await resolveOrderAmount(priced.total, coin, network);
  } catch {
    return NextResponse.json({ error: 'conversion_failed' }, { status: 502 });
  }

  const externalOrderId = newExternalOrderId();
  await createLocalOrder({
    externalOrderId,
    email,
    coin,
    network,
    amount: priced.total,
    cartJson: JSON.stringify(items),
  });

  try {
    const client = await getClient();
    const order = await client.createOrder({
      amount,
      coin,
      network,
      externalOrderId: Number(externalOrderId),
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
