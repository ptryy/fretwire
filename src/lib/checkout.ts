import { z } from 'zod';

import { getProductsBySlugs } from './db/catalog-repo';

/** Checkout request body (cart lines + buyer email + chosen coin). */
export const checkoutInputSchema = z.object({
  items: z
    .array(z.object({ slug: z.string().min(1), qty: z.number().int().positive() }))
    .min(1),
  email: z.string().email(),
  coin: z.enum(['ETH', 'USDT']),
});

export type CheckoutInput = z.infer<typeof checkoutInputSchema>;

export type PricedCart = { total: number };

/**
 * Price a cart from the catalog (server-trusted prices, never the client's).
 * Returns `null` if any slug is unknown. Demo simplification: the fiat total is
 * the order `amount` in the chosen coin (1 unit ≈ $1).
 */
export function priceCart(items: CheckoutInput['items']): PricedCart | null {
  const products = getProductsBySlugs(items.map((i) => i.slug));
  const priceBySlug = new Map(products.map((p) => [p.slug, p.priceDisplay]));
  let total = 0;
  for (const item of items) {
    const price = priceBySlug.get(item.slug);
    if (price === undefined) return null;
    total += price * item.qty;
  }
  return { total: Math.round(total * 100) / 100 };
}
