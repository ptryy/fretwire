'use client';

import { useRouter } from 'next/navigation';

import { useCart } from './cart-provider';

type Props = {
  product: { slug: string; name: string; price: number; image: string };
};

export function BuyNow({ product }: Props) {
  const { add } = useCart();
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => {
        add(product);
        router.push('/checkout');
      }}
      className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-text)] transition hover:border-[var(--color-accent)]"
    >
      Buy now
    </button>
  );
}
