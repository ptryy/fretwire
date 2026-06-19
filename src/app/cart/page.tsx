'use client';

import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import Link from 'next/link';

import { useCart } from '@/components/cart-provider';
import { GuitarArt } from '@/components/guitar-art';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { IconButton } from '@/components/ui/icon-button';
import { formatUsd } from '@/lib/format';

export default function CartPage() {
  const { items, setQty, remove, total } = useCart();

  if (items.length === 0) {
    return (
      <main className="mx-auto flex max-w-2xl flex-col items-center gap-5 px-6 py-24 text-center">
        <ShoppingBag className="h-10 w-10 text-[var(--color-subtle)]" aria-hidden />
        <h1 className="font-display text-2xl font-semibold">Your cart is empty</h1>
        <Link href="/products">
          <Button>Browse guitars</Button>
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-12">
      <h1 className="font-display text-3xl font-semibold">Your cart</h1>

      <Card className="divide-y divide-[var(--color-border)]">
        {items.map((item) => (
          <div key={item.slug} className="flex items-center gap-4 p-4">
            <div className="h-16 w-12 shrink-0">
              <GuitarArt art={item.art} seed={item.slug} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{item.name}</p>
              <p className="font-mono text-xs text-[var(--color-subtle)]">
                {formatUsd(item.price)} each
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <IconButton
                label="Decrease quantity"
                className="h-8 w-8"
                onClick={() => setQty(item.slug, item.qty - 1)}
              >
                <Minus className="h-3.5 w-3.5" />
              </IconButton>
              <span className="w-6 text-center tabular-nums">{item.qty}</span>
              <IconButton
                label="Increase quantity"
                className="h-8 w-8"
                onClick={() => setQty(item.slug, item.qty + 1)}
              >
                <Plus className="h-3.5 w-3.5" />
              </IconButton>
            </div>
            <div className="w-20 text-right font-medium">{formatUsd(item.price * item.qty)}</div>
            <IconButton
              label="Remove item"
              className="h-8 w-8 hover:border-[var(--color-ember)] hover:text-[var(--color-ember)]"
              onClick={() => remove(item.slug)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </IconButton>
          </div>
        ))}
      </Card>

      <div className="flex items-center justify-between">
        <span className="text-lg">
          Total <span className="font-display font-semibold">{formatUsd(total)}</span>
        </span>
        <Link href="/checkout">
          <Button>Checkout</Button>
        </Link>
      </div>
    </main>
  );
}
