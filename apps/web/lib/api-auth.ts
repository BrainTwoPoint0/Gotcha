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

// Validate origin against allowed domains (deterministic, no regex)
function validateOrigin(origin: string | null, allowedDomains: string[]): boolean {
  // Allow requests with no origin (server-to-server, Postman, etc.)
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
        message: 'Invalid API key format',
        status: 401,
      },
    };
  }

  const keyHash = hashApiKey(key);

  // Look up the API key
  const apiKey = await prisma.apiKey.findFirst({
    where: {
      keyHash,
      revokedAt: null,
    },
    include: {
      project: {
        include: {
          organization: {
            include: {
              subscription: true,
            },
          },
        },
      },
    },
  });

  if (!apiKey) {
    return {
      success: false,
      error: {
        code: 'INVALID_API_KEY',
        message: 'The provided API key is invalid or revoked',
        status: 401,
      },
    };
  }

  // Validate origin
  const origin = request.headers.get('origin');
  if (!validateOrigin(origin, apiKey.allowedDomains)) {
    return {
      success: false,
      error: {
        code: 'ORIGIN_NOT_ALLOWED',
        message: 'This API key is not authorized for this domain',
        status: 403,
      },
    };
  }

  // Update last used timestamp (fire-and-forget to avoid blocking the response)
  prisma.apiKey
    .update({
      where: { id: apiKey.id },
      data: { lastUsedAt: new Date() },
    })
    .catch(() => {});

  const plan = apiKey.project.organization.subscription?.plan ?? 'FREE';

  return {
    success: true,
    apiKey: {
      id: apiKey.id,
      projectId: apiKey.projectId,
      organizationId: apiKey.project.organizationId,
      plan,
      allowedDomains: apiKey.allowedDomains,
    },
  };
}

// CORS headers for API responses
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, Idempotency-Key',
};

// Helper to create error responses with CORS headers
export function apiError(code: string, message: string, status: number) {
  return Response.json({ error: { code, message, status } }, { status, headers: corsHeaders });
}

// Helper to create success responses with CORS headers
export function apiSuccess<T>(
  data: T,
  status: number = 200,
  extraHeaders?: Record<string, string>
) {
  return Response.json(data, {
    status,
    headers: { ...corsHeaders, ...extraHeaders },
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
