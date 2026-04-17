import { NextRequest } from 'next/server';
import { prisma } from './prisma';
import { createHash, randomBytes } from 'crypto';
import type { Plan } from '@prisma/client';

export interface ApiKeyData {
  id: string;
  projectId: string;
  organizationId: string;
  plan: Plan;
  allowedDomains: string[];
}

export type ApiAuthResult =
  | {
      success: true;
      apiKey: ApiKeyData;
    }
  | {
      success: false;
      error: {
        code: string;
        message: string;
        status: number;
      };
    };

// Hash API key for secure lookup
function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

// In-process LRU cache for validated API keys. Keyed by sha256(key); the
// hash IS the auth boundary so staleness here can't grant access — a
// revoked key simply stays "valid" in the cache for up to CACHE_TTL_MS
// before the entry expires. Good enough for billing / plan-gate signals
// which don't need second-level precision. Per-Lambda-instance memory
// means a cold start pays the DB lookup once and amortises across all
// subsequent submissions on that container.
type CacheEntry = { data: ApiKeyData; expires: number };
const apiKeyCache = new Map<string, CacheEntry>();
const API_KEY_CACHE_MAX = 500; // per-instance cap
const API_KEY_CACHE_TTL_MS = 60_000; // 60s

function cacheGet(keyHash: string): ApiKeyData | null {
  const entry = apiKeyCache.get(keyHash);
  if (!entry) return null;
  if (entry.expires < Date.now()) {
    apiKeyCache.delete(keyHash);
    return null;
  }
  return entry.data;
}

function cacheSet(keyHash: string, data: ApiKeyData): void {
  // Naive LRU: when at cap, drop the oldest insertion (Map preserves
  // insertion order). Good enough for 500 entries.
  if (apiKeyCache.size >= API_KEY_CACHE_MAX) {
    const firstKey = apiKeyCache.keys().next().value;
    if (firstKey) apiKeyCache.delete(firstKey);
  }
  apiKeyCache.set(keyHash, { data, expires: Date.now() + API_KEY_CACHE_TTL_MS });
}

/**
 * Invalidate a cached API key. Call this from the API key revocation
 * path so revocations propagate immediately rather than waiting for the
 * 60s TTL. Safe to call from anywhere; no-op on cold instances that
 * never saw the key.
 *
 * Note: this only clears the cache on the Lambda instance that runs it.
 * Other warm instances retain their cached entry until TTL expiry — the
 * documented worst-case propagation is one TTL window. If instant
 * cross-fleet revocation is ever required, broadcast over Redis pub/sub
 * (see `lib/redis.ts`) and have each instance subscribe on cold start.
 */
export function invalidateApiKeyCache(keyHash: string): void {
  apiKeyCache.delete(keyHash);
}

/**
 * Invalidate every cached entry whose `ApiKeyData.organizationId` matches.
 * Used on plan changes (Stripe subscription.updated / subscription.deleted)
 * so the new plan is picked up on the next submission without waiting for
 * TTL expiry. Walks the Map once — O(n) over the cache size, capped at
 * API_KEY_CACHE_MAX (500). Cheap compared to the DB roundtrip it prevents.
 */
export function invalidateApiKeyCacheByOrganization(organizationId: string): void {
  // Array.from() snapshot avoids the "can't iterate MapIterator at current
  // target" TS complaint and also means we can safely delete during
  // iteration without mutating the underlying Map's iterator state.
  for (const [hash, entry] of Array.from(apiKeyCache.entries())) {
    if (entry.data.organizationId === organizationId) {
      apiKeyCache.delete(hash);
    }
  }
}

// Validate origin against allowed domains (deterministic, no regex)
function validateOrigin(origin: string | null, allowedDomains: string[]): boolean {
  // Allow requests with no origin (server-to-server, Postman, etc.)
  // Note: allowedDomains is browser-only defense-in-depth, not a security boundary.
  // Server-to-server SDK usage legitimately has no Origin header.
  if (!origin) return true;

  // If no domains configured, allow all (not recommended for production)
  if (!allowedDomains.length) return true;

  let parsedOrigin: URL;
  try {
    parsedOrigin = new URL(origin);
  } catch {
    return false;
  }

  const originHost = parsedOrigin.hostname;
  const originPort = parsedOrigin.port;

  return allowedDomains.some((pattern) => {
    const [patternHost, patternPort] = pattern.split(':');

    // Check host: wildcard prefix match
    const hostMatch =
      patternHost === '*' ||
      originHost === patternHost ||
      (patternHost.startsWith('*.') && originHost.endsWith(patternHost.slice(1)));

    // Check port if specified
    const portMatch = !patternPort || patternPort === '*' || originPort === patternPort;

    return hostMatch && portMatch;
  });
}

export async function validateApiKey(request: NextRequest): Promise<ApiAuthResult> {
  const authHeader = request.headers.get('authorization');

  if (!authHeader) {
    return {
      success: false,
      error: {
        code: 'INVALID_API_KEY',
        message: 'Authorization header is required',
        status: 401,
      },
    };
  }

  const key = authHeader.replace('Bearer ', '');

  if (!key || !key.startsWith('gtch_') || key.length < 30 || key.length > 100) {
    return {
      success: false,
      error: {
        code: 'INVALID_API_KEY',
        message: 'Invalid API key',
        status: 401,
      },
    };
  }

  const keyHash = hashApiKey(key);

  // Cache hit path — skip the Prisma round-trip entirely.
  const cached = cacheGet(keyHash);
  let apiKeyData: ApiKeyData;
  if (cached) {
    apiKeyData = cached;
  } else {
    const apiKey = await prisma.apiKey.findUnique({
      where: { keyHash },
      select: {
        id: true,
        projectId: true,
        allowedDomains: true,
        revokedAt: true,
        project: {
          select: {
            organizationId: true,
            organization: {
              select: {
                subscription: { select: { plan: true, status: true } },
              },
            },
          },
        },
      },
    });

    if (!apiKey || apiKey.revokedAt !== null) {
      return {
        success: false,
        error: {
          code: 'INVALID_API_KEY',
          message: 'Invalid API key',
          status: 401,
        },
      };
    }

    // Effective plan = actual plan, but downgraded to FREE when the
    // subscription status isn't ACTIVE or TRIALING. Dunning (PAST_DUE),
    // cancellation (CANCELED), and failed-payment (incomplete) all fall
    // back to FREE so we stop granting PRO benefits (unlimited responses,
    // webhooks, bug-report emails) to non-paying customers. Stripe
    // webhooks flip `status` within seconds; cache eviction on the
    // relevant events makes this take effect on the next submission.
    const subscription = apiKey.project.organization.subscription;
    const rawPlan = subscription?.plan ?? 'FREE';
    const subStatus = subscription?.status ?? 'ACTIVE';
    const effectivePlan =
      rawPlan === 'PRO' && subStatus !== 'ACTIVE' && subStatus !== 'TRIALING' ? 'FREE' : rawPlan;

    apiKeyData = {
      id: apiKey.id,
      projectId: apiKey.projectId,
      organizationId: apiKey.project.organizationId,
      plan: effectivePlan,
      allowedDomains: apiKey.allowedDomains,
    };
    cacheSet(keyHash, apiKeyData);
  }

  // Validate origin
  const origin = request.headers.get('origin');
  if (!validateOrigin(origin, apiKeyData.allowedDomains)) {
    return {
      success: false,
      error: {
        code: 'ORIGIN_NOT_ALLOWED',
        message: 'This API key is not authorized for this domain',
        status: 403,
      },
    };
  }

  // Sampled lastUsedAt — update on ~1% of requests. Dashboard "last used"
  // loses second-level precision but the hot row stops being the write-
  // contention choke point on popular keys. Full-precision use-cases
  // (audit, forensics) can query the Response.createdAt index instead.
  if (Math.random() < 0.01) {
    prisma.apiKey
      .update({
        where: { id: apiKeyData.id },
        data: { lastUsedAt: new Date() },
      })
      .catch(() => {});
  }

  return {
    success: true,
    apiKey: apiKeyData,
  };
}

// Dynamic CORS headers — reflect validated origin instead of wildcard
export function getCorsHeaders(origin?: string | null): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Idempotency-Key',
    ...(origin ? { Vary: 'Origin' } : {}),
  };
}

// Static fallback for OPTIONS preflight (no auth context available)
export const corsHeaders = getCorsHeaders();

// Helper to create error responses with CORS headers
export function apiError(code: string, message: string, status: number, origin?: string | null) {
  return Response.json(
    { error: { code, message, status } },
    { status, headers: getCorsHeaders(origin) }
  );
}

// Helper to create success responses with CORS headers
export function apiSuccess<T>(
  data: T,
  status: number = 200,
  extraHeaders?: Record<string, string>,
  origin?: string | null
) {
  return Response.json(data, {
    status,
    headers: { ...getCorsHeaders(origin), ...extraHeaders },
  });
}

// Generate a new API key
export function generateApiKey(type: 'live' | 'test' = 'live'): { key: string; hash: string } {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const bytes = randomBytes(32);
  const randomPart = Array.from(bytes, (b) => chars[b % chars.length]).join('');

  const key = `gtch_${type}_${randomPart}`;
  const hash = hashApiKey(key);

  return { key, hash };
}
