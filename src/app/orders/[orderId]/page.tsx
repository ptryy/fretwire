import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { getOrder } from '@/lib/store/orders';

export const metadata: Metadata = { title: 'Order', robots: { index: false } };

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-1 border-t border-[var(--color-border)] py-3 first:border-t-0">
      <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-subtle)]">
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
  const order = await getOrder(orderId);
  if (!order) notFound();

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-semibold">Order</h1>
        <StatusBadge status={order.status} />
      </div>

      <Card className="px-5 py-3">
        <Row label="Order ID" value={order.externalOrderId} mono />
        <Row label="Amount" value={`${order.amount} ${order.coin}`} />
        {order.network && <Row label="Network" value={order.network} />}
        {order.address && <Row label="Pay-to address" value={order.address} mono />}
        {order.transactionHash && <Row label="Transaction" value={order.transactionHash} mono />}
        {order.paidAt && <Row label="Paid at" value={order.paidAt} />}
        {order.expiresAt && <Row label="Expires at" value={order.expiresAt} />}
      </Card>

      <div className="flex gap-3">
        {order.status === 'pending' && (
          <Link href={`/pay/${order.externalOrderId}`}>
            <Button>Continue payment</Button>
          </Link>
        )}
        <Link href="/products">
          <Button variant="outline">Continue shopping</Button>
        </Link>
      </div>
    </main>
  );
}
