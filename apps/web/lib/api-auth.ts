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
 */
export function invalidateApiKeyCache(keyHash: string): void {
  apiKeyCache.delete(keyHash);
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
                subscription: { select: { plan: true } },
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

    apiKeyData = {
      id: apiKey.id,
      projectId: apiKey.projectId,
      organizationId: apiKey.project.organizationId,
      plan: apiKey.project.organization.subscription?.plan ?? 'FREE',
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
