import Link from 'next/link';

import { CategoryPills } from '@/components/category-pills';
import { ProductCard } from '@/components/product-card';
import { listCategories, listProducts } from '@/lib/db/catalog-repo';

export default function HomePage() {
  const categories = listCategories();
  const featured = listProducts().slice(0, 6);

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-12 px-6 py-10">
      <section className="rounded-3xl border border-[var(--color-border)] bg-gradient-to-br from-[var(--color-surface)] to-black/30 p-10">
        <p className="text-sm font-medium text-[var(--color-accent)]">Pay with crypto</p>
        <h1 className="mt-2 max-w-xl text-4xl font-semibold leading-tight">
          Self-custody gear, paid in crypto.
        </h1>
        <p className="mt-3 max-w-lg text-[var(--color-muted)]">
          A demo storefront wired to the NextPayments gateway — checkout creates an on-chain
          invoice and confirms via IPN.
        </p>
        <Link
          href="/products"
          className="mt-6 inline-block rounded-lg bg-[var(--color-accent)] px-5 py-2.5 font-medium text-white transition hover:opacity-90"
        >
          Shop all products
        </Link>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Shop by category</h2>
        <CategoryPills categories={categories} />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Featured</h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      </section>
    </main>
  );
}
