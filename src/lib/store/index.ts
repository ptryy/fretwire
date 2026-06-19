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
