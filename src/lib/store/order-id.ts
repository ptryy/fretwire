/**
 * Order id generation. The gateway requires `externalOrderId` to be a positive
 * integer, so ids stay numeric; we keep them short (6 digits) for readability —
 * they double as the on-chain memo/tag and the pay-page URL slug. Because the
 * space is small (900k), allocation is collision-checked against the store.
 */

const MIN = 100_000;
const RANGE = 900_000; // 100000..999999 inclusive

/** A random 6-digit numeric id as a string. `rand` is injectable for tests. */
export function randomOrderId(rand: () => number = Math.random): string {
  return String(Math.floor(rand() * RANGE) + MIN);
}

/**
 * A 6-digit id not already present in the store. `taken` reports whether a
 * candidate id already exists; we retry until a free one is found, throwing
 * after `maxAttempts` (effectively unreachable at demo scale).
 */
export async function uniqueOrderId(
  taken: (id: string) => Promise<boolean>,
  rand: () => number = Math.random,
  maxAttempts = 10,
): Promise<string> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const id = randomOrderId(rand);
    if (!(await taken(id))) return id;
  }
  throw new Error('could not allocate a unique order id');
}
