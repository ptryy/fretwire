import Link from 'next/link';

import { CartButton } from './cart-button';
import { Logo } from './logo';

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded-[var(--radius)] px-3 py-2 text-sm text-[var(--color-muted)] transition-colors hover:text-[var(--color-text)]"
    >
      {children}
    </Link>
  );
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-bg)_82%,transparent)] backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" aria-label={`Home`}>
          <Logo />
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          <NavLink href="/products">Guitars</NavLink>
          <CartButton />
        </nav>
      </div>
    </header>
  );
}
