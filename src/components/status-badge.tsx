import { CheckCircle2, CircleSlash, Clock, XCircle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import type { OrderStatus } from '@/lib/payments/types';

import { Badge, type BadgeTone } from './ui/badge';

const MAP: Record<OrderStatus, { label: string; tone: BadgeTone; Icon: LucideIcon }> = {
  pending: { label: 'Pending', tone: 'amber', Icon: Clock },
  paid: { label: 'Paid', tone: 'emerald', Icon: CheckCircle2 },
  expired: { label: 'Expired', tone: 'neutral', Icon: CircleSlash },
  cancelled: { label: 'Cancelled', tone: 'ember', Icon: XCircle },
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  const { label, tone, Icon } = MAP[status] ?? MAP.pending;
  return (
    <Badge tone={tone}>
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {label}
    </Badge>
  );
}
