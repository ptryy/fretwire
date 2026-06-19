import type { OrderStatus } from '../payments/types';

import { getStore } from './index';
import type { StoredOrder } from './types';

export type { StoredOrder } from './types';

export async function createLocalOrder(o: {
  externalOrderId: string;
  email: string;
  coin: string;
  network?: string | null;
  amount: number;
  cartJson: string;
}): Promise<void> {
  const now = new Date().toISOString();
  await getStore().createOrder({
    externalOrderId: o.externalOrderId,
    npOrderId: null,
    status: 'pending',
    coin: o.coin,
    network: o.network ?? null,
    amount: o.amount,
    address: null,
    memo: null,
    expiresAt: null,
    paidAt: null,
    transactionHash: null,
    ipnStatus: null,
    ipnDeliveredAt: null,
    email: o.email,
    cartJson: o.cartJson,
    createdAt: now,
    updatedAt: now,
  });
}

export async function getOrder(externalOrderId: string): Promise<StoredOrder | null> {
  return getStore().getOrder(externalOrderId);
}

export async function setGatewayFields(
  externalOrderId: string,
  fields: {
    npOrderId: string;
    address: string;
    memo?: string;
    amount: number | string;
    coin: string;
    network?: string;
    expiresAt: string;
    status: OrderStatus;
  },
): Promise<void> {
  await getStore().updateOrder(externalOrderId, {
    npOrderId: fields.npOrderId,
    address: fields.address,
    memo: fields.memo ?? null,
    amount: typeof fields.amount === 'string' ? Number(fields.amount) : fields.amount,
    coin: fields.coin,
    network: fields.network ?? null,
    expiresAt: fields.expiresAt,
    status: fields.status,
  });
}

export async function markStatus(
  externalOrderId: string,
  fields: {
    status: OrderStatus;
    transactionHash?: string | null;
    paidAt?: string | null;
    ipnStatus?: string | null;
    ipnDeliveredAt?: string | null;
  },
): Promise<void> {
  const patch: Partial<StoredOrder> = { status: fields.status };
  if (fields.transactionHash != null) patch.transactionHash = fields.transactionHash;
  if (fields.paidAt != null) patch.paidAt = fields.paidAt;
  if (fields.ipnStatus != null) patch.ipnStatus = fields.ipnStatus;
  if (fields.ipnDeliveredAt != null) patch.ipnDeliveredAt = fields.ipnDeliveredAt;
  await getStore().updateOrder(externalOrderId, patch);
}
