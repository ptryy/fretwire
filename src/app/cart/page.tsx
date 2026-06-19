'use client';

import Link from 'next/link';

import { useCart } from '@/components/cart-provider';
import { formatUsd } from '@/lib/format';

export default function CartPage() {
  const { items, setQty, remove, total } = useCart();

  if (items.length === 0) {
    return (
      <main className="mx-auto flex max-w-3xl flex-col items-center gap-4 px-6 py-20 text-center">
        <h1 className="text-2xl font-semibold">Your cart is empty</h1>
        <Link
          href="/products"
          className="rounded-lg bg-[var(--color-accent)] px-5 py-2.5 font-medium text-white transition hover:opacity-90"
        >
          Browse products
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-10">
      <h1 className="text-2xl font-semibold">Your cart</h1>

      <div className="flex flex-col divide-y divide-[var(--color-border)] rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
        {items.map((item) => (
          <div key={item.slug} className="flex items-center gap-4 px-5 py-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-black/20 text-2xl">
              {item.image}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{item.name}</p>
              <p className="text-sm text-[var(--color-muted)]">{formatUsd(item.price)} each</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Decrease"
                onClick={() => setQty(item.slug, item.qty - 1)}
                className="h-7 w-7 rounded-md border border-[var(--color-border)] hover:border-[var(--color-accent)]"
              >
                −
              </button>
              <span className="w-6 text-center tabular-nums">{item.qty}</span>
              <button
                type="button"
                aria-label="Increase"
                onClick={() => setQty(item.slug, item.qty + 1)}
                className="h-7 w-7 rounded-md border border-[var(--color-border)] hover:border-[var(--color-accent)]"
              >
                +
              </button>
            </div>
            <div className="w-20 text-right font-medium">{formatUsd(item.price * item.qty)}</div>
            <button
              type="button"
              onClick={() => remove(item.slug)}
              className="text-sm text-[var(--color-muted)] transition hover:text-red-400"
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <span className="text-lg">
          Total: <span className="font-semibold">{formatUsd(total)}</span>
        </span>
        <Link
          href="/checkout"
          className="rounded-lg bg-[var(--color-accent)] px-5 py-2.5 font-medium text-white transition hover:opacity-90"
        >
          Checkout
        </Link>
      </div>
    </main>
  );
}
