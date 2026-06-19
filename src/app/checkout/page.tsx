'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { useCart } from '@/components/cart-provider';
import { formatUsd } from '@/lib/format';

const COINS = [
  { coin: 'USDT', label: 'USDT · ERC20' },
  { coin: 'ETH', label: 'ETH' },
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
      <main className="mx-auto flex max-w-3xl flex-col items-center gap-4 px-6 py-20 text-center">
        <h1 className="text-2xl font-semibold">Nothing to check out</h1>
        <Link href="/products" className="text-[var(--color-accent)] hover:underline">
          Browse products
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
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-10">
      <h1 className="text-2xl font-semibold">Checkout</h1>

      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <h2 className="mb-3 text-sm font-semibold text-[var(--color-muted)]">Order summary</h2>
        <ul className="flex flex-col gap-2">
          {items.map((i) => (
            <li key={i.slug} className="flex justify-between text-sm">
              <span>
                {i.name} × {i.qty}
              </span>
              <span>{formatUsd(i.price * i.qty)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex justify-between border-t border-[var(--color-border)] pt-3 font-semibold">
          <span>Total</span>
          <span>{formatUsd(total)}</span>
        </div>
      </div>

      <form onSubmit={submit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Email (for your receipt)</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm focus:border-[var(--color-accent)] focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Pay with</span>
          <select
            value={coin}
            onChange={(e) => setCoin(e.target.value as Coin)}
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm focus:border-[var(--color-accent)] focus:outline-none"
          >
            {COINS.map((c) => (
              <option key={c.coin} value={c.coin}>
                {c.label}
              </option>
            ))}
          </select>
        </label>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={submitting || redirecting}
          className="rounded-lg bg-[var(--color-accent)] px-5 py-2.5 font-medium text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {submitting || redirecting ? 'Creating order…' : `Pay ${formatUsd(total)}`}
        </button>
      </form>
    </main>
  );
}
