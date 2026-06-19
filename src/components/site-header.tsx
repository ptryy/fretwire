import Link from 'next/link';

import { CartButton } from './cart-button';

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-10 border-b border-[var(--color-border)] bg-[var(--color-bg)]/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-semibold">
          🛒 Crypto Shop
        </Link>
        <nav className="flex items-center gap-2">
          <Link
            href="/products"
            className="rounded-lg px-3 py-1.5 text-sm text-[var(--color-text)] transition hover:text-[var(--color-accent)]"
          >
            Products
          </Link>
          <CartButton />
        </nav>
      </div>
    </header>
  );
}
