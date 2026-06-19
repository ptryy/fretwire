import Link from 'next/link';
import { notFound } from 'next/navigation';

import { StatusBadge } from '@/components/status-badge';
import { getOrder } from '@/lib/db/orders-repo';

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-1 border-t border-[var(--color-border)] py-3 first:border-t-0">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">
        {label}
      </span>
      <span className={mono ? 'break-all font-mono text-sm' : 'text-sm'}>{value}</span>
    </div>
  );
}

export default async function OrderTrackingPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const order = getOrder(orderId);
  if (!order) notFound();

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Order</h1>
        <StatusBadge status={order.status} />
      </div>

      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-3">
        <Row label="Order ID" value={order.externalOrderId} mono />
        <Row label="Amount" value={`${order.amount} ${order.coin}`} />
        {order.network && <Row label="Network" value={order.network} />}
        {order.address && <Row label="Pay-to address" value={order.address} mono />}
        {order.transactionHash && <Row label="Transaction" value={order.transactionHash} mono />}
        {order.paidAt && <Row label="Paid at" value={order.paidAt} />}
        {order.expiresAt && <Row label="Expires at" value={order.expiresAt} />}
      </div>

      <div className="flex gap-3">
        {order.status === 'pending' && (
          <Link
            href={`/pay/${order.externalOrderId}`}
            className="rounded-lg bg-[var(--color-accent)] px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
          >
            Continue payment
          </Link>
        )}
        <Link
          href="/products"
          className="rounded-lg border border-[var(--color-border)] px-5 py-2.5 text-sm transition hover:border-[var(--color-accent)]"
        >
          Continue shopping
        </Link>
      </div>
    </main>
  );
}
