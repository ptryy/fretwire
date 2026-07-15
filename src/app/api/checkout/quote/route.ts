import { NextResponse } from 'next/server';

import { cartItemsSchema, priceCart } from '@/lib/checkout';
import { quoteConversions } from '@/lib/payments/convert';

/** Price the cart and return per-coin conversions for the checkout selector. */
export async function POST(req: Request): Promise<Response> {
  const body: unknown = await req.json().catch(() => null);
  const parsed = cartItemsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }
  const priced = priceCart(parsed.data.items);
  if (!priced) {
    return NextResponse.json({ error: 'unknown_product' }, { status: 400 });
  }
  try {
    const { mode, conversions } = await quoteConversions(priced.total);
    return NextResponse.json({ mode, usd: priced.total, conversions });
  } catch {
    return NextResponse.json({ error: 'quote_failed' }, { status: 502 });
  }
}
