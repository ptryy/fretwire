'use client';

import { CreditCard } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { useCart, type CartItem } from './cart-provider';
import { Button } from './ui/button';

export function BuyNow({ product }: { product: Omit<CartItem, 'qty'> }) {
  const { add } = useCart();
  const router = useRouter();

  return (
    <Button
      variant="outline"
      leftIcon={<CreditCard className="h-4 w-4" />}
      onClick={() => {
        add(product);
        router.push('/checkout');
      }}
    >
      Buy now
    </Button>
  );
}
