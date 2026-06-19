import { NextResponse } from 'next/server';

import { getOrder } from '@/lib/db/orders-repo';
import { env } from '@/lib/env';
import { emitMockPaidIpn } from '@/lib/payments/mock-client';

/** Mock-only: simulate the gateway paying this order by emitting a signed IPN. */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  if (env.mode !== 'mock') {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }
  const { id } = await params;
  const order = getOrder(id);
  if (!order) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }
  await emitMockPaidIpn(order, { appUrl: env.appUrl, ipnSecret: env.ipnSecret });
  return NextResponse.json({ ok: true });
}
