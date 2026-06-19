import Link from 'next/link';

import type { Product } from '@/lib/db/catalog-repo';
import { formatUsd } from '@/lib/format';

import { AddToCart } from './add-to-cart';

export function ProductCard({ product }: { product: Product }) {
  const cartItem = {
    slug: product.slug,
    name: product.name,
    price: product.priceDisplay,
    image: product.image,
  };

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
      <Link href={`/products/${product.slug}`} className="flex flex-col gap-3">
        <div className="flex h-28 items-center justify-center rounded-xl bg-black/20 text-6xl">
          {product.image}
        </div>
        <h3 className="font-medium text-[var(--color-text)]">{product.name}</h3>
      </Link>
      <div className="mt-auto flex items-center justify-between">
        <span className="text-lg font-semibold">{formatUsd(product.priceDisplay)}</span>
        <AddToCart product={cartItem} />
      </div>
    </div>
  );
}
