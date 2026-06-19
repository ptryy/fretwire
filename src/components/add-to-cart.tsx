'use client';

import { Check, Plus } from 'lucide-react';
import { useState } from 'react';

import { useCart, type CartItem } from './cart-provider';
import { Button } from './ui/button';
import { useToast } from './ui/toast';

type Props = {
  product: Omit<CartItem, 'qty'>;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'outline';
  full?: boolean;
};

export function AddToCart({ product, size = 'md', variant = 'primary', full }: Props) {
  const { add } = useCart();
  const { toast } = useToast();
  const [added, setAdded] = useState(false);

  return (
    <Button
      size={size}
      variant={variant}
      className={full ? 'w-full' : undefined}
      leftIcon={added ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
      onClick={() => {
        add(product);
        toast(`${product.name} added to cart`, 'success');
        setAdded(true);
        setTimeout(() => setAdded(false), 1200);
      }}
    >
      {added ? 'Added' : 'Add to cart'}
    </Button>
  );
}
