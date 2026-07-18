import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

import { FretRail } from '@/components/fret-rail';
import { HeroGuitarSlider } from '@/components/hero-guitar-slider';
import { ProductCard } from '@/components/product-card';
import { listCategories, listProducts } from '@/lib/catalog';

export default function HomePage() {
  const categories = listCategories();
  const featured = listProducts().slice(0, 6);

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-16 px-6 py-12">
      <section className="amp-glow relative overflow-hidden rounded-[calc(var(--radius)*1.6)] border border-[var(--color-border)] px-8 py-16 sm:px-12 sm:py-20">
        <HeroGuitarSlider />
        <div className="relative z-10">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-amber)]">
            Electric · Acoustic · Classical · Bass
          </p>
          <h1 className="mt-4 max-w-2xl font-display text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
            Guitars worth the reach.
          </h1>
          <p className="mt-5 max-w-lg text-[var(--color-muted)]">
            A modern shop for players — from a first nylon-string to a seven-string built for drop
            tunings. Checkout in crypto, settled on-chain.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/products"
            className="inline-flex h-12 items-center gap-2 rounded-[var(--radius)] bg-[var(--color-amber)] px-6 font-semibold text-[#14110e] transition-colors hover:bg-[color-mix(in_oklab,var(--color-amber)_88%,white)]"
          >
            Browse guitars <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/products?category=electric"
            className="inline-flex h-12 items-center rounded-[var(--radius)] border border-[var(--color-border-strong)] px-6 text-sm transition-colors hover:border-[var(--color-amber)] hover:text-[var(--color-amber)]"
          >
            Shop electric
          </Link>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-5">
        <h2 className="font-display text-2xl font-semibold">Browse by type</h2>
        <FretRail count={categories.length} />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {categories.map((c) => (
            <Link
              key={c.slug}
              href={`/products?category=${c.slug}`}
              className="group rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 transition-colors hover:border-[var(--color-amber)]"
            >
              <h3 className="font-display text-lg font-semibold transition-colors group-hover:text-[var(--color-amber)]">
                {c.name}
              </h3>
              <p className="mt-1 text-xs text-[var(--color-subtle)]">{c.blurb}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-5">
        <h2 className="font-display text-2xl font-semibold">Featured</h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      </section>
    </main>
  );
}
