import { CheckCircle2, Clock } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { getOrder } from '@/lib/store/orders';

export const metadata: Metadata = { title: 'Payment confirmed', robots: { index: false } };

export default async function OrderSuccessPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const order = await getOrder(orderId);
  if (!order) notFound();

  const paid = order.status === 'paid';

  return (
    <main className="mx-auto flex max-w-xl flex-col items-center gap-5 px-6 py-24 text-center">
      <span
        className={
          paid
            ? 'flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300'
            : 'flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-amber-soft)] text-[var(--color-amber)]'
        }
      >
        {paid ? <CheckCircle2 className="h-8 w-8" /> : <Clock className="h-8 w-8" />}
      </span>
      <h1 className="font-display text-3xl font-semibold">
        {paid ? 'Payment confirmed' : 'Payment not confirmed yet'}
      </h1>
      <p className="text-[var(--color-muted)]">
        {paid
          ? `We received ${order.amount} ${order.coin}. A receipt is on its way to ${order.email ?? 'your email'}.`
          : 'This order has not been marked paid yet.'}
      </p>

      {paid && order.transactionHash && (
        <p className="break-all rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 font-mono text-xs text-[var(--color-subtle)]">
          {order.transactionHash}
        </p>
      )}

      <div className="flex gap-3">
        <Link href={`/orders/${order.externalOrderId}`}>
          <Button variant="outline">View order</Button>
        </Link>
        <Link href="/products">
          <Button>Continue shopping</Button>
        </Link>
      </div>
    </main>
  );
}
