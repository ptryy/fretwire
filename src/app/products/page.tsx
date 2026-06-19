import type { Metadata } from 'next';
import { Suspense } from 'react';

import { CategoryPills } from '@/components/category-pills';
import { ProductCard } from '@/components/product-card';
import { SearchBox } from '@/components/search-box';
import { getCategory, listCategories, listProducts } from '@/lib/catalog';

type SearchParams = Promise<{ category?: string; q?: string }>;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const { category } = await searchParams;
  const cat = category ? getCategory(category) : null;
  return {
    title: cat ? `${cat.name} guitars` : 'All guitars',
    description: cat?.blurb ?? 'Browse electric, acoustic, classical, and bass guitars.',
  };
}

export default async function ProductsPage({ searchParams }: { searchParams: SearchParams }) {
  const { category, q } = await searchParams;
  const categories = listCategories();
  const products = listProducts({ categorySlug: category, q });
  const active = category ? getCategory(category) : null;

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold">
            {active ? `${active.name} guitars` : 'All guitars'}
          </h1>
          {active && <p className="mt-1 text-sm text-[var(--color-muted)]">{active.blurb}</p>}
        </div>
        <Suspense fallback={null}>
          <SearchBox />
        </Suspense>
      </div>

      <CategoryPills categories={categories} activeSlug={category} />

      {products.length === 0 ? (
        <p className="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-16 text-center text-[var(--color-muted)]">
          No guitars match your search.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      )}
    </main>
  );
}
