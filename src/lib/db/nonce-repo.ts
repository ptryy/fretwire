import { getDb } from './index';

/**
 * Per-publicKey strictly-increasing nonce. Uses an atomic upsert with
 * `Date.now()` as a floor so values stay monotonic across restarts (the floor
 * always advances) while `last_nonce + 1` guarantees strict increase within the
 * same millisecond. `RETURNING` makes the read+write a single statement.
 */
export function nextNonce(publicKey: string): number {
  const floor = Date.now();
  const row = getDb()
    .prepare(
      `INSERT INTO np_nonce (public_key, last_nonce) VALUES (@publicKey, @floor)
       ON CONFLICT(public_key) DO UPDATE SET last_nonce = MAX(last_nonce + 1, @floor)
       RETURNING last_nonce`,
    )
    .get({ publicKey, floor }) as { last_nonce: number };
  return row.last_nonce;
}
