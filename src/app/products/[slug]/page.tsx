import { ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { AddToCart } from '@/components/add-to-cart';
import { BuyNow } from '@/components/buy-now';
import { GuitarArt } from '@/components/guitar-art';
import { GuitarViewer } from '@/components/guitar-viewer';
import { SpecStrip } from '@/components/spec-strip';
import { getProductBySlug, listProducts } from '@/lib/catalog';
import { formatUsd } from '@/lib/format';

type Params = Promise<{ slug: string }>;

export function generateStaticParams() {
  return listProducts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) return {};
  return {
    title: `${product.brand} ${product.name}`,
    description: product.description,
    openGraph: { title: `${product.brand} ${product.name}`, description: product.description },
  };
}

export default async function ProductPage({ params }: { params: Params }) {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) notFound();

  const item = {
    slug: product.slug,
    name: `${product.brand} ${product.name}`,
    price: product.priceDisplay,
    art: product.art,
  };

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-12">
      <Link
        href="/products"
        className="inline-flex items-center gap-2 text-sm text-[var(--color-muted)] transition-colors hover:text-[var(--color-amber)]"
      >
        <ArrowLeft className="h-4 w-4" /> All guitars
      </Link>

      <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
        <div className="amp-glow relative flex items-center justify-center rounded-[var(--radius)] border border-[var(--color-border)] py-10">
          <GuitarViewer
            art={product.art}
            seed={product.slug}
            name={`${product.brand} ${product.name}`}
            finish={product.finish}
          />
          <div className="h-80 w-48">
            <GuitarArt art={product.art} seed={product.slug} />
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <div>
            <p className="font-mono text-xs uppercase tracking-wider text-[var(--color-subtle)]">
              {product.brand}
            </p>
            <h1 className="mt-1 font-display text-4xl font-semibold tracking-tight">
              {product.name}
            </h1>
            <p className="mt-1 text-sm text-[var(--color-amber)]">{product.finish}</p>
          </div>

          <p className="text-[var(--color-muted)]">{product.description}</p>

          <div className="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <SpecStrip specs={product.specs} />
          </div>

          <div className="font-display text-3xl font-semibold">
            {formatUsd(product.priceDisplay)}
          </div>

          <div className="flex flex-wrap gap-3">
            <AddToCart product={item} />
            <BuyNow product={item} />
          </div>
        </div>
      </div>
    </main>
  );
}
