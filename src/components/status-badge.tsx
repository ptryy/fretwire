import type { OrderStatus } from '@/lib/payments/types';

const STYLES: Record<OrderStatus, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
  paid: { label: 'Paid', className: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
  expired: { label: 'Expired', className: 'bg-zinc-500/15 text-zinc-300 border-zinc-500/30' },
  cancelled: { label: 'Cancelled', className: 'bg-red-500/15 text-red-300 border-red-500/30' },
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  const s = STYLES[status] ?? STYLES.pending;
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${s.className}`}
    >
      {s.label}
    </span>
  );
}
