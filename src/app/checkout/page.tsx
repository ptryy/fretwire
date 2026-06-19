'use client';

import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { useCart } from '@/components/cart-provider';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { formatUsd } from '@/lib/format';

const COINS = [
  { coin: 'USDT', label: 'USDT · ERC20' },
  { coin: 'ETH', label: 'ETH · Ethereum' },
] as const;

type Coin = (typeof COINS)[number]['coin'];

export default function CheckoutPage() {
  const { items, total, clear } = useCart();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [coin, setCoin] = useState<Coin>('USDT');
  const [submitting, setSubmitting] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [error, setError] = useState('');

  if (items.length === 0 && !redirecting) {
    return (
      <main className="mx-auto flex max-w-2xl flex-col items-center gap-4 px-6 py-24 text-center">
        <h1 className="font-display text-2xl font-semibold">Nothing to check out</h1>
        <Link href="/products" className="text-[var(--color-amber)] hover:underline">
          Browse guitars
        </Link>
      </main>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          items: items.map((i) => ({ slug: i.slug, qty: i.qty })),
          email,
          coin,
        }),
      });
      const data = (await res.json()) as { payUrl?: string; error?: string };
      if (!res.ok || !data.payUrl) {
        setError(data.error ?? 'Checkout failed. Please try again.');
        return;
      }
      setRedirecting(true);
      clear();
      router.push(data.payUrl);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-12">
      <h1 className="font-display text-3xl font-semibold">Checkout</h1>

      <Card className="p-5">
        <h2 className="mb-3 text-sm font-semibold text-[var(--color-muted)]">Order summary</h2>
        <ul className="flex flex-col gap-2">
          {items.map((i) => (
            <li key={i.slug} className="flex justify-between text-sm">
              <span>
                {i.name} <span className="text-[var(--color-subtle)]">× {i.qty}</span>
              </span>
              <span className="font-mono">{formatUsd(i.price * i.qty)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex justify-between border-t border-[var(--color-border)] pt-3 font-semibold">
          <span>Total</span>
          <span className="font-display">{formatUsd(total)}</span>
        </div>
      </Card>

      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email for your receipt</Label>
          <Input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="coin">Pay with</Label>
          <Select id="coin" value={coin} onChange={(e) => setCoin(e.target.value as Coin)}>
            {COINS.map((c) => (
              <option key={c.coin} value={c.coin}>
                {c.label}
              </option>
            ))}
          </Select>
        </div>

        {error && (
          <p className="text-sm text-[color-mix(in_oklab,var(--color-ember)_75%,white)]">{error}</p>
        )}

        <Button
          type="submit"
          disabled={submitting || redirecting}
          rightIcon={<ArrowRight className="h-4 w-4" />}
        >
          {submitting || redirecting ? 'Creating order…' : `Pay ${formatUsd(total)}`}
        </Button>
      </form>
    </main>
  );
}
