import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Rate limiters for different plans
export const rateLimiters = {
  free: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(60, '1 m'),
    analytics: true,
    prefix: 'gotcha:ratelimit:free',
  }),
  pro: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(300, '1 m'),
    analytics: true,
    prefix: 'gotcha:ratelimit:pro',
  }),
};

export type PlanType = keyof typeof rateLimiters;

export async function checkRateLimit(identifier: string, plan: PlanType = 'free') {
  const limiter = rateLimiters[plan];
  const { success, remaining, reset } = await limiter.limit(identifier);

  return {
    success,
    remaining,
    resetAt: new Date(reset),
    headers: {
      'X-RateLimit-Limit': plan === 'free' ? '60' : '300',
      'X-RateLimit-Remaining': remaining.toString(),
      'X-RateLimit-Reset': reset.toString(),
    },
  };
}

// Rate limiter for sensitive org management operations (invitations, member changes)
export const orgManagementLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, '1 h'),
  analytics: true,
  prefix: 'gotcha:ratelimit:org-mgmt',
});

export async function checkIdempotency(
  key: string,
  apiKeyId: string
): Promise<{ isDuplicate: boolean; cachedResponse?: string }> {
  const redisKey = `gotcha:idempotency:response:${apiKeyId}:${key}`;

  // Atomic claim: SET NX ensures only one request can own this key
  const claimed = await redis.set(redisKey, 'pending', { nx: true, ex: 300 });
  if (claimed === null) {
    // Another request owns this key — check if it has a cached response
    const cached = await redis.get<string>(redisKey);
    if (cached && cached !== 'pending') {
      return { isDuplicate: true, cachedResponse: cached };
    }
    // Still pending (concurrent request in flight) — treat as duplicate
    return { isDuplicate: true };
  }
  return { isDuplicate: false };
}

export async function cacheIdempotencyResponse(
  key: string,
  apiKeyId: string,
  response: string
): Promise<void> {
  // Overwrite the "pending" value with the actual response
  const redisKey = `gotcha:idempotency:response:${apiKeyId}:${key}`;
  await redis.set(redisKey, response, { ex: 300 });
}
