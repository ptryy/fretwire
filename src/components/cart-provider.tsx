'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type CartItem = {
  slug: string;
  name: string;
  price: number;
  image: string;
  qty: number;
};

type CartContextValue = {
  items: CartItem[];
  add: (item: Omit<CartItem, 'qty'>, qty?: number) => void;
  setQty: (slug: string, qty: number) => void;
  remove: (slug: string) => void;
  clear: () => void;
  count: number;
  total: number;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = 'shop-cart-v1';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw) as CartItem[]);
    } catch {
      // ignore malformed storage
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, loaded]);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      add: (item, qty = 1) =>
        setItems((prev) => {
          const existing = prev.find((p) => p.slug === item.slug);
          if (existing) {
            return prev.map((p) => (p.slug === item.slug ? { ...p, qty: p.qty + qty } : p));
          }
          return [...prev, { ...item, qty }];
        }),
      setQty: (slug, qty) =>
        setItems((prev) =>
          qty <= 0
            ? prev.filter((p) => p.slug !== slug)
            : prev.map((p) => (p.slug === slug ? { ...p, qty } : p)),
        ),
      remove: (slug) => setItems((prev) => prev.filter((p) => p.slug !== slug)),
      clear: () => setItems([]),
      count: items.reduce((n, p) => n + p.qty, 0),
      total: Math.round(items.reduce((s, p) => s + p.price * p.qty, 0) * 100) / 100,
    }),
    [items],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
}
