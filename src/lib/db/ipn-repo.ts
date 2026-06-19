import { getDb } from './index';

/**
 * IPN idempotency ledger. Returns `true` the first time a delivery id is seen,
 * `false` on any repeat — so a retried/duplicated callback is acknowledged but
 * processed at most once.
 */
export function markDelivered(deliveryId: string): boolean {
  const info = getDb()
    .prepare('INSERT OR IGNORE INTO np_ipn_delivery (delivery_id, received_at) VALUES (?, ?)')
    .run(deliveryId, new Date().toISOString());
  return info.changes === 1;
}
