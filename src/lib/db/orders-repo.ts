import type { OrderStatus } from '../payments/types';

import { getDb } from './index';

export type StoredOrder = {
  externalOrderId: string;
  npOrderId: string | null;
  status: OrderStatus;
  coin: string;
  network: string | null;
  amount: number;
  address: string | null;
  memo: string | null;
  expiresAt: string | null;
  paidAt: string | null;
  transactionHash: string | null;
  ipnStatus: string | null;
  ipnDeliveredAt: string | null;
  email: string | null;
  cartJson: string;
  createdAt: string;
  updatedAt: string;
};

type OrderRow = {
  external_order_id: string;
  np_order_id: string | null;
  status: OrderStatus;
  coin: string;
  network: string | null;
  amount: number;
  address: string | null;
  memo: string | null;
  expires_at: string | null;
  paid_at: string | null;
  transaction_hash: string | null;
  ipn_status: string | null;
  ipn_delivered_at: string | null;
  email: string | null;
  cart_json: string;
  created_at: string;
  updated_at: string;
};

const toOrder = (r: OrderRow): StoredOrder => ({
  externalOrderId: r.external_order_id,
  npOrderId: r.np_order_id,
  status: r.status,
  coin: r.coin,
  network: r.network,
  amount: r.amount,
  address: r.address,
  memo: r.memo,
  expiresAt: r.expires_at,
  paidAt: r.paid_at,
  transactionHash: r.transaction_hash,
  ipnStatus: r.ipn_status,
  ipnDeliveredAt: r.ipn_delivered_at,
  email: r.email,
  cartJson: r.cart_json,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

export function createLocalOrder(o: {
  externalOrderId: string;
  email: string;
  coin: string;
  network?: string | null;
  amount: number;
  cartJson: string;
}): void {
  const now = new Date().toISOString();
  getDb()
    .prepare(
      `INSERT INTO orders (external_order_id, status, coin, network, amount, email, cart_json, created_at, updated_at)
       VALUES (@externalOrderId, 'pending', @coin, @network, @amount, @email, @cartJson, @now, @now)`,
    )
    .run({ ...o, network: o.network ?? null, now });
}

export function getOrder(externalOrderId: string): StoredOrder | null {
  const row = getDb()
    .prepare('SELECT * FROM orders WHERE external_order_id = ?')
    .get(externalOrderId) as OrderRow | undefined;
  return row ? toOrder(row) : null;
}

export function findByNpOrderId(npOrderId: string): StoredOrder | null {
  const row = getDb().prepare('SELECT * FROM orders WHERE np_order_id = ?').get(npOrderId) as
    | OrderRow
    | undefined;
  return row ? toOrder(row) : null;
}

export function setGatewayFields(
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
): void {
  getDb()
    .prepare(
      `UPDATE orders SET np_order_id = @npOrderId, address = @address, memo = @memo,
         amount = @amount, coin = @coin, network = @network, expires_at = @expiresAt,
         status = @status, updated_at = @now
       WHERE external_order_id = @externalOrderId`,
    )
    .run({
      externalOrderId,
      npOrderId: fields.npOrderId,
      address: fields.address,
      memo: fields.memo ?? null,
      amount: typeof fields.amount === 'string' ? Number(fields.amount) : fields.amount,
      coin: fields.coin,
      network: fields.network ?? null,
      expiresAt: fields.expiresAt,
      status: fields.status,
      now: new Date().toISOString(),
    });
}

export function markStatus(
  externalOrderId: string,
  fields: {
    status: OrderStatus;
    transactionHash?: string | null;
    paidAt?: string | null;
    ipnStatus?: string | null;
    ipnDeliveredAt?: string | null;
  },
): void {
  getDb()
    .prepare(
      `UPDATE orders SET status = @status,
         transaction_hash = COALESCE(@transactionHash, transaction_hash),
         paid_at = COALESCE(@paidAt, paid_at),
         ipn_status = COALESCE(@ipnStatus, ipn_status),
         ipn_delivered_at = COALESCE(@ipnDeliveredAt, ipn_delivered_at),
         updated_at = @now
       WHERE external_order_id = @externalOrderId`,
    )
    .run({
      externalOrderId,
      status: fields.status,
      transactionHash: fields.transactionHash ?? null,
      paidAt: fields.paidAt ?? null,
      ipnStatus: fields.ipnStatus ?? null,
      ipnDeliveredAt: fields.ipnDeliveredAt ?? null,
      now: new Date().toISOString(),
    });
}
