import Link from 'next/link';
import { notFound } from 'next/navigation';

import { AddToCart } from '@/components/add-to-cart';
import { BuyNow } from '@/components/buy-now';
import { getProductBySlug } from '@/lib/db/catalog-repo';
import { formatUsd } from '@/lib/format';

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) notFound();

  const item = {
    slug: product.slug,
    name: product.name,
    price: product.priceDisplay,
    image: product.image,
  };

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-8 px-6 py-10">
      <Link href="/products" className="text-sm text-[var(--color-muted)] hover:text-[var(--color-accent)]">
        ← Back to products
      </Link>

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
        <div className="flex h-72 items-center justify-center rounded-3xl border border-[var(--color-border)] bg-black/20 text-8xl">
          {product.image}
        </div>
        <div className="flex flex-col gap-4">
          <h1 className="text-3xl font-semibold">{product.name}</h1>
          <p className="text-[var(--color-muted)]">{product.description}</p>
          <div className="text-2xl font-semibold">{formatUsd(product.priceDisplay)}</div>
          <div className="mt-2 flex gap-3">
            <AddToCart
              product={item}
              className="rounded-lg bg-[var(--color-accent)] px-5 py-2.5 font-medium text-white transition hover:opacity-90"
            />
            <BuyNow product={item} />
          </div>
        </div>
      </div>
    </main>
  );
}
