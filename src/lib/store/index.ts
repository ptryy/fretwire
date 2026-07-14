import { MemoryStore } from './memory-store';
import { RedisStore } from './redis-store';
import type { Store } from './types';

let cached: Store | null = null;

/** Redis when KV env is present (Vercel), otherwise an in-process map (local). */
export function getStore(): Store {
  if (cached) return cached;
  const hasRedis = Boolean(process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL);
  cached = hasRedis ? new RedisStore() : new MemoryStore();
  return cached;
}

/**
 * Whether writes outlive a single instance. `MemoryStore` does not: on serverless
 * each invocation (Vercel) or isolate (Workers) gets its own map, so an override
 * written by one request is invisible to the next. `/dev/config` surfaces this,
 * so a vanishing override reads as a setup gap rather than a bug.
 */
export function isPersistentStore(): boolean {
  return getStore() instanceof RedisStore;
}
