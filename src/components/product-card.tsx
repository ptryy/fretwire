import Link from 'next/link';

import type { Product } from '@/lib/catalog';
import { formatUsd } from '@/lib/format';

import { AddToCart } from './add-to-cart';
import { GuitarArt } from './guitar-art';
import { Card } from './ui/card';

export function ProductCard({ product }: { product: Product }) {
  const item = {
    slug: product.slug,
    name: `${product.brand} ${product.name}`,
    price: product.priceDisplay,
    art: product.art,
  };

  return (
    <Card className="group flex flex-col overflow-hidden transition-colors hover:border-[var(--color-border-strong)]">
      <Link href={`/products/${product.slug}`} className="block">
        <div className="flex h-48 items-center justify-center bg-[radial-gradient(70%_70%_at_50%_30%,color-mix(in_oklab,var(--color-amber)_8%,transparent),transparent)]">
          <div className="h-44 w-28 transition-transform duration-500 group-hover:-translate-y-1 motion-reduce:transform-none">
            <GuitarArt art={product.art} seed={product.slug} />
          </div>
        </div>
      </Link>
      <div className="flex flex-1 flex-col gap-3 border-t border-[var(--color-border)] p-5">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-wider text-[var(--color-subtle)]">
            {product.brand}
          </p>
          <Link href={`/products/${product.slug}`}>
            <h3 className="font-display text-lg font-semibold text-[var(--color-text)] transition-colors group-hover:text-[var(--color-amber)]">
              {product.name}
            </h3>
          </Link>
          <p className="mt-0.5 text-xs text-[var(--color-subtle)]">{product.finish}</p>
        </div>
        <div className="mt-auto flex items-center justify-between pt-1">
          <span className="font-display text-xl font-semibold">
            {formatUsd(product.priceDisplay)}
          </span>
          <AddToCart product={item} size="sm" variant="outline" />
        </div>
      </div>
    </Card>
  );
}
