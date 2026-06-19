'use client';

import { useState } from 'react';

import { useCart } from './cart-provider';

type Props = {
  product: { slug: string; name: string; price: number; image: string };
  className?: string;
};

export function AddToCart({ product, className }: Props) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);

  return (
    <button
      type="button"
      onClick={() => {
        add(product);
        setAdded(true);
        setTimeout(() => setAdded(false), 1200);
      }}
      className={
        className ??
        'rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90'
      }
    >
      {added ? 'Added ✓' : 'Add to cart'}
    </button>
  );
}
