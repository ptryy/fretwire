'use client';

import { ShoppingBag } from 'lucide-react';
import Link from 'next/link';

import { useCart } from './cart-provider';

export function CartButton() {
  const { count } = useCart();

  return (
    <Link
      href="/cart"
      aria-label={`Cart, ${count} item${count === 1 ? '' : 's'}`}
      className="relative inline-flex h-10 items-center gap-2 rounded-[var(--radius)] border border-[var(--color-border-strong)] px-3 text-sm text-[var(--color-text)] transition-colors hover:border-[var(--color-amber)]"
    >
      <ShoppingBag className="h-4 w-4" aria-hidden />
      <span className="hidden sm:inline">Cart</span>
      {count > 0 && (
        <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-amber)] px-1.5 text-xs font-semibold text-[#14110e]">
          {count}
        </span>
      )}
    </Link>
  );
}
