import { Suspense } from 'react';

import { CategoryPills } from '@/components/category-pills';
import { ProductCard } from '@/components/product-card';
import { SearchBox } from '@/components/search-box';
import { listCategories, listProducts } from '@/lib/db/catalog-repo';

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const { category, q } = await searchParams;
  const categories = listCategories();
  const products = listProducts({ categorySlug: category, q });

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">Products</h1>
        <Suspense fallback={null}>
          <SearchBox />
        </Suspense>
      </div>

      <CategoryPills categories={categories} activeSlug={category} />

      {products.length === 0 ? (
        <p className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-12 text-center text-[var(--color-muted)]">
          No products match your search.
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
