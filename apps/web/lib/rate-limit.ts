import { Ratelimit } from '@upstash/ratelimit';
import { redis } from '@/lib/redis';

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
  try {
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
  } catch (error) {
    console.error('Rate limit check failed, allowing request:', error);
    return {
      success: true,
      remaining: -1,
      resetAt: new Date(),
      headers: {
        'X-RateLimit-Limit': plan === 'free' ? '60' : '300',
        'X-RateLimit-Remaining': '-1',
        'X-RateLimit-Reset': '0',
      },
    };
  }
}

// Dashboard rate limiter (60 req/min per user)
const dashboardLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, '1 m'),
  analytics: true,
  prefix: 'gotcha:ratelimit:dashboard',
});

export async function checkDashboardRateLimit(userId: string): Promise<{ success: boolean }> {
  try {
    const { success } = await dashboardLimiter.limit(userId);
    return { success };
  } catch (error) {
    console.error('Dashboard rate limit check failed, allowing request:', error);
    return { success: true };
  }
}

// Read rate limiters for public API GET endpoints
const readRateLimiters = {
  free: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(120, '1 m'),
    analytics: true,
    prefix: 'gotcha:ratelimit:read:free',
  }),
  pro: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(600, '1 m'),
    analytics: true,
    prefix: 'gotcha:ratelimit:read:pro',
  }),
};

export async function checkReadRateLimit(
  identifier: string,
  plan: PlanType = 'free'
): Promise<{ success: boolean }> {
  try {
    const limiter = readRateLimiters[plan];
    const { success } = await limiter.limit(identifier);
    return { success };
  } catch (error) {
    console.error('Read rate limit check failed, allowing request:', error);
    return { success: true };
  }
}

// Rate limiter for sensitive org management operations (invitations, member changes)
export const orgManagementLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, '1 h'),
  analytics: true,
  prefix: 'gotcha:ratelimit:org-mgmt',
});

// Rate limiter for public-roadmap upvotes. Keyed by IP. 10 votes per 5 min
// is generous for legitimate voters (one user rarely cares about more than
// a handful of features in a sitting) but tight enough that a scripted
// attacker spraying distinct (responseId, voterHash) rows is capped.
// Per-row dedup is still enforced at the DB layer by the unique constraint.
export const upvoteLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '5 m'),
  analytics: true,
  prefix: 'gotcha:ratelimit:upvote',
});

export async function checkIdempotency(
  key: string,
  apiKeyId: string
): Promise<{ isDuplicate: boolean; cachedResponse?: string }> {
  try {
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
  } catch (error) {
    console.error('Idempotency check failed, allowing request:', error);
    return { isDuplicate: false };
  }
}

export async function cacheIdempotencyResponse(
  key: string,
  apiKeyId: string,
  response: string
): Promise<void> {
  try {
    // Overwrite the "pending" value with the actual response
    const redisKey = `gotcha:idempotency:response:${apiKeyId}:${key}`;
    await redis.set(redisKey, response, { ex: 300 });
  } catch (error) {
    console.error('Failed to cache idempotency response:', error);
  }
}
