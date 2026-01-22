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
  starter: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(120, '1 m'),
    analytics: true,
    prefix: 'gotcha:ratelimit:starter',
  }),
  pro: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(300, '1 m'),
    analytics: true,
    prefix: 'gotcha:ratelimit:pro',
  }),
  enterprise: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(1000, '1 m'),
    analytics: true,
    prefix: 'gotcha:ratelimit:enterprise',
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
      'X-RateLimit-Limit':
        plan === 'free' ? '60' : plan === 'starter' ? '120' : plan === 'pro' ? '300' : '1000',
      'X-RateLimit-Remaining': remaining.toString(),
      'X-RateLimit-Reset': reset.toString(),
    },
  };
}

// Idempotency key storage (5-minute window)
const idempotencyCache = new Ratelimit({
  redis,
  limiter: Ratelimit.fixedWindow(1, '5 m'),
  prefix: 'gotcha:idempotency',
});

export async function checkIdempotency(
  key: string
): Promise<{ isDuplicate: boolean; cachedResponse?: string }> {
  // Check if this key was already used
  const cached = await redis.get<string>(`gotcha:idempotency:response:${key}`);
  if (cached) {
    return { isDuplicate: true, cachedResponse: cached };
  }
  return { isDuplicate: false };
}

export async function cacheIdempotencyResponse(key: string, response: string): Promise<void> {
  // Cache the response for 5 minutes
  await redis.set(`gotcha:idempotency:response:${key}`, response, { ex: 300 });
}
