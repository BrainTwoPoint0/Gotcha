import '@/lib/env';
import { Redis } from '@upstash/redis';

// Singleton Upstash Redis client.
//
// Historically each module that needed Redis instantiated its own client
// (rate limiters, idempotency cache, the analytics-revalidate debounce in
// the submission route). Upstash's REST client is stateless, so duplicating
// the constructor was functionally harmless — but it made retry / timeout /
// tracing config a drift vector, and meant any future swap (e.g. to a
// tenant-aware client) had to touch N call sites.
//
// Importing `redis` from here is now the single supported path. The only
// expected exception is the Ratelimit constructor from `@upstash/ratelimit`,
// which needs a Redis instance passed in — it uses this same singleton.
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});
