import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateApiKey, apiError } from '@/lib/api-auth';
import {
  checkRateLimit,
  checkIdempotency,
  cacheIdempotencyResponse,
  type PlanType,
} from '@/lib/rate-limit';
import { submitResponseSchema, listResponsesSchema } from '@/lib/validations';

// Define types locally instead of importing Prisma enums
type ResponseMode = 'FEEDBACK' | 'VOTE' | 'POLL' | 'FEATURE_REQUEST' | 'AB';
type VoteType = 'UP' | 'DOWN';

// Map SDK mode strings to Prisma enums
const modeMap: Record<string, ResponseMode> = {
  feedback: 'FEEDBACK',
  vote: 'VOTE',
  poll: 'POLL',
  'feature-request': 'FEATURE_REQUEST',
  ab: 'AB',
};

const voteMap: Record<string, VoteType> = {
  up: 'UP',
  down: 'DOWN',
};

export async function POST(request: NextRequest) {
  try {
    // Validate API key
    const authResult = await validateApiKey(request);
    if (!authResult.success) {
      return apiError(authResult.error.code, authResult.error.message, authResult.error.status);
    }

    const { apiKey } = authResult;

    // Check rate limit
    const planKey = apiKey.plan.toLowerCase() as PlanType;
    const rateLimit = await checkRateLimit(apiKey.id, planKey);
    if (!rateLimit.success) {
      return apiError('RATE_LIMITED', 'Too many requests', 429);
    }

    // Parse request body
    const body = await request.json();

    // Validate request body
    const validation = submitResponseSchema.safeParse(body);
    if (!validation.success) {
      const firstError = validation.error.issues?.[0];
      return apiError('INVALID_REQUEST', firstError?.message || 'Invalid request body', 400);
    }

    const data = validation.data;

    // Check idempotency
    const idempotencyKey = request.headers.get('idempotency-key');
    if (idempotencyKey) {
      const idempotencyResult = await checkIdempotency(idempotencyKey);
      if (idempotencyResult.isDuplicate && idempotencyResult.cachedResponse) {
        const cached = JSON.parse(idempotencyResult.cachedResponse);
        return Response.json(
          { ...cached, status: 'duplicate' },
          {
            status: 201,
            headers: rateLimit.headers,
          }
        );
      }
    }

    // Get or create element
    let elementDbId: string | null = null;
    const existingElement = await prisma.element.findUnique({
      where: {
        projectId_elementId: {
          projectId: apiKey.projectId,
          elementId: data.elementId,
        },
      },
    });

    if (existingElement) {
      elementDbId = existingElement.id;
    } else {
      // Auto-create element on first feedback
      const newElement = await prisma.element.create({
        data: {
          projectId: apiKey.projectId,
          elementId: data.elementId,
        },
      });
      elementDbId = newElement.id;
    }

    // Create response
    const response = await prisma.response.create({
      data: {
        projectId: apiKey.projectId,
        elementId: elementDbId,
        elementIdRaw: data.elementId,
        mode: modeMap[data.mode],
        content: data.content,
        title: data.title,
        rating: data.rating,
        vote: data.vote ? voteMap[data.vote] : null,
        pollOptions: data.pollOptions,
        pollSelected: data.pollSelected,
        experimentId: data.experimentId,
        variant: data.variant,
        endUserId: data.user?.id,
        endUserMeta: (data.user || {}) as object,
        url: data.context?.url,
        userAgent: data.context?.userAgent,
        idempotencyKey: idempotencyKey,
      },
    });

    // Increment usage counter (fire and forget)
    prisma.subscription
      .updateMany({
        where: { organizationId: apiKey.organizationId },
        data: { responsesThisMonth: { increment: 1 } },
      })
      .catch(() => {
        // Ignore errors - this is non-critical
      });

    // Prepare response
    const result = {
      id: response.id,
      status: 'created' as const,
      createdAt: response.createdAt.toISOString(),
    };

    // For poll mode, include results if requested
    if (data.mode === 'poll' && data.pollOptions) {
      const pollResponses = await prisma.response.findMany({
        where: {
          projectId: apiKey.projectId,
          elementIdRaw: data.elementId,
          mode: 'POLL',
        },
        select: {
          pollSelected: true,
        },
      });

      // Count votes per option
      const results: Record<string, number> = {};
      data.pollOptions.forEach((opt) => {
        results[opt] = 0;
      });

      pollResponses.forEach((r: { pollSelected: unknown }) => {
        const selected = r.pollSelected as string[] | null;
        if (selected) {
          selected.forEach((s) => {
            if (results[s] !== undefined) {
              results[s]++;
            }
          });
        }
      });

      (result as Record<string, unknown>).results = results;
    }

    // Cache response for idempotency
    if (idempotencyKey) {
      await cacheIdempotencyResponse(idempotencyKey, JSON.stringify(result));
    }

    return Response.json(result, {
      status: 201,
      headers: rateLimit.headers,
    });
  } catch (error) {
    console.error('POST /api/v1/responses error:', error);
    return apiError('INTERNAL_ERROR', 'An unexpected error occurred', 500);
  }
}

export async function GET(request: NextRequest) {
  try {
    // Validate API key
    const authResult = await validateApiKey(request);
    if (!authResult.success) {
      return apiError(authResult.error.code, authResult.error.message, authResult.error.status);
    }

    const { apiKey } = authResult;

    // Parse query params
    const searchParams = request.nextUrl.searchParams;
    const params = {
      elementId: searchParams.get('elementId') || undefined,
      mode: searchParams.get('mode') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '20',
    };

    // Validate query params
    const validation = listResponsesSchema.safeParse(params);
    if (!validation.success) {
      const firstError = validation.error.issues?.[0];
      return apiError('INVALID_REQUEST', firstError?.message || 'Invalid query parameters', 400);
    }

    const { elementId, mode, startDate, endDate, page, limit } = validation.data;

    // Build where clause
    const where: Record<string, unknown> = {
      projectId: apiKey.projectId,
    };

    if (elementId) {
      where.elementIdRaw = elementId;
    }

    if (mode) {
      where.mode = modeMap[mode];
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        (where.createdAt as Record<string, Date>).gte = new Date(startDate);
      }
      if (endDate) {
        (where.createdAt as Record<string, Date>).lte = new Date(endDate);
      }
    }

    // Get total count
    const total = await prisma.response.count({ where });

    // Get responses
    const responses = await prisma.response.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        elementIdRaw: true,
        mode: true,
        content: true,
        title: true,
        rating: true,
        vote: true,
        pollOptions: true,
        pollSelected: true,
        experimentId: true,
        variant: true,
        endUserId: true,
        endUserMeta: true,
        createdAt: true,
      },
    });

    // Transform responses
    const data = responses.map((r: (typeof responses)[number]) => ({
      id: r.id,
      elementId: r.elementIdRaw,
      mode: Object.keys(modeMap).find((k) => modeMap[k] === r.mode) || r.mode.toLowerCase(),
      content: r.content,
      title: r.title,
      rating: r.rating,
      vote: r.vote ? r.vote.toLowerCase() : null,
      pollOptions: r.pollOptions,
      pollSelected: r.pollSelected,
      experimentId: r.experimentId,
      variant: r.variant,
      user: r.endUserId
        ? { id: r.endUserId, ...(r.endUserMeta as Record<string, unknown>) }
        : r.endUserMeta,
      createdAt: r.createdAt.toISOString(),
    }));

    return Response.json({
      data,
      pagination: {
        page,
        limit,
        total,
        hasMore: page * limit < total,
      },
    });
  } catch (error) {
    console.error('GET /api/v1/responses error:', error);
    return apiError('INTERNAL_ERROR', 'An unexpected error occurred', 500);
  }
}

// Handle CORS preflight
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Idempotency-Key',
    },
  });
}
