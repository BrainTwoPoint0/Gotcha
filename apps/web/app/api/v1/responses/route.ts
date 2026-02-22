import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateApiKey, apiError, apiSuccess, corsHeaders } from '@/lib/api-auth';
import {
  checkRateLimit,
  checkIdempotency,
  cacheIdempotencyResponse,
  type PlanType,
} from '@/lib/rate-limit';
import { submitResponseSchema, listResponsesSchema } from '@/lib/validations';
import { sendUsageWarningEmail } from '@/lib/emails/send';
import { shouldShowUpgradeWarning, isOverLimit } from '@/lib/plan-limits';
import { atomicIncrementUsage } from '@/lib/usage-atomic';

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

    // Parse body and check rate limit + idempotency in parallel
    const idempotencyKey = request.headers.get('idempotency-key');
    const planKey = apiKey.plan.toLowerCase() as PlanType;

    const [body, rateLimit, idempotencyResult] = await Promise.all([
      request.json(),
      checkRateLimit(apiKey.id, planKey),
      idempotencyKey ? checkIdempotency(idempotencyKey) : Promise.resolve(null),
    ]);

    if (!rateLimit.success) {
      return apiError('RATE_LIMITED', 'Too many requests', 429);
    }

    if (idempotencyResult?.isDuplicate && idempotencyResult.cachedResponse) {
      const cached = JSON.parse(idempotencyResult.cachedResponse);
      return Response.json(
        { ...cached, status: 'duplicate' },
        {
          status: 201,
          headers: { ...corsHeaders, ...rateLimit.headers },
        }
      );
    }

    // Validate request body
    const validation = submitResponseSchema.safeParse(body);
    if (!validation.success) {
      const firstError = validation.error.issues?.[0];
      return apiError('INVALID_REQUEST', firstError?.message || 'Invalid request body', 400);
    }

    const data = validation.data as typeof validation.data & {
      experimentId?: string;
      variant?: string;
    };

    // Generate response ID and timestamp up front so we can respond immediately
    const responseId = crypto.randomUUID();
    const createdAt = new Date();

    const result = {
      id: responseId,
      status: 'created' as const,
      createdAt: createdAt.toISOString(),
    };

    // Cache idempotency response early (fire-and-forget)
    if (idempotencyKey) {
      cacheIdempotencyResponse(idempotencyKey, JSON.stringify(result)).catch(() => {});
    }

    // DB writes (element lookup, response creation, usage tracking)
    const asyncWrite = async () => {
      try {
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
          const newElement = await prisma.element.create({
            data: {
              projectId: apiKey.projectId,
              elementId: data.elementId,
            },
          });
          elementDbId = newElement.id;
        }

        // Atomically reset (if new month) and increment usage counter
        await atomicIncrementUsage(apiKey.organizationId);

        // Check if this response exceeds the free limit
        let gated = false;
        if (apiKey.plan === 'FREE') {
          const subscription = await prisma.subscription.findUnique({
            where: { organizationId: apiKey.organizationId },
          });

          if (subscription) {
            gated = isOverLimit('FREE', subscription.responsesThisMonth);

            if (shouldShowUpgradeWarning('FREE', subscription.responsesThisMonth)) {
              const threshold = subscription.responsesThisMonth;
              if (threshold === 400 || threshold === 450 || threshold === 500) {
                sendUsageWarningEmail(apiKey.organizationId, threshold, 500).catch(console.error);
              }
            }
          }
        }

        // Create response (marked as gated if over limit)
        await prisma.response.create({
          data: {
            id: responseId,
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
            createdAt: createdAt,
            gated,
          },
        });
      } catch (err) {
        console.error('Async DB write failed for response:', responseId, err);
      }
    };

    // Await DB writes to ensure they complete on serverless (Netlify)
    await asyncWrite();

    return Response.json(result, {
      status: 201,
      headers: { ...corsHeaders, ...rateLimit.headers },
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

    return Response.json(
      {
        data,
        pagination: {
          page,
          limit,
          total,
          hasMore: page * limit < total,
        },
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('GET /api/v1/responses error:', error);
    return apiError('INTERNAL_ERROR', 'An unexpected error occurred', 500);
  }
}

// Handle CORS preflight
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}
