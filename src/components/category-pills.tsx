import Link from 'next/link';

import type { Category } from '@/lib/db/catalog-repo';

const base = 'rounded-full border px-3 py-1.5 text-sm transition whitespace-nowrap';
const active = 'border-[var(--color-accent)] bg-[var(--color-accent)]/15 text-[var(--color-text)]';
const idle =
  'border-[var(--color-border)] text-[var(--color-muted)] hover:border-[var(--color-accent)] hover:text-[var(--color-text)]';

export function CategoryPills({
  categories,
  activeSlug,
}: {
  categories: Category[];
  activeSlug?: string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <Link href="/products" className={`${base} ${!activeSlug ? active : idle}`}>
        All
      </Link>
      {categories.map((c) => (
        <Link
          key={c.slug}
          href={`/products?category=${c.slug}`}
          className={`${base} ${activeSlug === c.slug ? active : idle}`}
        >
          {c.name}
        </Link>
      ))}
    </div>
  );
}
