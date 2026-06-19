import Link from 'next/link';

import type { Category } from '@/lib/catalog';
import { cn } from '@/lib/cn';

const base = 'rounded-full border px-3.5 py-1.5 text-sm whitespace-nowrap transition-colors';
const on =
  'border-[color-mix(in_oklab,var(--color-amber)_45%,transparent)] bg-[var(--color-amber-soft)] text-[var(--color-amber)]';
const off =
  'border-[var(--color-border-strong)] text-[var(--color-muted)] hover:border-[var(--color-amber)] hover:text-[var(--color-text)]';

export function CategoryPills({
  categories,
  activeSlug,
}: {
  categories: Category[];
  activeSlug?: string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <Link href="/products" className={cn(base, !activeSlug ? on : off)}>
        All
      </Link>
      {categories.map((c) => (
        <Link
          key={c.slug}
          href={`/products?category=${c.slug}`}
          className={cn(base, activeSlug === c.slug ? on : off)}
        >
          {c.name}
        </Link>
      ))}
    </div>
  );
}
