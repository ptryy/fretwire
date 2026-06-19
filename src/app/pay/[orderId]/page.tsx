import { notFound } from 'next/navigation';

import { PayPanel } from '@/components/pay-panel';
import { getOrder } from '@/lib/db/orders-repo';
import { env } from '@/lib/env';

export default async function PayPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const order = getOrder(orderId);
  if (!order || !order.address || !order.expiresAt) notFound();

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <PayPanel
        orderId={orderId}
        mock={env.mode === 'mock'}
        initial={{
          status: order.status,
          address: order.address,
          amount: order.amount,
          coin: order.coin,
          network: order.network,
          memo: order.memo,
          expiresAt: order.expiresAt,
        }}
      />
    </main>
  );
}
