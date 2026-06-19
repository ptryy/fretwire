import Link from 'next/link';
import { notFound } from 'next/navigation';

import { getOrder } from '@/lib/db/orders-repo';

export default async function OrderSuccessPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const order = getOrder(orderId);
  if (!order) notFound();

  const paid = order.status === 'paid';

  return (
    <main className="mx-auto flex max-w-xl flex-col items-center gap-5 px-6 py-20 text-center">
      <span
        className={`flex h-16 w-16 items-center justify-center rounded-full text-3xl ${
          paid ? 'bg-emerald-500/15 text-emerald-300' : 'bg-amber-500/15 text-amber-300'
        }`}
      >
        {paid ? '✓' : '…'}
      </span>
      <h1 className="text-2xl font-semibold">
        {paid ? 'Payment confirmed' : 'Payment not confirmed yet'}
      </h1>
      <p className="text-[var(--color-muted)]">
        {paid
          ? `We received ${order.amount} ${order.coin}. A receipt was sent to ${order.email ?? 'your email'}.`
          : 'This order has not been marked paid yet.'}
      </p>

      {paid && order.transactionHash && (
        <p className="break-all rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 font-mono text-xs text-[var(--color-muted)]">
          {order.transactionHash}
        </p>
      )}

      <div className="flex gap-3">
        <Link
          href={`/orders/${order.externalOrderId}`}
          className="rounded-lg border border-[var(--color-border)] px-5 py-2.5 text-sm transition hover:border-[var(--color-accent)]"
        >
          View order
        </Link>
        <Link
          href="/products"
          className="rounded-lg bg-[var(--color-accent)] px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
        >
          Continue shopping
        </Link>
      </div>
    </main>
  );
}
