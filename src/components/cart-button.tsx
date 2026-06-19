'use client';

import Link from 'next/link';

import { useCart } from './cart-provider';

export function CartButton() {
  const { count } = useCart();

  return (
    <Link
      href="/cart"
      className="relative rounded-lg px-3 py-1.5 text-sm text-[var(--color-text)] transition hover:text-[var(--color-accent)]"
    >
      Cart
      {count > 0 && (
        <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-accent)] px-1.5 text-xs font-semibold text-white">
          {count}
        </span>
      )}
    </Link>
  );
}
